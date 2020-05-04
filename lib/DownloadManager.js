import WebTorrent from 'webtorrent-hybrid'

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

    this.downloader.on('torrent', this._onTorrent)

    setInterval(this._checkStatus.bind(this), 2000)
    log.info('DownloadManager init')
  }

  _checkStatus() {
    if (this.downloader == undefined) return
    this.downloader.torrents.forEach((torrent) => {
      console.log(torrent.infoHash)
      console.log((torrent.progress * 100).toFixed(2))
      if (torrent.done) {
        this.downloader.remove(torrent.infoHash)
      }
    })
    // console.log(formatBytes(this.downloader.downloadSpeed))
    // console.log('check')
  }
  
  _onTorrent(torrent) {
    // console.log(torrent)
  }

  addFileToList(torrent) {
    this.downloader.add(
      torrent,
      {
        path: process.cwd() + '/tmp',
      },
      // (torr) => { console.log(torr) }
    )
  }
}
