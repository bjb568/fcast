'use strict';

var svgns = 'http://www.w3.org/2000/svg';

function createText(x, y, size, align, t) {
	var text = document.createElementNS(svgns, 'text');
	text.setAttribute('x', x);
	text.setAttribute('y', y);
	text.setAttribute('font-size', size);
	if (align) text.setAttribute('text-anchor', align);
	var tspan = false;
	for (var i = 0; i < t.length; i++) {
		if (tspan) {
			if (t[i] == '}') {
				text.appendChild(tspan);
				tspan = false;
			} else tspan.appendChild(document.createTextNode(t[i]));
		} else {
			if (t[i] == '{') tspan = document.createElementNS(svgns, 'tspan');
			else text.appendChild(document.createTextNode(t[i]));
		}
	}
	return text;
}

function drawData(data) {
	console.log(data);
	var cont = document.createElement('section');
	var currentlySVG = document.createElementNS(svgns, 'svg');
	currentlySVG.setAttribute('viewBox', '0 0 800 216');
	currentlySVG.appendChild(createText(8, 64, 64, false, '{' + data.currently.temperature.toFixed(2) + '} ˚C'));
	currentlySVG.appendChild(createText(792, 44, 36, 'end', '{' + data.currently.humidity.toFixed(2) + '} humidity'));
	currentlySVG.appendChild(createText(792, 72, 20, 'end', '{' + data.currently.dewPoint.toFixed(2) + '} ˚C dew point'));
	currentlySVG.appendChild(createText(8, 96, 24, false, 'Feels like {' + data.currently.apparentTemperature.toFixed(2) + '} ˚C'));
	currentlySVG.appendChild(createText(8, 132, 32, false, '{' + data.currently.summary + '}'));
	currentlySVG.appendChild(createText(32, 160, 22, false, '{' + data.currently.cloudCover.toFixed(2) + '} cloud cover'));
	if (typeof data.currently.precipProbability != 'undefined') currentlySVG.appendChild(createText(32, 184, 22, false, '{' + data.currently.precipProbability + '} chance of rain at {' + (data.currently.precipIntensity * 100).toFixed(0) + '} µm/hr'));
	if (data.currently.visibility) currentlySVG.appendChild(createText(400, 160, 22, false, '{' + data.currently.visibility + '} km visibility'));
	currentlySVG.appendChild(createText(400, 184, 22, false, 'Wind {' + data.currently.windSpeed + '} km/hr'));
	currentlySVG.appendChild(createText(432, 208, 22, false, 'from {' + data.currently.windBearing + '}˚ clockwise of true north'));
	cont.appendChild(currentlySVG);
	var hourlyTitle = document.createElement('h2');
	hourlyTitle.appendChild(document.createTextNode(data.hourly.summary));
	cont.appendChild(hourlyTitle);
	var hourlySVG = document.createElementNS(svgns, 'svg');
	hourlySVG.id = 'hourly';
	hourlySVG.setAttribute('viewBox', '0 0 800 240');
	var min = Infinity,
		max = -Infinity;
	for (var i = 0; i < data.hourly.data.length; i++) {
		min = Math.min(min, data.hourly.data[i].temperature);
		max = Math.max(max, data.hourly.data[i].temperature);
	}
	var range = max - min;
	max = Math.ceil(max + range / 8);
	min = Math.floor(min - range / 8);
	var p = min;
	var incr = 216 / (max - min);
	for (var ly = 216 - incr; ly > 8; ly -= incr) {
		if (p % 2 == 0 || range < 12) {
			var line = document.createElementNS(svgns, 'line');
			line.setAttribute('x1', 20);
			line.setAttribute('y1', ly);
			line.setAttribute('x2', 800);
			line.setAttribute('y2', ly);
			line.style.stroke = '#888';
			hourlySVG.appendChild(line);
			hourlySVG.appendChild(createText(17, ly + 4, 11, 'end', p.toString()));
		}
		p++;
	}
	hourlySVG.appendChild(createText(4, 228, 14, false, '˚C'));
	for (var t = data.hourly.data[0].time; t <= data.hourly.data[data.hourly.data.length - 1].time; t += 3600) {
		var d = new Date(t * 1000);
		if (d.getHours() % 12 == 0) {
			var line = document.createElementNS(svgns, 'line'),
				x = (t - data.hourly.data[0].time) / 3600 / 48 * 720 + 33;
			line.setAttribute('x1', x);
			line.setAttribute('y1', 0);
			line.setAttribute('x2', x);
			line.setAttribute('y2', 220);
			line.style.stroke = '#888';
			hourlySVG.appendChild(line);
			if (x < 700) hourlySVG.appendChild(createText(x + 90, 232, 11, 'middle', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + (d.getHours() == 12 ? ' afternoon' : ' morning')));
		}
	}
	var lastY;
	for (var i = 0; i < data.hourly.data.length; i++) {
		var y = 216 - (data.hourly.data[i].temperature - min) * incr;
		if (lastY) {
			var line = document.createElementNS(svgns, 'line');
			line.setAttribute('x1', i * 15 + 18);
			line.setAttribute('y1', lastY);
			line.setAttribute('x2', i * 15 + 33);
			line.setAttribute('y2', y);
			hourlySVG.appendChild(line);
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastY);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			hourlySVG.appendChild(circle);
		}
		lastY = y;
		var rect = document.createElementNS(svgns, 'rect');
		rect.setAttribute('x', i * 15 + 26);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', 15);
		rect.setAttribute('height', 220);
		rect.style.opacity = 0;
		hourlySVG.appendChild(rect);
		hourlySVG.appendChild(createText(i < 44 ? i * 15 + 42 : i * 15 + 24, y, 14, i < 44 ? false : 'end', '{' + data.hourly.data[i].temperature + '} ˚C'));
		hourlySVG.appendChild(createText(i < 44 ? i * 15 + 42 : i * 15 + 24, y + 16, 14, i < 44 ? false : 'end', 'at {' + new Date(data.hourly.data[i].time * 1000).getHours() + ':00}'));
	}
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastY);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	cont.appendChild(hourlySVG);
	document.body.appendChild(cont);
}

if (localStorage.lastData) drawData(JSON.parse(localStorage.lastData));

var apiInput = document.getElementById('api-key'),
	reqBtn = document.getElementById('req-btn'),
	timeTravel = document.getElementById('time-travel');
apiInput.value = localStorage.apiKey || apiInput.focus() || '';
apiInput.oninput = function() {
	localStorage.apiKey = this.value;
};
var pos;
navigator.geolocation.getCurrentPosition(function(currentPos) {
	pos = currentPos;
	reqBtn.disabled = false;
	console.log('Position recieved.');
}, function(e) {
	alert('Error determining location.');
	throw e;
});
reqBtn.onclick = function() {
	var req = new XMLHttpRequest();
	req.open('GET',
		'https://jsonp.afeld.me/?url=https://api.forecast.io/forecast/' +
		apiInput.value +
		'/' + pos.coords.latitude +
		',' + pos.coords.longitude +
		(timeTravel.value ? ',' + parseInt(new Date(timeTravel.value).getTime() / 1000) : '') +
		'?units=ca&extend=hourly');
	req.send();
	req.addEventListener('load', function() {
		var e = document.getElementsByTagName('section')[0];
		if (e) e.parentNode.removeChild(e);
		drawData(JSON.parse(localStorage.lastData = this.responseText));
	});
}