import NewBanDatabase from '../db/NewBanDatabase'
import TaskDatabase from '../db/TaskDatabase'
import GoogleDriveDatabase from '../db/GoogleDriveDatabase'
import { updateNewListOfDay, getTodayUpdateList } from './newBanList'
import DownloadManager from '../lib/DownloadManager'
import UploadGD from '../lib/UploadGD'

// Flow: 新番列表 -> 查詢資料 -> 下載 -> 下載列表

const app = async () => {
  await NewBanDatabase.init()
  await TaskDatabase.init()
  updateNewListOfDay.subscribe((data) => {
    // console.log(data)
    getTodayUpdateList.subscribe((data) => {
  await GoogleDriveDatabase.init()
  await UploadGD.init()
  DownloadManager.start()
  
    })
  })
}
// UpdateNewListOfDay.subscribe(app)

export default app
