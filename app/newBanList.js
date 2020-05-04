import { Observable, from } from "rxjs"
import { switchMap, map, concatMap, mergeMap } from "rxjs/operators"
import NewBanCrawler from '../lib/NewBanCrawler'
import NewBanDatabase from '../db/NewBanDatabase'
import NewAnimeList from '../lib/NewAnimeList'
import CronDmhy, { SORT_ID } from '../lib/CronDmhy'
import SubList from '../config/subList'

const getSuggestList = (playedList) => new Promise((resolve, reject) => {
  log.info('取得推薦清單')
  let newList = []
  from(playedList).pipe(
    mergeMap(async (data) => {
      const suggest = await CronDmhy.searchSuggest(data.name.substring(0, 4))
      return Object.assign({}, data, {
        suggestName: suggest,
      })
    })
  ).subscribe({
    next(value) {
      newList.push(value)
    },
    complete() {
      resolve(newList)
    }
  })
})

export const updateNewListOfDay = new Observable(async (observable) => {
  log.info('取得今日新番列表')
  // console.log(observable)
  // observable.next()
  if (NewBanDatabase.needUpdateList()) {
    await NewBanDatabase.updateNewBanList(await NewBanCrawler.getDataFromList())
    // Update suggest name for list
    const playedList = await NewBanDatabase.searchHasPlayedList()
    const suggestList = await getSuggestList(playedList)
    await NewBanDatabase.updateNewBanList(suggestList)
  } else {
    log.info('不需要更新')
  }
  observable.next()
})

export const getDmhyDownloadableList = (banName = '') => new Observable(async () => {
  console.log(banName)
  const filterDate = new Date()
  filterDate.setFullYear(new Date().getFullYear() - 1)
  const data = await CronDmhy.searchXML({
    keyword : encodeURI(banName),
    filter : [""],
    team : '',
    sortId: SORT_ID.EPISODE,
    largeThanDate: filterDate,
  })
  console.log(data)
})

export const getTodayUpdateList = new Observable(async (observable) => {
  const newBanList = await NewBanDatabase.getNewBanOfDay(CronDmhy.getYesterday())
  // console.log(newBanList)
  for(let i in newBanList) {
    const newBan = newBanList[i]
    getDmhyDownloadableList(newBan.suggestName == ''? newBan.name.substring(0, 4): newBan.suggestName).subscribe(() => {

    })
  }
  // await NewAnimeList.getNewList()
  // const animeListOfToday = NewAnimeList.getListOfDay(CronDmhy.getYesterday())
	// for(let index in animeListOfToday) {
	// 	const list = animeListOfToday[index]
	// 	const subIndex = list[3].findIndex((subTeam) => {
	// 		return SubList.findIndex((list) => list.id === Number(subTeam.id)) > -1
	// 	})
	// 	console.log(`（推薦：${subIndex>-1?list[3][subIndex].name: "可憐啊，沒有"}）${list[1]} - ${list[3].map((data) => `${decodeURIComponent(data.name)}(${data.id})`).join(',')}`)
	// 	if(subIndex>-1) {
	// 		console.log(list[3][subIndex].searchLink)
	// 		console.log(list[3][subIndex].searchText)
	// 		// await CronDmhy.searchXML({
	// 		// 	keyword : list[3][subIndex].searchText,
	// 		// 	filter : [""],
	// 		// 	team : list[3][0].id,
	// 		// 	sortId: SORT_ID.EPISODE,
	// 		// });
	// 	}
	// }
})