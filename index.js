import log4js from 'log4js'
const logger = log4js.getLogger()

global.log = logger// Inject log tool
global.logData = logger// Inject log tool
log.level = 'debug'

const app = require('./app').default

app()
// app.complete()

// console.log('今天是:'+CronDmhy.getYesterday());
// pipe(app)
// app.subscribe(() => {
// 	console.log('started');
// })
