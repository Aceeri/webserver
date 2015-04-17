var request = require("request");

module.exports = {

	isProxy : function(url) {
		console.log("checking if " + url + " is a proxy url");
	    var match = url.match(/\/roblox\//);
	    if (match != null && match.index == 0) {
	        return true;
	    } else {
	        return false;
	    }
	},

	getPath : function(url) {
		console.log("getting path");
		return url.match(/\/roblox\/(.+)/);
	},

	getRoblox : function(response, path) {
		console.log("attempting to get " + path);
		request
			.get("http://www.roblox.com/" + path)
			.on('response', function(res) {
				console.log(res);
				response.send(res);
			})
			.on('error', function(err) {
				console.log(err);
				response.send(err);
			});
		//response.end();
	},
}