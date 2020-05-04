import TaskDatabase from '../db/TaskDatabase'

export default new class TaskManager {
  async searchLastData(nameInJpn = '') {
    return await TaskDatabase.searchBanTaskInfo(nameInJpn)
  }

  async updateInfoData(nameInJpn = '', data = {}) {
    await TaskDatabase.updateBanInfo(nameInJpn, data)
  }
}
