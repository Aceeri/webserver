#!/bin/env node
//require('newrelic');
var express = require('express');
var matchmaking = require('./matchmaking');

var ipaddress 	= process.env.OPENSHIFT_NODEJS_IP;
var port 		= process.env.OPENSHIFT_NODEJS_PORT || 8080;

if (typeof ipaddress === "undefined") {
	ipaddress = "127.0.0.1";
};

var app  = express();
app.use(express.bodyParser());

var id   = app.param("/^\d+$/");
var type = app.param("/^\w+$/");


var requests = [
	//--matchmaking
		{
			get : [
				['/', function(req, res) { res.send(''); } ],
				//['/queue', function(req, res) { res.send(matchmaking.queue) } ],
				['/leave/:id', matchmaking.leave],
				['/confirm/:id', matchmaking.confirm],
				['/accept/:id', matchmaking.accept]
			],
			post : [
				['/join', matchmaking.add],
				['/accept', matchmaking.accept]
			]
		}
]

requests.forEach(function(request) {
		for (var getIndex = 0; getIndex < request.get.length; getIndex++) {
			app.get(request.get[getIndex][0], request.get[getIndex][0]);
		}

		for (var postIndex = 0; postIndex < request.post.length; postIndex++) {
			app.post(request.post[postIndex][0], request.post[postIndex][0]);
		}
});

app.get('/arenas/:id', function(req, res) {
	var id = parseInt(req.params.id);
	//console.log(id) || "");
	res.send(arenas[id] || "");
	arenas[id] = undefined;
});

app.listen(port, ipaddress, function() { console.log("Online"); });