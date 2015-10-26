var http = require('https'),
	fs = require('fs');

var constants = require('constants'),
	SSL_ONLY_TLS_1_2 = constants.SSL_OP_NO_TLSv1_1|constants.SSL_OP_NO_TLSv1|constants.SSL_OP_NO_SSLv3|constants.SSL_OP_NO_SSLv2;

http.createServer({
	key: fs.readFileSync('../Secret/devdoodle.net.key'),
	cert: fs.readFileSync('../Secret/devdoodle.net.crt'),
	ca: [fs.readFileSync('../Secret/devdoodle.net-geotrust.crt')],
	ecdhCurve: 'secp384r1',
	ciphers: [
		'ECDHE-ECDSA-AES256-GCM-SHA384',
		'ECDHE-RSA-AES256-GCM-SHA384',
		'ECDHE-ECDSA-AES128-GCM-SHA256',
		'ECDHE-RSA-AES128-GCM-SHA256',
		'ECDHE-ECDSA-AES256-SHA',
		'ECDHE-RSA-AES256-SHA'
	].join(':'),
	honorCipherOrder: true,
	secureOptions: SSL_ONLY_TLS_1_2
}, function(req, res) {
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