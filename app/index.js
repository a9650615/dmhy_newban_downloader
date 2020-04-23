import log4js from 'log4js'
import NewBanDatabase from '../db/NewBanDatabase'
import { updateNewListOfDay, getTodayUpdateList } from './newBanList'

const logger = log4js.getLogger();

global.log = logger// Inject log tool
log.level = 'debug';
// Flow: 新番列表 -> 查詢資料 -> 下載 -> 下載列表

const app = async () => {
  await NewBanDatabase.init()
  updateNewListOfDay.subscribe((data) => {
    // console.log(data)
  })
  getTodayUpdateList.subscribe((data) => {

  })
}
// UpdateNewListOfDay.subscribe(app)

export default app
