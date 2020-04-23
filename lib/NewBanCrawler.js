import axios from 'axios'
import Cheerio from 'cheerio'
// import NewBanDatabase from '../db/NewBanDatabase'

export default new class NewBanCrawler {
  constructor() {
    this.getDataFromList()
  }

  async getDataFromList() {
    try {
      const acgSecretData = await axios.get('https://acgsecrets.hk/bangumi/')
      const dataList = this.parseList(acgSecretData.data)
      // NewBanDatabase.updateNewBanList(dataList)
      return dataList
    } catch (e) {
      console.warn(e)
    }
  }

  convertDayToNumber(chineseDay) {
    return {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      日: 7,
    }[chineseDay]
  }

  parseList(html) {
    const $ = Cheerio.load(html)
    const bangumiTitle = $('.site-content header[acgs-type="bangumi_table_id"] > h1').text().match(/(\d{1,})年(\d{1,2})月/)
    let res = []
    $(`[acgs-bangumi-anime-id]`).each((i, elem) => {
      let date="", time="", dayOfWeek=''
      const timeToday = $(elem).find('.anime_onair.time_today').text()
      if(timeToday != '時間未定') {
        let qlm = timeToday.match(/播放日期：(\d{1,2})月(\d{1,2})日起／+每週(.{1}).*／(\d{1,2})時(\d{1,2})分/)
        if(qlm){
            date=qlm[1]+'/'+qlm[2]
            time=qlm[4]+':'+qlm[5]
            dayOfWeek = this.convertDayToNumber(qlm[3])
        }
      }
      res.push({
          name: $(elem).find('.entity_localized_name').text(),
          dayOfWeek,        
          date,                  
          time,             
          carrier: {原創作品: "Original",漫畫改編: "Comic",小說改編: "Novel",遊戲改編: "Game",改編作品: "Original"}[$(elem).find('.anime_tag tags').text()]||"Original",                
          season:  `${bangumiTitle[1]}${bangumiTitle[2]}`,                   
          nameInJpn: $(elem).find('.entity_original_name').text(),      
          img: $(elem).find('.anime_cover_image').attr("acgs-img-data-url"),
          official: $(elem).find('.anime_links a')?$(elem).find('.anime_links a').attr('href'):'',     
          description: $(elem).find('.anime_story')?$(elem).find('.anime_story').text():"",
          
      })
    })

    // console.log(JSON.stringify(res, null, 2));

    return res
  }

}
