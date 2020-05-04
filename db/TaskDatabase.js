import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'

const adapter = new FileAsync('resource/TaskDB.json', {
  defaultValue: {
    lastUpdate: 0,
    banList: [],
    downloadList: [],
  }
})

let db

export default new class TaskDataBase {
  constructor() {
    
  }

  async init() {
    db = (await LowDb(adapter))
    log.info('TaskDataBase: DB finish')
  }

  async updateBanInfo(nameInJpn = '', data = { teamId: -1 }) {
    const query = db.get('banList').find({ nameInJpn })
    const value = query.value()
    if (value == undefined) {
      db.get('banList').push({
        nameInJpn,
        episode: 0,
        teamId: data.teamId,
      }).write()
    } else {
      query.assign(Object.assign(value, data)).write()
    }
  }

  async addTask({  }) {

  }

  async searchBanTaskInfo(nameInJpn = '') {
    return await db.get('banList').find({ nameInJpn }).value()
  }
}
