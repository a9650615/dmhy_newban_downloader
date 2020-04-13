console.log('嗨!大家好~ 我是動漫花園試用機一號');

import fs from 'fs';

import Xmldeal from './app/Xmldeal'
import NewAnimeList from './app/NewAnimeList'
import SubList from './config/subList'

let options = {
	host : 'share.dmhy.org',
	path  : '/topics/rss/rss.xml',
	method: 'GET'
};

let config = {
	listfile : 'config/list.json',
	groupsfile: 'config/groups.json'
};

let search_sentence = "?keyword={keyword}&sort_id={sort_id}&team_id={team}&order=date-desc";
const SORT_ID = {
	ALL: 0,
	EPISODE: 2,
	SESSION: 31,
}

class Main {

  constructor(){
  	console.log('初始化');
  	this.Xmldeal = new Xmldeal();
  	this.config = {};
  	this.groups = {};
  	this.loadconfig();
  }

  /*
   *	載入基本資訊
   */

  loadconfig() {
  	this.config = JSON.parse(fs.readFileSync(config.listfile, 'utf8'));
  	this.groups = JSON.parse(fs.readFileSync(config.groupsfile, 'utf8'));
  }

  /*
   *	取得現在是星期幾
   */
	getDay() {
		return new Date().getDay();
	}
	 
	getYesterday() {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1)
		return yesterday.getDay();
	}

  searchXML( searchData = {
		sortId: 2
	} ) {
  	let sSentence = search_sentence
  	  .replace('{keyword}', encodeURIComponent(searchData.keyword) + '+' + searchData.filter.join('+'))
			.replace('{team}', searchData.team)
			.replace('{sort_id}', searchData.sortId ?? 0), //31 - 季度全集, 2 - 動畫
  	opt = options;
  	opt.path = options.path + sSentence;
  	this.Xmldeal.request(opt);
  }
  

}

let CronDmhy = new Main();
let AnimeList = new NewAnimeList();

console.log('今天是:'+CronDmhy.getYesterday());
// CronDmhy.searchXML({
// 	keyword : "辉夜",
// 	filter : [""],
// 	team : "581",
// 	sortId: SORT_ID.EPISODE,
// });

(async () => {
	await AnimeList.getNewList()
	const animeListOfToday = AnimeList.getListOfDay(CronDmhy.getYesterday())
	animeListOfToday.forEach((list) => {
		const subIndex = list[3].findIndex((subTeam) => {
			return SubList.findIndex((list) => list.id === Number(subTeam.id)) > -1
		})
		console.log(`（推薦：${subIndex>-1?list[3][subIndex].name: "可憐啊，沒有"}）${list[1]} - ${list[3].map((data) => `${decodeURIComponent(data.name)}(${data.id})`).join(',')}`)
	})
})()