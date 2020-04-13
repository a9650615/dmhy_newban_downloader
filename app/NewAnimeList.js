import Axios from 'axios'
import Cheerio from 'cheerio'

export default class NewAnimeList {

  listData = {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    long: [],
  }

  constructor() {
    
  }

  _dealResData(array) {
    if (!array) return

    return array.map((arr) => {
      const subList = []

      Cheerio('a', arr[3]).each((i, ele) => {
        const linkText = Cheerio(ele).attr('href').match(/\/topics\/list\?keyword=([a-zA-Z0-9%+-_]*)\+team_id%3A(\d*)/)
        
        subList.push({
          name: Cheerio(ele).text(),
          id: linkText[2]
        });
      })
      // console.log(subList)

      arr[3] = subList
      return arr
    })

  }

  _runSandbox(script) {
    let sunword='', monword='', tueword='', wedword='', thuword='', friword='', satword=''
    let sunarray = new Array(),
      monarray = new Array(),
      tuearray = new Array(),
      wedarray = new Array(),
      thuarray = new Array(),
      friarray = new Array(),
      satarray = new Array(),
      longarray = new Array()

    eval(script)

    this.listData = {
      sun: this._dealResData(sunarray),
      mon: this._dealResData(monarray),
      tue: this._dealResData(tuearray),
      wed: this._dealResData(wedarray),
      thu: this._dealResData(thuarray),
      fri: this._dealResData(friarray),
      sat: this._dealResData(satarray),
      long: longarray,
    }
  }

  async getNewList() {
    const data = await Axios.get('https://share.dmhy.org/', {
      responseType: 'text'
    })
    const $ = Cheerio.load(data.data)
    // console.log(data.data.slice(100))
    
    this._runSandbox($('.main>script[type="text/javascript"]').html());
  }

  getListOfDay(day) {
    const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return this.listData[dayName[day]]
  }
}