import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import BaseDataBase from './_baseDatabase'

const log = logger.getLogger('Google Drive Database')

const adapter = new FileAsync('resource/GDDB.json', {
  defaultValue: {
    rootFolder: null,
    seasonFolder: {},
    mappingFolder: [],
    uploadList: [],
    uploadingData: null,
  }
})

let db

export default new class TaskDataBase extends BaseDataBase {
  // constructor() {
    
  // }

  async init() {
    db = (await LowDb(adapter))
    log.info('DB finish')
    super.init()
  }

  async getRootFolderId() {
    return await db.get('rootFolder').value()
  }

  async setRootFolderId(token) {
    return await db.set('rootFolder', token).write()
  }

  async getMappingFolder(nameInJpn) {
    return await db.get('mappingFolder').find({ nameInJpn }).value()
  }

  async setMappingFolder(nameInJpn, folderId, season) {
    const query = db.get('mappingFolder').find({ nameInJpn })
    if (query.value() == undefined) {

    }
    return await db.get('mappingFolder').push({
      nameInJpn,
      folderId,
      season,
    }).write()
  }

  async getSeasonFolder(season) {
    return await db.get('seasonFolder').get(season).value()
  }
  
  async setSeasonFolder(season, folderId) {
    return await db.get('seasonFolder').set(season, folderId).write()
  }

  async addUploadTask({ nameInJpn, files, name, infoHash }) {
    const query = db.get('uploadList').find({ name })
    const uploading = await db.get('uploadingData').value() || { infoHash: null }
    if (query.value() == undefined && uploading.infoHash != infoHash) {
      db.get('uploadList').push({
        nameInJpn,
        name,
        files,
        infoHash,
        folderMap: [],
        uploadStatus: files.map((file) => ({ path: file, finish: false })),
      }).write()
      log.info('Added to upload list: ', name)
     
    }
  }

  async uploadFromWaitingList() {
    const nowUploading = await db.get('uploadingData').value()
    if (nowUploading == null) {
      const query = await (db.get('uploadList').first())
      if (query.value()) {
        await db.set('uploadingData', query.value()).write()
        await db.get('uploadList').remove({ infoHash: query.value().infoHash }).write()
      }
    }
  }

  async getNowUploadingData() {
    return await db.get('uploadingData').value()
  }

  async removeUploadData() {
    return await db.set('uploadingData', null).write()
  }

  async removeUploadTaskByNameInJpn(nameInJpn) {
    await db.get('uploadList').remove({ nameInJpn }).write()
  }

  async removeMappingFolderByNameInJpn(nameInJpn) {
    await db.get('mappingFolder').remove({ nameInJpn }).write()
  }

  async setUploadFileFolderMapping(folderData = []) {
    for(let index in folderData) {
      const folder = folderData[index]
      const folderDB = this.getFolderMapByPath(folder.path)
      if (folderDB == undefined) {
        db.get('uploadingData.folderMap').push(folder).write()
      }
    }
  }

  getFolderMapByPath(path) {
    return db.get('uploadingData.folderMap').find({ path }).value()
  }

  async updateFolderIdOfFileFolderMapping(path, folderId) {
    return await db.get('uploadingData.folderMap').find({ path }).assign({
      folderId
    }).write()
  }

  async setUploadStatusFinish(path) {
    return await db.get('uploadingData.uploadStatus').find({ path }).assign({
      finish: true,
    }).write()
  }

}
