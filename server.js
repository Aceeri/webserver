#!/bin/env node
var express = require('express');
var fs      = require('fs');
var qs      = require('querystring');

var ipaddress 	= process.env.OPENSHIFT_NODEJS_IP;
var port 		= process.env.OPENSHIFT_NODEJS_PORT || 8080;
var queue 		= [ ];
var confirm 	= { };
var arenas		= { };

if (typeof ipaddress === "undefined") {
	ipaddress = "127.0.0.1";
};

var app  = express();
var id   = app.param("/^\d+$/");
var type = app.param("/^\w+$/");

app.use(express.bodyParser());

app.post('/join', function(req, res) {
	var found = false;
	for (i = 0; i < queue.length; i ++) {
		if (queue[i].id == parseInt(req.body.id)) {
			found = true;
			break;
		}
	}

	/*if (confirm[parseInt(req.body.id)] != undefined) {
		found = true;
	}*/

	if (!found) {
		queue.push({
			name 	: req.body.name,
			id 		: parseInt(req.body.id),
			placeid : parseInt(req.body.placeid),
			rank 	: parseInt(req.body.rank),
			type 	: req.body.type
		});

		for (p1 = 0; p1 < queue.length; p1++) {
			for (p2 = 0; p2 < queue.length; p2 ++) {
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
		res.send("added");
	} else {
		res.send("rejected");
	}
});

app.get('/leave/:id', function(req, res) {
	req.params.id = parseInt(req.params.id);
	for (player = 0; player < queue.length; player++) {
		if (queue[player].id == req.params.id) {
			queue.splice(player, 1);
			break;
		}
	}

	for (i = 0; i < confirmRequests.length; i ++) {
		if (confirmRequests[i].request.params.id == req.params.id) {
			confirmRequests[i].response.end('left');
		}
	}

	res.send("removed");
});

app.get('/confirm/remove/:id', function(req, res) {
	confirm[req.params.id] = undefined;
	res.end('removed');
});

var confirmRequests = [ ];
app.get('/confirm/:id', function(req, res) {
	confirmRequests.push({
		request 	: req,
		response	: res,
		timestamp	: new Date().getTime()
	});
});

var acceptRequests = [ ];
app.get('/accept/:id', function(req, res) {
	acceptRequests.push({
		request 	: req,
		response	: res,
		timestamp	: new Date().getTime()
	});
});

//check every second for response
setInterval(function() {
	var expiration = new Date().getTime() - 28000;
	var acceptExpiration = new Date().getTime() - 20000;

	var response;
	for (var i = confirmRequests.length - 1; i >= 0; i--) {
		response = confirmRequests[i].response;
		if (confirm[confirmRequests[i].request.params.id] != undefined) {
			response.write(JSON.stringify(confirm[confirmRequests[i].request.params.id]));
			response.end();
			confirmRequests.splice(i, 1);
		//check if request has polled for more than 28 seconds
		} else if (confirmRequests[i].timestamp < expiration) {
			response.end('');
		}
	}

	for (var i = acceptRequests.length - 1; i >= 0; i--) {
		response = acceptRequests[i].response;
		var set = true;
		var canceled = false;
		for (var l = 0; l < confirm[acceptRequests[i].request.params.id].players.length; l ++) {
			console.log()
			if (confirm[acceptRequests[i].request.params.id].players[l].accept == undefined) {
				set = false;
			} else if (confirm[acceptRequests[i].request.params.id].players[l].accept == 2) {
				canceled = true;
				break;
			}
		}
		
		if (set && !canceled) {
			response.write('accepted');
			response.end();
			acceptRequests.splice(i, 1);
		} else if (acceptRequests[i].timestamp < acceptExpiration || canceled) {
			response.end('');
		}
	}
}, 1000);

app.post('/accept', function(req, res) {
	var response = parseInt(req.body.response);
	var userId   = parseInt(req.body.userId);
	if (confirm[userId].players[0].id == userId) {
		confirm[userId].players[0].accept = response;
	} else if (confirm[userId].players[1].id == userId) {
		confirm[userId].players[1].accept = response;
	}

	res.send("accept");
})

app.get('/arenas/remove/:id', function(req, res) {
	arenas[parseInt(req.params.id)] = undefined;
	res.send("");
});

app.get('/arenas/:id', function(req, res) {
	res.send(arenas[parseInt(req.params.id)]);
});

app.get('/queue', function(req, res) {
	console.log(req.ip);
	res.send(queue);
})

app.get('/', function(req, res) {
	res.send('test');
});

app.listen(port, ipaddress, function() {
	console.log("Server online.");
});