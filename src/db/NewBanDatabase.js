import LowDb from 'lowdb'
import FileAsync from 'lowdb/adapters/FileAsync'
import BaseDataBase from './_baseDatabase'

const adapter = new FileAsync('resource/NewBanDB.json', {
  defaultValue: {
    lastUpdate: 0,
    newBanList: [],
  }
})
let db

export default new class NewBanDatabase extends BaseDataBase {
  // constructor() {
  // }

  async init() {
    db = (await LowDb(adapter))
    log.info('db finish')
    super.init()
  }

  needUpdateList() {
    return (Date.now() - db.get('lastUpdate').value()) / 1000 > 86400 * 3 // 3days
  }

  _checkIsEmpty(name) {
    return name == '' || !name
  }

  /**
   * @param {Object[]} list
   * @param {string} list[].name
   * @param {number} list[].dayOfWeek
   * @param {string} list[].date
   * @param {string} list[].time
   * @param {string} list[].carrier
   * @param {string} list[].nameInJpn
   */
  async updateNewBanList(list = []) {
    // if(!this.needUpdateList()) return;
  
    const newBanList = db.get('newBanList')
    let lastQuery = db.get('newBanList')
    list.forEach(async (item) => {
      const findItem = newBanList.find({
        nameInJpn: item.nameInJpn
      })
      if (findItem.value()) {
        await findItem.assign({
          ...item,
          suggestName:  this._checkIsEmpty(findItem.value().suggestName)? item.suggestName: findItem.value().suggestName
        }).write()
      } else {
        lastQuery = lastQuery.push({
          ...item,
          suggestName: '',
        })
      }
    })
    await lastQuery.write()
    await db.set('lastUpdate', Date.now()).write()
  }

  async searchHasPlayedList() {
    return await db.get('newBanList').filter({
      suggestName: '',
    }).reject(['dayOfWeek', '']).value()
  }

  async getNewBanOfDay(day = 0) {
    return await db.get('newBanList').filter({
      dayOfWeek: day,
    }).value()
  }

  async getNewBanByJpnName(nameInJpn) {
    return await db.get('newBanList').filter({
      nameInJpn
    }).first().value()
  }

  async removeByNameInJpn(nameInJpn) {
    return await db.get('newBanList').remove({ nameInJpn }).write()
  }
}
