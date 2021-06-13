const express = require('express')
const bodyParser = require('body-parser')
const http = require('http');
const RTCMultiConnectionServer = require('rtcmulticonnection-server')
const app = express();

app.use(bodyParser.json());

var PORT = 3000;

const jsonPath = {
	config: 'config.json',
	logs: 'logs.json'
}

const BASH_COLORS_HELPER = RTCMultiConnectionServer.BASH_COLORS_HELPER;
const getValuesFromConfigJson = RTCMultiConnectionServer.getValuesFromConfigJson;
const getBashParameters = RTCMultiConnectionServer.getBashParameters;

var config = getValuesFromConfigJson(jsonPath);
config = getBashParameters(config, BASH_COLORS_HELPER);

let io = require('socket.io').listen(app.listen(PORT, function() {
	console.log(`Server run on port ${PORT}`);
	return {
		pingTimeout: 2000,
  		pingInterval: 10000
	}
}));

io.sockets.on('connection', function(socket) {
	RTCMultiConnectionServer.addSocket(socket, config);

	/**
	  * Get current user list in room
	  *
	  * @emit monit
	  */
	socket.on('monitor', function(payload) {
		let socs = io.sockets.connected;
		io.of('/').in(payload.channel).clients((error, clients) => {
			if (error) throw error;
			let client_rooms = Object.values(clients);

			io.in(socket.channel).emit('monit', Object.values(socs).filter(item => item.channel != null && client_rooms.indexOf(item.id) != -1).map(item => item.user))
		});
	})

	/**
	  * Get current user list in room
	  *
	  * @emit monit
	  */
	 socket.on('monitor_student', function(payload) {
		let socs = io.sockets.connected;
		io.of('/').in(payload.channel).clients((error, clients) => {
			if (error) throw error;
			let client_rooms = Object.values(clients);

			io.in(socket.channel).emit('monit_student', Object.values(socs).filter(item => item.channel != null && client_rooms.indexOf(item.id) != -1).map(item => item.user))
		});
	})

	/**
	 * Assign user to room
	 *
	 * @emit is_online
	 */
	socket.on('getin', function(payload) {
		socket.user = payload.user
		socket.channel = payload.channel
		socket.token = payload.token

		socket.join(socket.channel)
		// console.log((typeof socket.user != 'undefined' ? socket.user.email : 'Anonymous')+' Join to '+socket.channel + ' with ip '+(typeof socket.user != 'undefined' ? socket.user.ip : 'unknown'))
		io.in(socket.channel).emit(`is_online`, payload.user);
	})

	/**
	 * Assign user to room
	 *
	 * @emit is_online
	 */
	 socket.on('getin_student', function(payload) {
		socket.user = payload.user
		socket.channel = payload.channel
		socket.token = payload.token

		socket.join(socket.channel)
		// console.log((typeof socket.user != 'undefined' ? socket.user.no_ujian : 'Anonymous')+' Join to '+socket.channel + ' with ip '+(typeof socket.user != 'undefined' ? socket.user.ip : 'unknown'))
		io.in(socket.channel).emit(`is_online_student`, payload.user);
	})

	/**
	 * Assign comment user to room
	 *
	 * @emit comment
	 */
	socket.on('comment', function(payload) {
		io.in(socket.channel).emit('comment',payload.comment)
	})

	/**
	 * Close classroom live
	 *
	 * @emmit close
	 */
	 socket.on('close_classroom', function() {
	 	io.in(socket.channel).emit('close_classroom')
	 })

	/**
	 * Disconnect user to room
	 *
	 * @emit is_offline
	 */
	socket.on('disconnect', function(username) {
		io.in(socket.channel).emit('is_offline', socket.user);
		socket.leave(socket.channel);
	})

	/**
	 * Exit user to room
	 *
	 * @emit is_offline
	 */
	socket.on('exit', function(payload) {
		// console.log((typeof socket.user != 'undefined' ? socket.user.email : 'Anonymous')+' leave from '+socket.channel)
		io.in(socket.channel).emit('is_offline', socket.user);
		socket.leave(socket.channel);
	})
})