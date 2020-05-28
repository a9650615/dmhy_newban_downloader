import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import Mime from 'mime-types'
import rimraf from 'rimraf'
import NewBanDatabase from '../db/NewBanDatabase'
import GoogleDriveDatabase from '../db/GoogleDriveDatabase'

const log = logger.getLogger('UploadGD')

const SCOPES = ['https://www.googleapis.com/auth/drive']
const TOKEN_PATH = './resource/token.json';

export default new class UploadGD {
  isReady = false
  drive = null
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  init() {
    return new Promise((resolve) => {
      fs.readFile('./resource/credentials.json', (err, content) => {
        if (err) return console.log('Please put google credentials file into resource folder:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        this.authorize(JSON.parse(content), async (auth) => {
          this.isReady = true
          await this.initDrive(auth)
          resolve()
          log.debug('Init Finish')
          this.autoUploadFileFromList()
        })
      })
    })
  }

  authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0])
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return this.getAccessToken(oAuth2Client, callback)
      oAuth2Client.setCredentials(JSON.parse(token))
      callback(oAuth2Client)
    });
  }

  getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl)
    this.rl.question('Enter the code from that page here: ', (code) => {
      this.rl.close()
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err)
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err)
          console.log('Token stored to', TOKEN_PATH)
        })
        callback(oAuth2Client)
      })
    })
  }

  initDrive(auth) {
    return new Promise(async (resolve, reject) => {
      const rootFolderId = await GoogleDriveDatabase.getRootFolderId()
      this.drive = google.drive({version: 'v3', auth})
      if (rootFolderId == null) {
        this.rl.question('輸入你想要設定的資料夾 ID : ', async (code) => {
          this.rl.close()
          await GoogleDriveDatabase.setRootFolderId(code)
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  autoUploadFileFromList() {
    setInterval(() => {
      GoogleDriveDatabase.uploadFromWaitingList()
    }, 5000)
    this.uploadFileFromWaitingList()
  }

  createFolderRecord(folderName, description, parentsFolder = null) {
    return new Promise(async (resolve, reject) => {
      const folderId = await GoogleDriveDatabase.getRootFolderId()
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: description,
        parents: [(parentsFolder || folderId)],
      }
      this.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          // Handle error
          log.error(err);
          reject(err)
        } else {
          log.debug(folderName, ' Folder Id: ', file.data.id);
          resolve(file.data.id)
        }
      })
    })
   
  }

  uploadFileRecord(filePath, fileName, description = null, parentFolderId) {
    const ext = fileName.split('.').pop()
    return new Promise(async (resolve, reject) => {
      const folderId = await GoogleDriveDatabase.getRootFolderId()
      const fileMetadata = {
        name: fileName,
        description: description,
        parents: [(parentFolderId || folderId)],
      }
      const media = {
        mimeType: Mime.lookup(`.${ext}`),
        body: fs.createReadStream(`${process.cwd()}${this.getOperSys()}tmp${this.getOperSys()}${filePath}`)
      }
      // console.log(fileMetadata, media)
      this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
        uploadType: 'resumable'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err)
          log.error(err)
          reject(err)
        } else {
          log.debug('Uploaded:', fileName)
          // console.log('File Id: ', file)
          resolve({
            filePath,
            fileName,
            id: file.data.id,
          })
        }
      })
    })
  }

  async createSeasonFolder(season) {
    const sea = season.match(/(\d{4})(\d{2})/)
    const folderID = await this.createFolderRecord(`${sea[1]} 年 ${parseInt(sea[2])} 月`)
    await GoogleDriveDatabase.setSeasonFolder(season, folderID)
    return folderID
  }

  getOperSys() {
    return (process.platform === 'win32'? '\\': '/')
  }

  splitFolderOfPath(path) {
    const folderPath = (path.match(/(.*)[\/\\]/g) || [''])[0]
    if (folderPath == '') {
      return []
    }
    const operForSys = this.getOperSys()
    let folderConbine = []
    folderConbine = folderPath.split(operForSys)
    folderConbine.pop() //remove last one
    return folderConbine
  }

  parseAllFolderInPath(path) {
    const operForSys = this.getOperSys()
    let folderConbine = this.splitFolderOfPath(path)
    let lastPath = ''
    return folderConbine.map((path) => {
      const parentPath = lastPath
      lastPath += operForSys + path
      return {
        path: lastPath,
        folderName: path,
        parentPath
      }
    })
  }

  async createFolderTreeOnGD(folderMap, nameInJpn) {
    let parentFolderId = ''
    for(let folder of folderMap) {
      if (folder.folderId) continue
      if (folder.parentPath == '') {
        parentFolderId = (await GoogleDriveDatabase.getMappingFolder(nameInJpn)).folderId
      } else {
        parentFolderId = GoogleDriveDatabase.getFolderMapByPath(folder.parentPath).folderId
      }
      const folderId = await this.createFolderRecord(folder.folderName, null, parentFolderId)
      await GoogleDriveDatabase.updateFolderIdOfFileFolderMapping(folder.path, folderId)
    }
  }

  async uploadFileToGD(files, nameInJpn) {
    let parentFolderId = (await GoogleDriveDatabase.getMappingFolder(nameInJpn)).folderId
    for(const file of files) {
      const folderPath = this.getOperSys() + (this.splitFolderOfPath(file.path).join(this.getOperSys()))
      let folderId = ''
      log.debug('Uploading: ', file.path)
      if (this.splitFolderOfPath(file.path).length == 0) { // upload directly
        folderId = (await GoogleDriveDatabase.getMappingFolder(nameInJpn)).folderId
      } else {
        folderId = GoogleDriveDatabase.getFolderMapByPath(folderPath).folderId
      }
      // todo: try catch of this
      await this.uploadFileRecord(file.path, (file.path.match(/[\/\\](.*)/) || ['', file.path])[1], null, folderId)
      await GoogleDriveDatabase.setUploadStatusFinish(file.path)
    }
  }

  deleteFile(path) {
    return new Promise(async (resolve, reject) => {
      rimraf(path, function () { resolve() });
    })
  }

  async finishUploadTask() {
    const uploadingData = await GoogleDriveDatabase.getNowUploadingData()
    const parentFolders = uploadingData.folderMap.filter((folder) => folder.parentPath == '')
    for(let file of uploadingData.files) {
      await this.deleteFile(`${process.cwd()}${this.getOperSys()}tmp${this.getOperSys()}${file}`)
    }
    for(let folder of parentFolders) {
      await this.deleteFile(`${process.cwd()}${this.getOperSys()}tmp${this.getOperSys()}${folder.path}`)
    }
    await GoogleDriveDatabase.removeUploadData()
    log.debug('Finished: ', uploadingData.name)
  }

  async uploadFileFromWaitingList() {
    let uploadingData = await GoogleDriveDatabase.getNowUploadingData()
    if (uploadingData) {
      const mappingFolder = await GoogleDriveDatabase.getMappingFolder(uploadingData.nameInJpn)
      for(let index in uploadingData.files) {
        GoogleDriveDatabase.setUploadFileFolderMapping(this.parseAllFolderInPath(uploadingData.files[index]))
      }
      // after create folder database then create it on GD
      uploadingData = await GoogleDriveDatabase.getNowUploadingData()
      await this.createFolderTreeOnGD(uploadingData.folderMap, uploadingData.nameInJpn)
      // after upload all folders to GD, then upload all files
      await this.uploadFileToGD(uploadingData.uploadStatus.filter((status) => status.finish == false), uploadingData.nameInJpn)
      // delete all file has uploaded
      await this.finishUploadTask()
    }

    setTimeout(this.uploadFileFromWaitingList.bind(this), 5000) // after finish, restart
  }

  // public method
  async prepareToUpload(data) {
    const banData = await NewBanDatabase.getNewBanByJpnName(data.nameInJpn)
    let folder = await GoogleDriveDatabase.getSeasonFolder(banData.season)
    let banFolder = await GoogleDriveDatabase.getMappingFolder(banData.nameInJpn)
    if (!folder) {
      folder = await this.createSeasonFolder(banData.season)
    }
    if(!banFolder) {
      const banFolderID = await this.createFolderRecord(`${banData.name} / ${banData.nameInJpn} (${banData.season})`, banData.description, folder)
      GoogleDriveDatabase.setMappingFolder(banData.nameInJpn, banFolderID, banData.season)
    }
    GoogleDriveDatabase.addUploadTask(data)
  }
}
