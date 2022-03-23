const express = require('express')
const bodyParser = require('body-parser')
const app = express();

app.use(bodyParser.json());

var PORT = 3000;
const CHANNEL_PESERTA = "rtpkdorstqpdolrofvetdfsnzctsrogmurweidpnvasurslhyjvwuqfnicnapiwoehlzfaeifaulchfyejamttwvoddeozuytadqfpfmccmbdzrvoebldpduzuhrrxhn";
const CHANNEL_ADMIN = "ierkxjvehubrykwhnuxihnvyclbymtysjezsqqkxifqvismfaufgbiojbsjfczngairqwlayabsuxynzzqbyehycauzdavbzwjeozwdloctmikvzjmdmyulavnilgsre";


let io = require('socket.io').listen(app.listen(PORT, function() {
	console.log(`Server run on port ${PORT}`);
}));

io.set('heartbeat timeout', 4000); 
io.set('heartbeat interval', 2000);

var pesertas = {}
io.sockets.on('connection', function(socket) {
	// RTCMultiConnectionServer.addSocket(socket, config);

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
			// console.log("BUSETTT\n", Object.values(pesertas))

			// io.in(socket.channel).emit('monit_student', Object.values(socs).filter(item => item.channel == 'student_connect_channel' && client_rooms.indexOf(item.id) != -1).map(item => item.user))
			io.in("student_connect_channel").emit('monit_student', Object.values(pesertas))
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
		console.log("JOIN CHANNEL ADMIN: ", socket.user)
		socket.join(socket.channel)
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
		console.log("JOIN CHANNEL: ", socket.user)
		pesertas[socket.user.id] = socket.user;
		socket.join(socket.channel)
		io.in(socket.channel).emit(`is_online_student`, payload.user);
	})

	/**
	 * Assign user to room
	 *
	 * @emit is_online
	 */
	 socket.on('not_in_tab_student', function(payload) {
		if(typeof socket.user != 'undefined') {
			socket.user.intab = false
			pesertas[socket.user.id].intab = false
		}
		io.in(socket.channel).emit(`is_not_tab_online_student`, payload.user);
	})

	/**
	 * Assign user to room
	 *
	 * @emit is_online
	 */
	 socket.on('in_tab_student', function(payload) {
		if(typeof socket.user != 'undefined') {
			socket.user.intab = true
			pesertas[socket.user.id].intab = true
		}
		io.in(socket.channel).emit(`is_in_tab_online_student`, payload.user);
	})

	/**
	 * Disconnect user to room
	 *
	 * @emit is_offline
	 */
	socket.on('disconnect', function(username) {
		io.in(socket.channel).emit('is_offline', socket.user);
		console.log("DISCONNECT FROM CHANNEL: ", socket.user)
		if(typeof socket.user != 'undefined' && socket.user.no_ujian != 'undefined') {
			delete pesertas[socket.user.id];
		}
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
		console.log("EXIT FROM CHANNEL: ", socket.user)
		if(typeof socket.user != 'undefined' && socket.user.no_ujian != 'undefined') {
			delete pesertas[socket.user.id];
		}
		socket.leave(socket.channel);
	})
})