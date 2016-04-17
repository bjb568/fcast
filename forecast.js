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
	var currentTime = document.createElement('h1'),
		now = new Date(data.currently.time * 1000),
		tz = now.getTimezoneOffset();
	currentTime.appendChild(document.createTextNode('Weather for ' + ('00' + now.getHours()).substr(-2) + ':' + ('00' + now.getMinutes()).substr(-2) + ':' + ('00' + now.getSeconds()).substr(-2) + ' Z' + (tz == 0 ? '' : tz < 0 ? '\u2009+\u2009' + tz / -60 : '\u2009−\u2009' + tz / 60)));
	cont.appendChild(currentTime);
	var currentlySVG = document.createElementNS(svgns, 'svg');
	currentlySVG.setAttribute('viewBox', '0 0 800 240');
	currentlySVG.appendChild(createText(8, 64, 64, false, '{' + (data.currently.temperature + 273.15).toFixed(2) + '}\u2009K'));
	currentlySVG.appendChild(createText(792, 44, 32, 'end', '{' + data.currently.humidity.toFixed(2) + '} humidity'));
	currentlySVG.appendChild(createText(792, 72, 18, 'end', '{' + (data.currently.dewPoint + 273.15).toFixed(2) + '}\u2009K dew point'));
	currentlySVG.appendChild(createText(8, 96, 22, false, 'Feels like {' + (data.currently.apparentTemperature + 273.15).toFixed(2) + '}\u2009K'));
	currentlySVG.appendChild(createText(8, 132, 30, false, '{' + data.currently.summary + '}'));
	currentlySVG.appendChild(createText(32, 160, 20, false, '{' + data.currently.cloudCover.toFixed(2) + '} cloud cover'));
	if (typeof data.currently.precipProbability != 'undefined') {
		currentlySVG.appendChild(createText(32, 184, 20, false, '{' + data.currently.precipProbability.toFixed(2) + '} chance of precipitation'));
		currentlySVG.appendChild(createText(64, 208, 20, false, 'at {' + (data.currently.precipIntensity * 1000).toFixed(0) + '}\u2009µm/hr'));
	}
	if (data.currently.visibility) currentlySVG.appendChild(createText(400, 160, 22, false, '{' + data.currently.visibility + '}\u2009km visibility'));
	currentlySVG.appendChild(createText(400, 184, 20, false, 'Wind {' + data.currently.windSpeed.toFixed(2) + '}\u2009m/s'));
	currentlySVG.appendChild(createText(432, 208, 20, false, 'from {' + (data.currently.windBearing / 360).toFixed(3) + '}τ clockwise of true north'));
	currentlySVG.appendChild(createText(32, 232, 20, false, '{' + (data.currently.pressure * 100).toFixed(0) + '}\u2009Pa of atmospheric pressure'));
	currentlySVG.appendChild(createText(400, 232, 20, false, '{' + (data.currently.ozone * 0.0004462).toFixed(3) + '}\u2009mol/m² of atmospheric ozone'));
	cont.appendChild(currentlySVG);
	var minutelyTitle = document.createElement('h2');
	minutelyTitle.appendChild(document.createTextNode(data.minutely.summary));
	cont.appendChild(minutelyTitle);
	var minutelySVG = document.createElementNS(svgns, 'svg');
	minutelySVG.id = 'minutely';
	minutelySVG.setAttribute('viewBox', '0 0 800 240');
	var min = 0,
		max = 1;
	for (var i = 0; i < data.minutely.data.length; i++) max = Math.max(max, data.minutely.data[i].precipIntensity * 1000);
	var range = max - min;
	if (max < 10) minutelySVG.setAttribute('viewBox', '0 180 800 60');
	max *= 1.2;
	var p = min;
	var incr = 216 / (max - min);
	for (var ly = 216; ly > 8; ly -= incr) {
		if (p % (range < 1000 ? 100 : range < 2000 ? 300 : 500) == 0) {
			var line = document.createElementNS(svgns, 'line');
			line.setAttribute('x1', 24);
			line.setAttribute('y1', ly);
			line.setAttribute('x2', 753);
			line.setAttribute('y2', ly);
			line.style.stroke = '#888';
			minutelySVG.appendChild(line);
			minutelySVG.appendChild(createText(20, ly + 4, 11, 'end', (p / 1000).toString()));
		}
		p++;
	}
	minutelySVG.appendChild(createText(4, 236, 14, false, 'mm/hr / time'));
	for (var i = 0; i <= 60; i++) {
		if (i % 10 == 0) {
			var line = document.createElementNS(svgns, 'line'),
				x = i / 60 * 720 + 33;
			line.setAttribute('x1', x);
			line.setAttribute('y1', 0);
			line.setAttribute('x2', x);
			line.setAttribute('y2', 220);
			line.style.stroke = '#888';
			minutelySVG.appendChild(line);
			if (i) minutelySVG.appendChild(createText(x, 232, 11, 'middle', '+' + i + 'm'));
		}
	}
	var lastlastY = undefined,
		lastY = undefined,
		nextControl = undefined,
		d = 'M',
		m = 0.5;
	var rainGradient = document.createElementNS(svgns, 'linearGradient');
	rainGradient.id = 'rain-gradient';
	for (var i = 0; i < data.minutely.data.length; i++) {
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', i / 0.6 + '%');
		var scolor = Math.round(data.minutely.data[i].precipProbability * 255);
		stop.setAttribute('stop-color', 'rgb(0, ' + Math.round(scolor / 2) + ', ' + scolor + ')')
		rainGradient.appendChild(stop);
		var y = 216 - (data.minutely.data[i].precipIntensity * 1000 - min) * incr;
		if (lastY) {
			if (i > 1) d += nextControl.x + ',' + nextControl.y + ' ' + (i * 12 + 21 - 12 * m) + ',' + (lastY + m * (lastY - y)) + ' ' + (i * 12 + 21) + ',' + lastY + ' ';
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 12 + 21);
			circle.setAttribute('cy', lastY);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			minutelySVG.appendChild(circle);
			if (lastlastY) {
				m = 1 / (2 + 0.2 * Math.pow(Math.abs((lastlastY - lastY) - (lastY - y)), 1.5));
				nextControl = {
					x: i * 12 + 21 + 12 * m,
					y: lastY - m * (lastlastY - lastY)
				};
			} else {
				nextControl = {
					x: lastlastY ? i * 12 + 21 + 10 * n : i * 12 + 21,
					y: lastlastY ? lastY - m * (lastlastY - lastY) : lastY
				};
			}
			if (i == data.minutely.data.length - 1) d += nextControl.x + ',' + nextControl.y + ' ' + (i * 12 + 33) + ',' + y + ' ' + (i * 12 + 33) + ',' + y;
		} else d += (i * 12 + 33) + ',' + y + ' C';
		lastlastY = lastY;
		lastY = y;
		var rect = document.createElementNS(svgns, 'rect');
		rect.setAttribute('x', i * 12 + 26);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', 11);
		rect.setAttribute('height', 220);
		rect.style.opacity = 0;
		minutelySVG.appendChild(rect);
		minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y - 16, 14, i < 44 ? false : 'end', '{' + (data.minutely.data[i].precipProbability).toFixed(2) + '} chance'));
		minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y, 14, i < 44 ? false : 'end', '{' + (data.minutely.data[i].precipIntensity * 1000).toFixed(0) + '}\u2009µm/hr'));
		var now = new Date(data.minutely.data[i].time * 1000);
		minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y + 16, 14, i < 44 ? false : 'end', 'at {' + ('00' + now.getHours()).substr(-2) + ':' + ('00' + now.getMinutes()).substr(-2) + '}'));
	}
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 12 + 21);
	circle.setAttribute('cy', lastY);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	minutelySVG.appendChild(circle);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d + 'L753,216 L33,216 Z');
	minutelySVG.insertBefore(path, minutelySVG.getElementsByTagName('rect')[0]);
	minutelySVG.appendChild(rainGradient);
	cont.appendChild(minutelySVG);
	var hourlyTitle = document.createElement('h2');
	hourlyTitle.appendChild(document.createTextNode(data.hourly.summary));
	cont.appendChild(hourlyTitle);
	var hourlySVG = document.createElementNS(svgns, 'svg');
	hourlySVG.id = 'hourly';
	hourlySVG.setAttribute('viewBox', '0 0 800 240');
	var min = Infinity,
		max = -Infinity;
	for (var i = 0; i < data.hourly.data.length; i++) {
		min = Math.min(min, data.hourly.data[i].temperature + 273.15);
		max = Math.max(max, data.hourly.data[i].temperature + 273.15);
	}
	var range = max - min;
	max = Math.ceil(max + range / 8);
	min = Math.floor(min - range / 8);
	var p = min;
	var incr = 216 / (max - min);
	for (var ly = 216 - incr; ly > 8; ly -= incr) {
		p++;
		if (p % 2 == 0 || range < 12) {
			var line = document.createElementNS(svgns, 'line');
			line.setAttribute('x1', 24);
			line.setAttribute('y1', ly);
			line.setAttribute('x2', 754);
			line.setAttribute('y2', ly);
			line.style.stroke = '#888';
			hourlySVG.appendChild(line);
			hourlySVG.appendChild(createText(20, ly + 4, 11, 'end', p.toString()));
		}
	}
	hourlySVG.appendChild(createText(4, 236, 14, false, 'K / time'));
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
		} else if (d.getHours() % 12 == 6) {
			var x = (t - data.hourly.data[0].time) / 3600 / 48 * 720 + 33;
			if (x > 75) hourlySVG.appendChild(createText(x, 232, 11, 'middle', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + (d.getHours() == 18 ? ' afternoon' : ' morning')));
		}
	}
	var lastlastY = undefined,
		lastY = undefined,
		nextControl = undefined,
		d = 'M',
		m = 0.5;
	for (var i = 0; i < data.hourly.data.length; i++) {
		var y = 216 - (data.hourly.data[i].temperature + 273.15 - min) * incr;
		if (lastY) {
			if (i > 1) d += nextControl.x + ',' + nextControl.y + ' ' + (i * 15 + 18 - 15 * m) + ',' + (lastY + m * (lastY - y)) + ' ' + (i * 15 + 18) + ',' + lastY + ' ';
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastY);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			hourlySVG.appendChild(circle);
			if (lastlastY) {
				m = 1 / (2 + 0.2 * Math.pow(Math.abs((lastlastY - lastY) - (lastY - y)), 1.5));
				nextControl = {
					x: i * 15 + 18 + 15 * m,
					y: lastY - m * (lastlastY - lastY)
				};
			} else {
				nextControl = {
					x: lastlastY ? i * 15 + 18 + 15 * n : i * 15 + 18,
					y: lastlastY ? lastY - m * (lastlastY - lastY) : lastY
				};
			}
			if (i == data.hourly.data.length - 1) d += nextControl.x + ',' + nextControl.y + ' ' + (i * 15 + 33) + ',' + y + ' ' + (i * 15 + 33) + ',' + y;
		} else d += (i * 15 + 33) + ',' + y + ' C';
		lastlastY = lastY;
		lastY = y;
		var rect = document.createElementNS(svgns, 'rect');
		rect.setAttribute('x', i * 15 + 26);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', 15);
		rect.setAttribute('height', 220);
		rect.style.opacity = 0;
		hourlySVG.appendChild(rect);
		hourlySVG.appendChild(createText(i < 44 ? i * 15 + 42 : i * 15 + 24, y, 14, i < 44 ? false : 'end', '{' + (data.hourly.data[i].temperature + 273.15).toFixed(2) + '}\u2009K'));
		hourlySVG.appendChild(createText(i < 44 ? i * 15 + 42 : i * 15 + 24, y + 16, 14, i < 44 ? false : 'end', 'at {' + new Date(data.hourly.data[i].time * 1000).getHours() + ':00}'));
	}
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastY);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d);
	hourlySVG.insertBefore(path, hourlySVG.getElementsByTagName('rect')[0]);
	cont.appendChild(hourlySVG);
	var dailyTitle = document.createElement('h2');
	dailyTitle.appendChild(document.createTextNode(data.daily.summary));
	cont.appendChild(dailyTitle);
	document.body.insertBefore(cont, document.body.firstChild);
}

if (localStorage.lastData) {
	try {
		drawData(JSON.parse(localStorage.lastData));
	} catch(e) {
		console.log(e);
	}
}

var apiInput = document.getElementById('api-key');
apiInput.value = localStorage.apiKey || apiInput.focus() || '';
apiInput.oninput = function() {
	localStorage.apiKey = this.value;
};
var pos;
navigator.geolocation.getCurrentPosition(function(currentPos) {
	pos = currentPos;
	var req = new XMLHttpRequest();
	req.open('GET',
		'https://jsonp.afeld.me/?url=https://api.forecast.io/forecast/' +
		apiInput.value +
		'/' + pos.coords.latitude +
		',' + pos.coords.longitude +
		'?units=si&extend=hourly');
	req.send();
	req.addEventListener('load', function() {
		var e = document.getElementsByTagName('section')[0];
		if (e) e.parentNode.removeChild(e);
		try {
			drawData(JSON.parse(localStorage.lastData = this.responseText));
		} catch(e) {
			console.log(e);
		}
	});
	console.log('Position recieved.');
}, function(e) {
	alert('Error determining location.');
	throw JSON.stringify(e);
});