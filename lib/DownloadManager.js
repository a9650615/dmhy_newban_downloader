import WebTorrent from 'webtorrent'
import TaskDatabase, { DOWNLOAD_STATUS } from '../db/TaskDatabase'
import UploadGD from '../lib/UploadGD'


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

    setInterval(this._checkStatus.bind(this), 2000)
    log.info('DownloadManager init')
  }

  _checkStatus() {
    if (this.downloader == undefined) return
    this.downloader.torrents.forEach(async (torrent) => {
      // console.log(torrent.infoHash)
      console.log((torrent.progress * 100).toFixed(2))
      if (torrent.done) {
        log.debug('Finished:', torrent.infoHash)
        // TaskDatabase.updateTaskByHash(torrent.infoHash, {
        //   status: DOWNLOAD_STATUS.FINISH,
        // })
        const data =  await TaskDatabase.getTaskByHashInfo(torrent.infoHash)
        UploadGD.moveToUpload(data)
        this.downloader.remove(torrent.infoHash)
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
  
  downloadFile(torrent) {
    this.downloader.add(
      torrent,
      {
        path: process.cwd() + '/tmp',
      },
      // (torr) => { console.log(torr.infoHash) }
    )
  }

  _setTaskInfo = (torr, link) => {
    // console.log('finish')
    // console.log(torr)
    const files = torr.files.map((file) => {
     return file.path
    })
    TaskDatabase.updateTask(link, {
      files,
      infoHash: torr.infoHash,
      status: DOWNLOAD_STATUS.DOWNLOADING,
    })
    this.downloader.remove(torr.infoHash)
  }

  addFileToList(torrent, link) {
    this.downloader.add(
      torrent,
      {
        path: process.cwd() + '/tmp',
      },
      (torr) => this._setTaskInfo(torr, link)
    )
  }

  start() {
    this.downloadFromDownloadList()
    // setInterval(() => {
    //   this.downloadFromDownloadList()
    //   this.downloadFromWaitingList()
    // }, 5000)
  }

  async downloadFromDownloadList() {
    log.debug('Download task started')
    const downloadingList = await TaskDatabase.getDownloadingList() || []
    const torrentList = this.downloader.torrents.map((torr) => torr.infoHash)
    downloadingList.forEach((item) => {
      if (torrentList.indexOf(item.infoHash) == -1) {
        this.downloadFile(item.magnet, item.link)
      }
    })
  }

  async downloadFromWaitingList() {
    const orderList = 1
    const downloadingList = (await TaskDatabase.getDownloadingList()) || []
    if (downloadingList.length < orderList) {
      const downloadableList = await TaskDatabase.getDownloadableList(orderList - downloadingList.length)
      downloadableList.forEach((item) => {
        this.addFileToList(item.magnet, item.link)
      })
    }
  }
}
