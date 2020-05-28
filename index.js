import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'
import log4js from 'log4js'
import dotenv from 'dotenv'
let env

console.log(process.env.NODE_ENV)
if (process.env && process.env.NODE_ENV) {
	env = dotenv.config({path: '.env.' + process.env.NODE_ENV.trim()})
	console.log(env)
} else {
  env = dotenv.config({path: '.env.development'})
}

global.env = env

const logger = log4js.getLogger()

global.log = logger// Inject log tool
global.logger = log4js// Inject log tool
log.level = 'debug'

const app = require('./src/app').default
const server = require('./src/server').default

// const openServer = () => {
// 	const log = log4js.getLogger('ServerMessage')
// 	const worker = new Worker('./server.js', {
// 		workerData: {
// 			PORT: env.parsed.PORT
// 		}
// 	})
// 	worker.on('message',(data) => {
// 		switch(data.type) {
// 			case 1:
// 				log.error(data.message); break
// 			case 2:
// 				log.debug(data.message); break
// 			case 3:
// 				log.info(data.message); break
// 			case 4:
// 				log.warn(data.message); break
// 		}
// 	})
// 	worker.on('error', (data) => log.error(data))
// 	worker.on('exit', (code) => {
// 		if (code !== 0)
// 			log.debug(`Worker stopped with exit code ${code}`)
// 	})
// }

if (env.parsed) {
	if (env.parsed.OPEN_API) {
		new server()
		app()
	}
} else {
	// don't have any environment file
	app()
}

// app()
// app.complete()

// console.log('今天是:'+CronDmhy.getYesterday());
// pipe(app)
// app.subscribe(() => {
// 	console.log('started');
// })
