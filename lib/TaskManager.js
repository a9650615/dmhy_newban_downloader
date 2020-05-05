import TaskDatabase from '../db/TaskDatabase'

export default new class TaskManager {
  async searchLastData(nameInJpn = '') {
    return await TaskDatabase.searchBanTaskInfo(nameInJpn)
  }

  async updateInfoData(nameInJpn = '', data = {}) {
    await TaskDatabase.updateBanInfo(nameInJpn, data)
  }

  _getMaxEpisode(episode = []) {
    return Math.max(...episode)
  }

  async addDownloadTask(nameInJpn = '', data) {
    await TaskDatabase.addTask(nameInJpn, data, this._getMaxEpisode(data.episode))
  }
}
