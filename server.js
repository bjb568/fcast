var http = require('http'),
	fs = require('fs');
http.createServer(function(req, res) {
	console.log(req.url);
	if (req.url.indexOf('.css') != -1) {
		res.writeHead(200, {
			'Content-Type': 'text/css',
			'Cache-Control': 'no-cache'
		});
		fs.readFile('forecast.css', function(err, data) {
			if (err) throw err;
			res.end(data);
		});
	} else if (req.url.indexOf('.js') != -1) {
		res.writeHead(200, {
			'Content-Type': 'text/javascript',
			'Cache-Control': 'no-cache'
		});
		fs.readFile('forecast.js', function(err, data) {
			if (err) throw err;
			res.end(data);
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/xhtml+xml; charset=utf-8',
			'Cache-Control': 'no-cache',
			'X-Frame-Options': 'DENY'
		});
		fs.readFile('forecast.html', function(err, data) {
			if (err) throw err;
			res.end(data);
		});
	}
}).listen(1337);
console.log('Server listening on port 1337.');