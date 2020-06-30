import _ from 'lodash'

export const METHOD_TYPE = {
	START_DOWNLOAD: 'START_DOWNLOAD',
	UPDATE_DOWNLOAD_STATUS: 'UPDATE_DOWNLOAD_STATUS',
	FINISH_DOWNLOAD_ITEM: 'FINISH_DOWNLOAD_ITEM',
}

export default new class WebSocket {
	userList = []
	io = null

	setIo(io) {
		this.io = io
		io.on('connection', (socket) => {
			this.userList.push(socket.id)

			socket.on('disconnect', () => {
				console.log('user disconnected');
				_.remove(this.userList, (el) => {
					return el == socket.id
				})
			})

		})
	}

	broadcast(type, data) {
		if (!this.io) return
		// console.log(type)
		this.io.emit(type, data)
	}
}
