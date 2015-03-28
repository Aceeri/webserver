
var matchmaking 	= module.exports;

//queues
var queue 			= [ ];
var confirm 		= { };
var arenas			= { };

//polling arrays
var confirmRequests = [ ];
var acceptRequests 	= [ ];

module.exports = {
	inQueue : function(userId, splice) {
		for (var i = 0; i < queue.length; i ++) {
			if (queue[i].id == userId) {
				if (splice) {
					queue.splice(i, 1);
				}
				return true;
			}
		}
	},

	add : function(req, res) {
		var userId = parseInt(req.body.id);
		confirm[userId] = undefined;

		if (!matchmaking.inQueue(userId)) {
			queue.push({
				name 	: req.body.name,
				id 		: userId,
				placeid : parseInt(req.body.placeid),
				rank 	: parseInt(req.body.rank),
				type 	: req.body.type
			});
			res.send('added');
		} else {
			res.send('rejected')
		}
	},

	leave : function(req, res) {
		var id = parseInt(req.params.id);
		matchmaking.inQueue(id, true);

		for (var i = 0; i < confirmRequests.length; i++) {
			if (parseInt(confirmRequests[i].request.params.id) == id) {
				confirmRequests[i].response.end('left');
				confirmRequests.splice(i, 1);
			}
		}

		res.send("removed");
	},

	accept : function(req, res) {
		var response = parseInt(req.body.response);
		var userId   = parseInt(req.body.userId);

		if (confirm[userId].players[0].id == userId) {
			confirm[userId].players[0].accept = response;
		} else if (confirm[userId].players[1].id == userId) {
			confirm[userId].players[1].accept = response;
		}

		res.send("accept");
	},

	confirm : function(req, res) {
		confirmRequests.push({
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		});
	},

	accepted : function(req, res) {
		acceptRequests.push({
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		});
	}
}

setInterval(function() {
	var expiration 			= new Date().getTime() - 28000;
	var acceptExpiration 	= new Date().getTime() - 20000;

	for (var p1 = 0; p1 < queue.length; p1++) {
		for (var p2 = 0; p2 < queue.length; p2 ++) {
			var player1 = queue[p1];
			var player2 = queue[p2];
			if (player1.type == player2.type && player1.id != player2.id && Math.abs(player1.rank - player2.rank) <= 50) {
				queue.splice((p1 > p2) ? p1 : p2, 1);
				queue.splice((p1 > p2) ? p2 : p1, 1);
				confirm[player1.id] = { players : [ player1, player2 ], id : player1.placeid, type : player1.type };
				confirm[player2.id] = confirm[player1.id];
			}
		}
	}

	var response;
	for (var i = confirmRequests.length - 1; i >= 0; i--) {
		response = confirmRequests[i].response;
		if (confirm[parseInt(confirmRequests[i].request.params.id)] != undefined) {
			response.write(JSON.stringify(confirm[parseInt(confirmRequests[i].request.params.id)]));
			response.end();
			confirmRequests.splice(i, 1);
		} else if (confirmRequests[i].timestamp < expiration) {
			response.end('');
		}
	}

	for (var i = acceptRequests.length - 1; i >= 0; i--) {
		response = acceptRequests[i].response;
		var set = true;
		var canceled = false;
		var playerIndex;
		var request = confirm[parseInt(acceptRequests[i].request.params.id)];
		if (request != undefined) {
			for (var l = 0; l < request.players.length; l ++) {
				if (request.players[l].accept == undefined) {
					set = false;
				} else if (request.players[l].accept == 2) {
					canceled = true;
					if (request.players[l].id == parseInt(acceptRequests[i].request.params.id)) {
						playerIndex = l;
					}
				}
			}

		
			if (set && !canceled) {
				response.write('accepted');
				response.end();
				confirm[parseInt(acceptRequests[i].request.params.id)] = undefined;
				acceptRequests.splice(i, 1);
			} else if (acceptRequests[i].timestamp < acceptExpiration || canceled) {
				if (request.players[playerIndex].accept == 2 || request.players[playerIndex].accept == 0) {
					response.end('');
				} else {
					queue.push(request.players[playerIndex]);
					response.write('added');
					response.end('');
				}
				confirm[parseInt(acceptRequests[i].request.params.id)] = undefined;
				acceptRequests.splice(i, 1);
			}
		}
	}
}, 1000);