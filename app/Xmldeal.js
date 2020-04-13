import fs from 'fs';
import XMLparser from 'xml2js';
import http from 'http';

export default class Xmldeal{

  constructor(){
  	console.log('Xml開機');

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
	  	    XMLparser.parseString(xml, (err, result) => {
	  	      fs.writeFile(/*path.join(__dirname, 'public') +*/ "web/data.json", JSON.stringify(result), function(err) {
	  	        if (err) {
	  		      console.log(err);
	  		    } else {
	  		      console.log("The file was saved!");
	  		    }
	  		  });
	  	    });
	  	  });

	  	}).end();
	}

}