import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'

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

export default new class TaskDataBase {
  constructor() {
    
  }

  async init() {
    db = (await LowDb(adapter))
    log.info('DB finish')
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
        infoHash
      }).write()
      log.info('Added to upload list: ', name)
     
    }
  }

  async uploadFromWaitingList() {
    const nowUploading = await db.get('uploadingData').value()
    if (nowUploading == null) {
      const query = await (db.get('uploadList').first())
      await db.set('uploadingData', query.value()).write()
      await db.get('uploadList').remove({ infoHash: query.value().infoHash }).write()
    }
  }

}
