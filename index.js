console.log('嗨!大家好~ 我是動漫花園試用機一號');

import DmhyHelper, { SORT_ID } from './app/CronDmhy'
import NewAnimeList from './app/NewAnimeList'
import SubList from './config/subList'
import NewBanCrawler from './app/NewBanCrawler'

let CronDmhy = new DmhyHelper();
let AnimeList = new NewAnimeList();

console.log('今天是:'+CronDmhy.getYesterday());

(async () => {
	
	await AnimeList.getNewList()
	const animeListOfToday = AnimeList.getListOfDay(CronDmhy.getYesterday())
	for(let index in animeListOfToday) {
		const list = animeListOfToday[index]
		const subIndex = list[3].findIndex((subTeam) => {
			return SubList.findIndex((list) => list.id === Number(subTeam.id)) > -1
		})
		console.log(`（推薦：${subIndex>-1?list[3][subIndex].name: "可憐啊，沒有"}）${list[1]} - ${list[3].map((data) => `${decodeURIComponent(data.name)}(${data.id})`).join(',')}`)
		if(subIndex>-1) {
			console.log(list[3][subIndex].searchLink)
			console.log(list[3][subIndex].searchText)
			await CronDmhy.searchXML({
				keyword : list[3][subIndex].searchText,
				filter : [""],
				team : list[3][0].id,
				sortId: SORT_ID.EPISODE,
			});
		}
	}
})()