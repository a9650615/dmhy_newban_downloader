import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'

const log = logger.getLogger('Google Drive Database')

const adapter = new FileAsync('resource/GDDB.json', {
  defaultValue: {
    rootFolder: null,
    uploadList: [],
    mappingFolder: [],
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

}
