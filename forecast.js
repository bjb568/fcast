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
	var svg = document.createElementNS(svgns, 'svg');
	svg.setAttribute('viewBox', '0 0 800 216');
	svg.appendChild(createText(8, 64, 64, false, '{' + data.currently.temperature + '} ˚C'));
	svg.appendChild(createText(792, 44, 36, 'end', '{' + data.currently.humidity + '} humidity'));
	svg.appendChild(createText(792, 72, 20, 'end', '{' + data.currently.dewPoint + '} ˚C dew point'));
	svg.appendChild(createText(8, 96, 24, false, 'Feels like {' + data.currently.apparentTemperature + '} ˚C'));
	svg.appendChild(createText(8, 132, 32, false, '{' + data.currently.summary + '}'));
	svg.appendChild(createText(32, 160, 22, false, '{' + data.currently.cloudCover + '} cloud cover'));
	svg.appendChild(createText(32, 184, 22, false, '{' + data.currently.precipProbability + '} chance of rain at {' + data.currently.precipIntensity + '} mm/hr'));
	svg.appendChild(createText(400, 160, 22, false, '{' + data.currently.visibility + '} km visibility'));
	svg.appendChild(createText(400, 184, 22, false, 'Wind {' + data.currently.windSpeed + '} km/hr'));
	svg.appendChild(createText(432, 208, 22, false, 'from {' + data.currently.windBearing + '}˚ clockwise of true north'));
	document.body.appendChild(svg);
}

if (localStorage.lastData) drawData(JSON.parse(localStorage.lastData));

var apiInput = document.getElementById('api-key');
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
var reqBtn = document.getElementById('req-btn');
reqBtn.onclick = function() {
	var req = new XMLHttpRequest();
	req.open('GET', 'https://jsonp.afeld.me/?url=https://api.forecast.io/forecast/' + apiInput.value + '/' + pos.coords.latitude + ',' + pos.coords.longitude + '?units=ca&extend=hourly');
	req.send();
	req.addEventListener('load', function() {
		var e = document.getElementsByTagName('svg')[0];
		if (e) e.parentNode.removeChild(e);
		drawData(JSON.parse(localStorage.lastData = this.responseText));
	});
}