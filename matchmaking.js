
//valid match types
var matchTypes = [
	'normal'
];

//queues
var queue = { };
var confirm = { };
var arenas = { };

//polling arrays
var confirmRequests = [ ];
var acceptRequests = [ ];

//setup queue for valid match types
for (var type in matchTypes) {
	queue[type] = { };
}

module.exports = {
	inQueue : function(userId, remove) {
		for (var type in queue) {
			if (queue[type][userId]) {
				if (remove) {
					delete queue[type][userId];
				}
				return true;
			}
		}
		return false;
	},

	sortQueue : function(player1) {
		for (var type in queue) {
			for (var player in queue[type]) {
				for (var player2 in queue[type]) {
					if (player != player2 && player1.rank - player2.rank <= 50) {
						confirm[player] = {
							players : [
								queue[type][player],
								queue[type][player2]
							],
							id 		: queue[type][player].placeid,
							type 	: type
						}
						confirm[player2] = confirm[player];
					}
				}
			}
		}
	},

	add : function(req, res) {
		var userId = req.body.id;
		delete confirm[userId];

		var validType = false;
		for (var type in matchTypes) {
			console.log(type + " " req.body.type);
			if (type == req.body.type) {
				validType = true;
				break;
			}
		}

		console.log(userId + "attempting to join queue");
		console.log(module.exports.inQueue(userId) + " " + validType);
		if (!module.exports.inQueue(userId) && validType) {
			queue[req.body.type][userId] = {
				name 	: req.body.name,
				id 		: userId,
				placeid : req.body.placeid,
				rank 	: req.body.rank,
				type 	: req.body.type
			};

			res.send('added');
		} else {
			res.send('rejected');
		}
	},

	leave : function(req, res) {
		var id = req.params.id;
		module.exports.inQueue(id, true);

		for (var i = 0; i < confirmRequests.length; i++) {
			if (confirmRequests[i].request.params.id == id) {
				confirmRequests[i].response.end('left');
				confirmRequests.splice(i, 1);
			}
		}

		res.send("removed");
	},

	accept : function(req, res) {
		var response = req.body.response;
		var userId   = req.body.userId;

		if (confirm[userId] != undefined) {
			if (confirm[userId].players[0].id == userId) {
				confirm[userId].players[0].accept = response;
			} else if (confirm[userId].players[1].id == userId) {
				confirm[userId].players[1].accept = response;
			}
		}

		res.send("accept");
	},

	arena : function(req, res) {
		res.send(arenas[req.params.id] || "");
		delete arenas[req.params.id];
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
	var expiration = new Date().getTime() - 28000;
	var acceptExpiration = new Date().getTime() - 20000;

	module.exports.sortQueue();

	var response;
	for (var i = confirmRequests.length - 1; i >= 0; i--) {
		response = confirmRequests[i].response;
		if (confirm[confirmRequests[i].request.params.id] != undefined) {
			response.write(JSON.stringify(confirm[confirmRequests[i].request.params.id]));
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
		var request = confirm[acceptRequests[i].request.params.id];
		if (request != undefined) {
			for (var l = 0; l < request.players.length; l ++) {
				if (request.players[l].accept == undefined) {
					set = false;
				} else if (request.players[l].accept == 2) {
					canceled = true;
					if (request.players[l].id == acceptRequests[i].request.params.id) {
						playerIndex = l;
					}
				}
			}

		
			if (set && !canceled) {
				response.write('accepted');
				response.end();
				confirm[acceptRequests[i].request.params.id] = undefined;
				acceptRequests.splice(i, 1);
			} else if (acceptRequests[i].timestamp < acceptExpiration || canceled) {
				if (request.players[playerIndex].accept == 2 || request.players[playerIndex].accept == 0) {
					response.end('');
				} else {
					queue.push(request.players[playerIndex]);
					response.write('added');
					response.end('');
				}
				confirm[acceptRequests[i].request.params.id] = undefined;
				acceptRequests.splice(i, 1);
			}
		}
	}
}, 1000);