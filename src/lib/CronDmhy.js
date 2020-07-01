import fs from 'fs'
import Xmldeal from './Xmldeal'
import Axios from 'axios'
import Hooman from 'hooman'
import Cheerio from 'cheerio'
import SubList from '../config/subList'
import TaskManager from './TaskManager'

const log = logger.getLogger('CronDmhy')

const options = {
	host : 'share.dmhy.org',
	// path  : '/topics/rss/rss.xml', //xml path
	path  : '/topics/list', //xml path
	method: 'GET'
};

let config = {
	listfile : 'src/config/list.json',
	groupsfile: 'src/config/groups.json'
};

let search_sentence = "?keyword={keyword}&sort_id={sort_id}&team_id={team}&order=date-desc";

export const SORT_ID = {
	ALL: 0,
	EPISODE: 2,
	SESSION: 31,
}

export default new class CronDmhy {

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

	_convertSunToSeven(day) {
		return day === 0? 7: day
	}

  /*
   *	取得現在是星期幾
   */
	getDay() {
		return this._convertSunToSeven(new Date().getDay())
	}
	 
	getYesterday() {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1)
		return this._convertSunToSeven(yesterday.getDay())
	}

	parseEpisode(title) {
		// old: (\d{1,}(?:(?:[^BPp](?:\]))|&\d{1,}|(?:[~-]\d{1,})|\d+(^P)|(?: (?!AAC))))|(?:第\d{1,})|(?:【+[\d{1,}_END]+】)
		const reg1 = /\[\d{1,}\]|(?:\[(\d{1,2}[\& -][^P])\])|(?:\d{1,}[~-]\d{1,})|( \d{1,2} )|(?:第\d{1,}(\-\d{1,})?[^季期作])|(?:【+[\d{1,}_END]+([vV]\d{1}?)+】)|(\d{1,2}&\d{1,2})|(【\d{1,}】)|(\【\d{1,}[_]\w{1,}】)/g
		// console.log(title)
		const matchData = title.match(reg1)
		if (matchData) {
			const sortEpisode = matchData.sort(this.sortEff)
			const dealFirst = sortEpisode[0].replace(/[\[\]]/g, '');
			const splitData = dealFirst.split('-')
			const splitData2 = dealFirst.split('&')
			const episode = []
			// console.log(splitData, splitData2)
			if(splitData.length > 1) {
				for(let i =parseInt(splitData[0]); i<=parseInt(splitData[1]); i++) {
					episode.push(i);
				}
			}
			else if(splitData2.length > 1) {
				splitData2.forEach((data) => {
					episode.push(parseInt(data));
				})
			}
			else {
				episode.push(parseInt(sortEpisode[0].replace(/[^0-9]/g, '')));
			}
			return episode
		}
	}

	parseIsBig5OrGB(name) {
		return name.match(/繁體|BIG5|CHT|繁体|简繁/g) != null
	}

	async searchDmhyList(url, largeThanEpisode = 0, largeThanDate = null, isCHT = false) {
		log.info('正在 Dmhy 查詢列表中: ', url)
		const htmlData = (await Hooman.get(url)).body
		const $ = Cheerio.load(htmlData)
		const dataList = []
		$('.tablesorter>tbody>tr').each((index, element) => {
			let itemData = {
				name: $(element).find('.title>a').text().trim(),
				publicTime: $(element).find('td:first-child>span').text().trim(),
				teamId: ($(element).find('.title .tag a').attr('href')||'').replace('/topics/list/team_id/', ''),
				episode: this.parseEpisode($(element).find('.title>a').text().trim()),
				isCHT: this.parseIsBig5OrGB($(element).find('.title>a').text().trim()),
				magnet: $(element).find('.download-arrow.arrow-magnet').attr('href'),
				link: $(element).find('.title>a').attr('href'),
			}

			if (itemData.episode == undefined) {
				return
			}
			if (TaskManager._getMaxEpisode(itemData.episode) <= largeThanEpisode) {
				return
			}
			if (largeThanDate && itemData.publicTime) {
				if (largeThanDate > new Date(itemData.publicTime)) {
					return
				}
			}
			if (isCHT && itemData.isCHT == false) {
				return
			}
			
			dataList.push(itemData)
		})
		return dataList
	}

  async searchXML( searchData = {
		sortId: 2,
		largeThanEpisode: 0,
		largeThanDate: null,
		isCHT: false,
  } ) {
    let sSentence = search_sentence
      .replace('{keyword}', (searchData.keyword) + '+' + searchData.filter.join('+'))
      .replace('{team}', searchData.team)
      .replace('{sort_id}', searchData.sortId ?? 0), //31 - 季度全集, 2 - 動畫
    opt = Object.assign({}, options);
		opt.url = 'https://' + options.host + options.path + sSentence;
		return await this.searchDmhyList(opt.url, searchData.largeThanEpisode, searchData.largeThanDate, searchData.isCHT)
    // return await this.Xmldeal.request(opt);
	}
	
	async searchSuggest(name = '') {
		const data = (await Axios.get(`https://share.dmhy.org/topics/search-suggest/?q=${encodeURI(name)}&limit=10`)).data
		return data.length > 0? data[0].search_keyword: ''
	}

	async searchBestTeamID(banName) {
		const data = await this.searchXML({
			keyword : encodeURI(banName),
			filter : [""],
			team : '',
			sortId: SORT_ID.EPISODE,
			// largeThanDate: filterDate,
		})

		let bestId = -1
		for(let i in data) {
			const index = SubList.findIndex((list) => (list.id) === Number(data[i].teamId))
			if (index > -1) {
				bestId = index
				break
			}
		}

		return (SubList[bestId] || {id: -1}).id
	}
  
}
