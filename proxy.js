var request = require('request');

module.exports = {
	get : function(req, res) {
		//console.log(req.url);
		res.send(req.url);
	},

	post : function(req, res) {
		res.send(req.url);
	}
}