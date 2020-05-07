import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'

const log = logger.getLogger('Google Drive Database')

const adapter = new FileAsync('resource/GDDB.json', {
  defaultValue: {
    rootFolder: null,
    seasonFolder: {},
    mappingFolder: [],
    uploadList: [],
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

  async addUploadTask({ nameInJpn, files }) {
    files.map((file) => {
      const query = db.get('uploadList').find({ file })

      if (query.value() == undefined) {
        db.get('uploadList').push({
          nameInJpn,
          file,
        }).write()
        log.info('Added to upload list: ', nameInJpn, file)
       
      }
    })
  }

}
