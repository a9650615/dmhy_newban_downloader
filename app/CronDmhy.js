import fs from 'fs';
import Xmldeal from './Xmldeal'

const options = {
	host : 'share.dmhy.org',
	path  : '/topics/rss/rss.xml',
	method: 'GET'
};

let config = {
	listfile : 'config/list.json',
	groupsfile: 'config/groups.json'
};

let search_sentence = "?keyword={keyword}&sort_id={sort_id}&team_id={team}&order=date-desc";

export const SORT_ID = {
	ALL: 0,
	EPISODE: 2,
	SESSION: 31,
}

export default class CronDmhy {

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

  async searchXML( searchData = {
    sortId: 2
  } ) {
    let sSentence = search_sentence
      .replace('{keyword}', (searchData.keyword) + '+' + searchData.filter.join('+'))
      .replace('{team}', searchData.team)
      .replace('{sort_id}', searchData.sortId ?? 0), //31 - 季度全集, 2 - 動畫
    opt = Object.assign({}, options);
    opt.url = 'https://' + options.host + options.path + sSentence;
    return await this.Xmldeal.request(opt);
  }
  
}
