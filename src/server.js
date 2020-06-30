// const {
// 	workerData, parentPort
// } = require('worker_threads')
import fs from 'fs'
import path from 'path'
import Koa from 'koa'
import serve from 'koa-static'
import cors from '@koa/cors'
import webSocket from './webSocket'
const log = logger.getLogger('API SERVER')
const app = new Koa()
let server
if (env.parsed.FORCE_HTTPS) {
	server = require('https').createServer({
		cert: fs.readFileSync(path.resolve(__dirname, '../resource/certificate.pem')),
		key: fs.readFileSync(path.resolve(__dirname, '../resource/privatekey.pem'))
	}, app.callback())
} else {
	server = require('http').createServer(app.callback())
}

const io = require('socket.io')(server)

webSocket.setIo(io)

// logger
const LOGTYPE = {
	ERROR: 1,
	DEBUG: 2,
	INFO: 3,
	WARN: 4,
}

// console.log('started', workerData)
// parentPort.postMessage({type: LOGTYPE.INFO, message: 'api server 已啟動'})
app.use(cors())
app.use(serve(process.cwd() + '/resource'))

app.use(async (ctx, next) => {
	await next();
	const rt = ctx.response.get('X-Response-Time');
	console.log(`${ctx.method} ${ctx.url} - ${rt}`);
})

// x-response-time

app.use(async (ctx, next) => {
	const start = Date.now();
	await next();
	const ms = Date.now() - start;
	ctx.set('X-Response-Time', `${ms}ms`);
})

// response

app.use(async ctx => {
	ctx.body = 'Welcome to dmhy downloader api';
})

class ApiServer {
	constructor() {
		server.listen(env.parsed.PORT, () => {
			log.info(`API server has listen on port:${env.parsed.PORT}, HTTPS: ${env.parsed.FORCE_HTTPS}`)
		})
	}
}

export default ApiServer
