import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import BaseDataBase from './_baseDatabase'

const log = logger.getLogger('TaskDatabase')

const adapter = new FileAsync('resource/TaskDB.json', {
  defaultValue: {
    lastUpdate: 0,
    banList: [],
    downloadList: [],
  }
})

export const DOWNLOAD_STATUS = {
  PAUSE: 0,
  WAITING: 1,
  SEEKING: 2,
  DOWNLOADING: 3,
  FINISH: 4,
}

let db

export default new class TaskDataBase extends BaseDataBase {
  // constructor() {
    
  // }

  async init() {
    db = (await LowDb(adapter))
    log.info('DB finish')
    super.init()
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

  async addTask(nameInJpn, { link, episode, isCHT, magnet, name }, maxEpisode) {
    const query = db.get('downloadList').find({ link })
    if (query.value() == undefined) {
      const banInfo = db.get('banList').find({ nameInJpn }).value()
      db.get('downloadList').push({
        nameInJpn,
        episode,
        isCHT,
        magnet,
        name,
        link,
        status: DOWNLOAD_STATUS.WAITING,
      }).write()
      log.info('Added: ',name, episode, maxEpisode, banInfo.episode)
      if (maxEpisode > banInfo.episode) {
        this.updateBanInfo(nameInJpn, {
          episode: maxEpisode,
        })
      }
    }
  }

  async searchTaskFromDownloadList(nameInJpn = '') {
    return await db.get('downloadList').filter({ nameInJpn }).value()
  }

  async searchBanTaskInfo(nameInJpn = '') {
    return await db.get('banList').find({ nameInJpn }).value()
  }

  async getDownloadingList() {
    return await db.get('downloadList').filter({ status: DOWNLOAD_STATUS.DOWNLOADING }).value()
  }

  async getDownloadableList(limit = 5) {
    return await db.get('downloadList').filter(({status}) => status == DOWNLOAD_STATUS.WAITING || status == status.SEEKING).take(limit).value()
  }

  async getTaskByHashInfo(infoHash) {
    return await db.get('downloadList').filter({ infoHash }).first().value()
  }

  async removeTaskByNameInJpn(nameInJpn) {
    return await db.get('downloadList').remove({ nameInJpn }).write()
  }

  async removeBanDataByNameInJpn(nameInJpn) {
    return await db.get('banList').remove({ nameInJpn }).write()
  }

  async removeTaskByHashInfo(infoHash) {
    return await db.get('downloadList').remove({ infoHash }).write()
  }

  async updateTask(link, assignData) {
    return await db.get('downloadList').find({ link }).assign(assignData).write()
  }

  async updateTaskByHash(infoHash, assignData) {
    return await db.get('downloadList').find({ infoHash }).assign(assignData).write()
  }
}
