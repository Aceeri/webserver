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

var postRequest = [
	['/join', matchmaking.add],
	['/accept', matchmaking.accept]
];
var getRequest 	= [
	//--matchmaking
		['/', function(req, res) { res.send(''); } ],
		//['/queue', function(req, res) { res.send(matchmaking.queue) } ],
		['/leave/:id', matchmaking.leave],

		//polling
		['/confirm/:id', matchmaking.confirm],
		['/accept/:id', matchmaking.accept]
];

for (var i = 0; i < postRequest.length; i++) {
	console.log('\'' + postRequest[i][0] + '\' ' + 'initialized');
	app.post(postRequest[i][0], postRequest[i][1]);
}

for (var i = 0; i < getRequest.length; i++) {
	console.log('\'' + getRequest[i][0] + '\' ' + 'initialized');
	app.get(getRequest[i][0], getRequest[i][1]);
}

app.get('/arenas/:id', function(req, res) {
	var id = parseInt(req.params.id);
	//console.log(id) || "");
	res.send(arenas[id] || "");
	arenas[id] = undefined;
});

app.listen(port, ipaddress, function() { console.log("Online"); });