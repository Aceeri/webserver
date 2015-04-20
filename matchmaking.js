
//valid match types
var matchTypes = [
	'normal'
];

//queues
var queue = { };
var confirm = { };
var arenas = { };

//polling objects
var confirmRequests = { };
var acceptRequests = { };

//setup queue for valid match types
for (var type in matchTypes) {
	queue[matchTypes[type]] = { };
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
					if (player != player2 && queue[player].rank - queue[player2].rank <= 50) {
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
			if (matchTypes[type] == req.body.type) {
				validType = true;
				break;
			}
		}

		console.log(userId + " attempting to join queue");
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

		//possibly don't need this
		for (var i = 0; i < confirmRequests.length; i++) {
			if (confirmRequests[i].request.params.id == id) {
				confirmRequests[i].response.end('left');
				confirmRequests.splice(i, 1);
			}
		}

		res.send("removed");
	},

	remove : function(req, res) {
		delete confirm[req.params.id];
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
		confirmRequests[req.params.id] = {
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		};

		/*confirmRequests.push({
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		});*/
	},

	accepted : function(req, res) {
		acceptRequests[req.params.id] = {
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		}

		/*acceptRequests.push({
			request 	: req,
			response	: res,
			timestamp	: new Date().getTime()
		});*/
	}
}

setInterval(function() {
	var expiration = new Date().getTime() - 28000;
	var acceptExpiration = new Date().getTime() - 20000;

	module.exports.sortQueue();

	var response;
	for (var request in confirmRequests) {
		response = confirmRequests[request].response;
		if (confirm[confirmRequests[request].request.params.id] != undefined) {
			response.write(JSON.stringify(confirm[confirmRequests[request].request.params.id]));
			response.end();
			delete confirmRequests[request];
		} else if (confirmRequests[request].timestamp < expiration) {
			response.end('');
		}
	}

	for (var request in acceptRequests) {
		response = acceptRequests[request].response;
		var set = true, canceled = false, playerIndex;
		if (confirm[request] != undefined) {
			for (var player in confirm[request].players) {
				if (confirm[request].players[player].accept == undefined) {
					set = false;
				} else if (confirm[request].players[player].accept == 2 || confirm[confirm[request].players[player].id] == undefined) {
					canceled = true;
					if (confirm[request].players[player].id == acceptRequest[request].request.params.id) {
						playerIndex = player;
					}
				}
			}

			if (set && !canceled) {
				response.write('accepted');
				response.end();
				confirm[acceptRequests[i].request.params.id] = undefined;
				delete acceptRequests[request];

			} else if (acceptRequests[i].timestamp < acceptExpiration || canceled) {
				if (request.players[playerIndex].accept == 2 || request.players[playerIndex].accept == 0) {
					response.end('');
				} else {
					queue.push(request.players[playerIndex]);
					response.write('added');
					response.end('');
				}

				delete confirm[acceptRequests[request].request.params.id];
				delete acceptRequests[request];
			}
		}
	}
}, 1000);