import fs from 'fs';
import XMLparser from 'xml2js';
import http from 'http';

export default class Xmldeal{

	sortEff = (a, b) => {
		if(!b) return 0
		if(b.indexOf('-') != -1) {
			return 1
		}
		if(a.replace(/[^0-9]/g, '').length > 3) {
			return 1
		}
		return 0
	}

  constructor(){
  	console.log('Xml開機');

	}
	
	parseEpisode(title) {
		// old: (\d{1,}(?:(?:[^BPp](?:\]))|&\d{1,}|(?:[~-]\d{1,})|\d+(^P)|(?: (?!AAC))))|(?:第\d{1,})|(?:【+[\d{1,}_END]+】)
		const reg1 = /\[\d{1,}\]|(?:\[(\d{1,2}[\& -][^P])\])|(?:\d{1,}[~-]\d{1,})|( \d{1,2} )|(?:第\d{1,}(\-\d{1,})?[^季期作])|(?:【+[\d{1,}_END]+([vV]\d{1}?)+】)|(\d{1,2}&\d{1,2})|(【\d{1,}】)|(\【\d{1,}[_]\w{1,}】)/g
		console.log(title)
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
			console.log(episode)
		}
	}


	request( options, limit) {
		console.log(options);
	  	http.request( options, (response) => {
	  	var xml = '';
	  	console.log('擷取中...');
	  	//another chunk of data has been recieved, so append it to `xml`
	  	response.on('data', (chunk) => {
	  	  xml += chunk;
	  	});
			
	  	//the whole response has been recieved, so we just print it out here
	  	  response.on('end', () => {
	  	  	//console.log(xml);
					// this.parseEpisode("[桜都字幕组][某科学的超电磁炮T/To Aru Kagaku no Railgun T][8-9][HEVC-10Bit-2160P AAC][外挂GB/BIG5][WEB-Rip][MKV+ass][v2]")
	  	    XMLparser.parseString(xml, (err, result) => {
						// console.dir(result.rss.channel[0].item)
						if(typeof result.rss.channel[0].item)
							result.rss.channel[0].item.forEach((itemData) => {
								this.parseEpisode(itemData.title[0])
							})
	  	      // fs.writeFile(/*path.join(__dirname, 'public') +*/ "web/data.json", JSON.stringify(result), function(err) {
	  	      //   if (err) {
						// 		console.log(err);
						// 	} else {
						// 		console.log("The file was saved!");
						// 	}
	  		  	// });
	  	    });
	  	  });

	  	}).end();
	}

}