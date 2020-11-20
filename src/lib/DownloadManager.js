import WebTorrent from 'webtorrent'
import TaskDatabase, { DOWNLOAD_STATUS } from '../db/TaskDatabase'
import UploadGD from './UploadGD'
import WebSocket, { METHOD_TYPE } from '../webSocket'
import trackerList from '../config/trackList'


const log = logger.getLogger('DownloadManager')

// Todo: Custom chunk store to get real data of file
class chunkStore {
  store = {}

  put(index, chunkBuffer, cb) {
    console.log('chunk put', index, chunkBuffer)
    this.store[index] = chunkBuffer
    cb()
  }

  get(index, option) {
    console.log('chunk read', index)
    return this.store[index] || true
  }

  close() {

  }

  destroy() {

  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default new class DownloadManager {
  downloader
  chunkStore = new chunkStore()

  constructor() {
    this.downloader = new WebTorrent({
      store: this.chunkStore,
    })

    this.downloader.on('torrent', this._onTorrent.bind(this))

    setInterval(this._checkStatus.bind(this), 5000)
    log.info('DownloadManager init')
  }

  _checkStatus() {
    if (this.downloader == undefined) return
    this.downloader.torrents.forEach(async (torrent) => {
      // console.log(torrent.infoHash)
      WebSocket.broadcast(METHOD_TYPE.UPDATE_DOWNLOAD_STATUS, {
        infoHash: torrent.infoHash,
        progress: (torrent.progress * 100).toFixed(2),
        downloadSpeed: formatBytes(torrent.downloadSpeed),
        ...await TaskDatabase.getTaskByHashInfo(torrent.infoHash),
      })
      if (torrent.done) {
        log.debug('Finished:', torrent.infoHash)
        // TaskDatabase.updateTaskByHash(torrent.infoHash, {
        //   status: DOWNLOAD_STATUS.FINISH,
        // })
        const data = await TaskDatabase.getTaskByHashInfo(torrent.infoHash)
        UploadGD.prepareToUpload(data)
        await TaskDatabase.removeTaskByHashInfo(torrent.infoHash)
        this.downloader.remove(torrent.infoHash)
        WebSocket.broadcast(METHOD_TYPE.FINISH_DOWNLOAD_ITEM, {
          infoHash: torrent.infoHash,
        })
      }
    })
    // console.log(formatBytes(this.downloader.downloadSpeed))
    // console.log('check')
  }
  
  _onTorrent(torrent) {
    // console.log(torrent)
    // console.log(torrent.infoHash)
    // this.downloader.remove(torrent.infoHash)
  }

  removeTask(infoHash) {
    if (this.downloader.torrents.find((torr) => torr.infoHash == infoHash) == undefined) return
    this.downloader.remove(infoHash, (err) => {
      log.warn(err)
    })
  }

  // parse tracker from magnet like &tr=https://opentracker.acgnx.se/announce
  parseTrackerFromMagnet(magnet) {
    const decodedMagnet = decodeURIComponent(magnet)
    const trackers = [ ...decodedMagnet.matchAll(/&tr=([a-zA-Z:\\//.\:\/0-9\-\_]*)/g) ]

    return trackers.map((trackData) => trackData[1])
  }
  
  downloadFile(torrent) {
    this.downloader.add(
      decodeURIComponent(torrent),
      {
        path: process.cwd() + '/tmp',
        announce: [ ...trackerList, ...this.parseTrackerFromMagnet(torrent)],
        maxWebConns: 20,
      },
      // (torr) => { console.log(torr.infoHash) }
    )
  }

  _setTaskInfo = (torr, link) => {
    // console.log('finish')
    // console.log(torr.infoHash)
    this.downloader.remove(torr.infoHash) // stop download
    log.debug('Get files of:', link)
    const files = torr.files.map((file) => {
     return file.path
    })
    TaskDatabase.updateTask(link, {
      files,
      infoHash: torr.infoHash,
      status: DOWNLOAD_STATUS.DOWNLOADING,
    })
  }

  // Pre fetch infoHash from magnet
  addFileToList(torrent, link) {
    // still fetch hash info
    if (this.downloader.get(torrent) !== null) {
      return 
    }
    this.downloader.add(
      decodeURIComponent(torrent),
      {
        path: process.cwd() + '/tmp',
        announce: [ ...trackerList, ...this.parseTrackerFromMagnet(torrent)],
      },
      (torr) => this._setTaskInfo(torr, link)
    )
  }

  start() {
    log.debug('Download task started')
    setInterval(() => {
      this.downloadFromDownloadList()
      this.downloadFromWaitingList()
    }, 5000)
  }

  async downloadFromDownloadList() {
    const downloadingList = await TaskDatabase.getDownloadingList() || []
    const torrentList = this.downloader.torrents.map((torr) => torr.infoHash)
    downloadingList.forEach((item) => {
      if (torrentList.indexOf(item.infoHash) == -1) {
        TaskDatabase.updateTaskByHash(item.infoHash, {
          status: DOWNLOAD_STATUS.DOWNLOADING,
        })
        this.downloadFile(item.magnet, item.link)
      }
    })
  }

  async downloadFromWaitingList() {
    const orderList = 3
    const downloadingList = (await TaskDatabase.getDownloadableList()) || []
    const torrentList = this.downloader.torrents.map((torr) => torr.infoHash)
    if (downloadingList.length < orderList) {
      const downloadableList = await TaskDatabase.getDownloadableList(orderList - downloadingList.length)
      downloadableList.forEach((item) => {
        if (torrentList.indexOf(item.infoHash) == -1) {
          this.addFileToList(item.magnet, item.link)
          TaskDatabase.updateTask(item.link, {
            status: DOWNLOAD_STATUS.SEEKING,
          })
        }
      })
    }
  }
}
