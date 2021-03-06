#!/bin/env node
//require('newrelic');
var express = require('express');

var matchmaking = require('./matchmaking');
//var proxy		= require('./proxy');

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
	//--matchmaking
		['/join', matchmaking.add],
		['/accept', matchmaking.accept],

	//--proxy
		//['/roblox', proxy.post]
];
var getRequest 	= [
	//--matchmaking
		['/', function(req, res) { res.send(''); } ],
		['/leave/:id', matchmaking.leave],
		['/arenas/:id', matchmaking.arena],
		['/confirm/remove/:id', matchmaking.remove],

		//polling
		['/confirm/:id', matchmaking.confirm],
		['/accept/:id', matchmaking.accepted],

	//--proxy
		//['/roblox/', proxy.get]
];

console.log("Attempting to initialize request listeners");
for (var i = 0; i < postRequest.length; i++) {
	app.post(postRequest[i][0], postRequest[i][1]);
	console.log('\'' + postRequest[i][0] + '\' ' + 'initialized');
}

for (var i = 0; i < getRequest.length; i++) {
	app.get(getRequest[i][0], getRequest[i][1]);
	console.log('\'' + getRequest[i][0] + '\' ' + 'initialized');
}

app.use(function(req, res) {
	console.log(req.path);
})

app.listen(port, ipaddress, function() { console.log("Online"); });