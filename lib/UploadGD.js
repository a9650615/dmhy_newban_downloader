import fs from 'fs'
import readline from 'readline'
import { google } from 'googleapis'
import GoogleDriveDatabase from '../db/GoogleDriveDatabase'

const log = logger.getLogger('UploadGD')

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
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
        });
      });
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
      this.rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err)
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err)
          console.log('Token stored to', TOKEN_PATH)
        });
        callback(oAuth2Client)
      });
    });
  }

  initDrive(auth) {
    return new Promise(async (resolve, reject) => {
      const rootFolderId = await GoogleDriveDatabase.getRootFolderId()
      if (rootFolderId == null) {
        this.rl.question('輸入你想要設定的資料夾 ID : ', async (code) => {
          this.rl.close()
          await GoogleDriveDatabase.setRootFolderId(code)
          resolve()
        })
      }
  
      this.drive = google.drive({version: 'v3', auth})
    })
  }
}
