import NewBanDatabase from '../db/NewBanDatabase'
import TaskDatabase from '../db/TaskDatabase'
import GoogleDriveDatabase from '../db/GoogleDriveDatabase'
import DownloadManager from '../lib/DownloadManager'

/**
 * Function flow: 
 * stop all downloading task
 * remove relative data from all databases
 */
export const finishBangumi = async (nameInJpn) => {
  const tasks = await TaskDatabase.searchTaskFromDownloadList(nameInJpn)
  if (tasks.length > 0) {
    tasks.forEach((task) => {
      if (task.infoHash) {
        DownloadManager.removeTask(task.infoHash)
      }
    })
  }
  if (nameInJpn) {
    TaskDatabase.removeTaskByNameInJpn(nameInJpn)
    TaskDatabase.removeBanDataByNameInJpn(nameInJpn)
    NewBanDatabase.removeByNameInJpn(nameInJpn)
    GoogleDriveDatabase.removeUploadTaskByNameInJpn(nameInJpn)
  }
}

