'use strict';

const svgns = 'http://www.w3.org/2000/svg';

String.prototype.replaceAll = function(find, replace) {
	if (typeof find == 'string') return this.split(find).join(replace);
	let t = this,
		i, j;
	while (typeof (i = find.shift()) == 'string' && typeof (j = replace.shift()) == 'string') t = t.replaceAll(i || '', j || '');
	return t;
};
Number.prototype.bound = function(l, h) {
	let a = this;
	if (!isNaN(l)) a = Math.max(a, l);
	if (!isNaN(h)) a = Math.min(a, h);
	return a;
};

function createText(x, y, size, align, t) {
	const text = document.createElementNS(svgns, 'text');
	text.setAttribute('x', x);
	text.setAttribute('y', y);
	text.setAttribute('font-size', size);
	if (align) text.setAttribute('text-anchor', align);
	let tspan = false;
	for (let i = 0; i < t.length; i++) {
		if (tspan) {
			if (t[i] == '}') {
				text.appendChild(tspan);
				tspan = false;
			} else tspan.appendChild(document.createTextNode(t[i]));
		} else if (t[i] == '{') tspan = document.createElementNS(svgns, 'tspan');
		else text.appendChild(document.createTextNode(t[i]));
	}
	return text;
}

function createLine(x1, y1, x2, y2, color) {
	const line = document.createElementNS(svgns, 'line');
	line.setAttribute('x1', x1);
	line.setAttribute('y1', y1);
	line.setAttribute('x2', x2);
	line.setAttribute('y2', y2);
	line.style.stroke = color;
	return line;
}

function fixSummary(text) {
	return text
		.replace(/(-?\d+)°C/g, (t, d) => `${parseInt(d) + 273}\u2006K`)
		.replaceAll(' cm.', '\u2006cm')
		.replaceAll('under ', '<')
		.replaceAll('through', 'thru')
		.replaceAll('precipitation', 'pcpn')
		.replaceAll('temperature', 'temp')
		.replace(/ min.$/, 'm.')
		.replace(/ min./g, 'm');
}

function drawData(data) {
	console.log(data);
	const cont = document.createElement('section');
	var currentTime = document.createElement('h1'),
		now = new Date(data.currently.time * 1000),
		tz = now.getTimezoneOffset();
	currentTime.appendChild(document.createTextNode(`Weather for ${`00${now.getHours()}`.substr(-2)}:${`00${now.getMinutes()}`.substr(-2)}:${`00${now.getSeconds()}`.substr(-2)} Z${tz == 0 ? '' : tz < 0 ? `\u2006+\u2006${tz / -60}` : `\u2006−\u2006${tz / 60}`}`));
	cont.appendChild(currentTime);
	const currentlySVG = document.createElementNS(svgns, 'svg');
	currentlySVG.setAttribute('viewBox', '0 0 784 240');
	currentlySVG.appendChild(createText(8, 64, 64, false, `{${(data.currently.temperature + 273.15).toFixed(2)}}\u2006K`));
	currentlySVG.appendChild(createText(400, 44, 32, false, `{${data.currently.humidity.toFixed(2)}} humidity`));
	currentlySVG.appendChild(createText(400, 72, 18, false, `{${(data.currently.dewPoint + 273.15).toFixed(2)}}\u2006K dew point`));
	currentlySVG.appendChild(createText(8, 96, 22, false, `Feels like {${(data.currently.apparentTemperature + 273.15).toFixed(2)}}\u2006K`));
	currentlySVG.appendChild(createText(8, 132, 30, false, `{${fixSummary(data.currently.summary)}}`));
	currentlySVG.appendChild(createText(32, 160, 20, false, `{${data.currently.cloudCover.toFixed(2)}} cloud cover`));
	if (!isNaN(data.currently.precipProbability)) {
		currentlySVG.appendChild(createText(32, 184, 20, false, `{${data.currently.precipProbability.toFixed(2)}} chance of ${data.currently.precipType || 'pcpn'}`));
		currentlySVG.appendChild(createText(64, 208, 20, false, `at {${(data.currently.precipIntensity * 1000).toFixed(0)}}\u2006µm/hr`));
	}
	if (data.currently.visibility) currentlySVG.appendChild(createText(400, 160, 22, false, `${data.currently.visibility > 16.08 ? '{Max}' : `{${data.currently.visibility.toFixed(2)}}\u2006km`} visibility`));
	currentlySVG.appendChild(createText(400, 184, 20, false, `Wind {${data.currently.windSpeed.toFixed(2)}}\u2006m/s`));
	currentlySVG.appendChild(createText(432, 208, 20, false, `from {${(data.currently.windBearing / 360).toFixed(3)}}τ clockwise of true north`));
	currentlySVG.appendChild(createText(32, 232, 20, false, `{${(data.currently.pressure * 100).toFixed(0)}}\u2006Pa of atmospheric pressure`));
	currentlySVG.appendChild(createText(400, 232, 20, false, `{${(data.currently.ozone * 0.0004462).toFixed(3)}}\u2006mol/m² of atmospheric ozone`));
	const block1 = document.createElement('div');
	block1.appendChild(currentlySVG);
	if (data.minutely) {
		const minutelyTitle = document.createElement('h2');
		minutelyTitle.appendChild(document.createTextNode(fixSummary(data.minutely.summary)));
		block1.appendChild(minutelyTitle);
		const minutelySVG = document.createElementNS(svgns, 'svg');
		minutelySVG.id = 'minutely';
		minutelySVG.setAttribute('viewBox', '-24 0 800 240');
		var max = 1;
		for (var i = 0; i < data.minutely.data.length; i++) max = Math.max(max, data.minutely.data[i].precipIntensity * 1000);
		var rainCollapse = max < 50;
		if (rainCollapse) minutelySVG.setAttribute('viewBox', '-24 184 800 56');
		max *= 1.3;
		max = Math.max(max, rainCollapse ? 500 : 1050);
		var p = 0;
		var incr = 216 / max;
		for (var ly = 216; ly > 8; ly -= incr) {
			if (p % (max < 2000 ? 200 : max < 5000 ? 500 : max < 10000 ? 1000 : 2000) == 0) {
				minutelySVG.appendChild(createLine(24, ly, 754, ly, '#323'));
				minutelySVG.appendChild(createText(20, ly + 4, 11, 'end', (p / 1000).toFixed(1)));
			}
			p++;
		}
		minutelySVG.appendChild(createText(4, 236, 14, false, 'mm/hr'));
		for (var i = 0; i <= 60; i++) {
			if (i % 10 == 0) {
				var x = i / 60 * 720 + 32;
				minutelySVG.appendChild(createLine(x, 0, x, 220, '#323'));
				if (i) minutelySVG.appendChild(createText(x, 232, 11, 'middle', `+${i}m`));
			}
		}
		var lastlastY = undefined,
			lastY = undefined,
			nextControl = undefined,
			d = 'M',
			m = 0.5;
		const rainGradient = document.createElementNS(svgns, 'linearGradient');
		rainGradient.id = 'rain-gradient';
		for (var i = 0; i < data.minutely.data.length; i++) {
			var stop = document.createElementNS(svgns, 'stop');
			stop.setAttribute('offset', `${i / 0.6}%`);
			var scolor = data.minutely.data[i].precipProbability * 223;
			stop.setAttribute('stop-color', `rgb(32, ${Math.round(32 + scolor / 2)}, ${Math.round(32 + scolor)})`);
			rainGradient.appendChild(stop);
			var y = 216 - data.minutely.data[i].precipIntensity * 1000 * incr;
			if (lastY) {
				if (i > 1) d += `${nextControl.x},${nextControl.y} ${i * 12 + 21 - 12 * m},${(lastY + m * (lastY - y)).bound(false, 216)} ${i * 12 + 21},${lastY} `;
				var circle = document.createElementNS(svgns, 'ellipse');
				circle.setAttribute('cx', i * 12 + 21);
				circle.setAttribute('cy', lastY);
				circle.setAttribute('rx', 4);
				circle.setAttribute('ry', 4);
				minutelySVG.appendChild(circle);
				if (lastlastY) {
					m = 1 / (2 + 0.2 * Math.pow(Math.abs(lastlastY - lastY - (lastY - y)), 1.5));
					nextControl = {
						'x': i * 12 + 21 + 12 * m,
						'y': (lastY - m * (lastlastY - lastY)).bound(false, 216)
					};
				} else {
					nextControl = {
						'x': lastlastY ? i * 12 + 21 + 10 * n : i * 12 + 21,
						'y': (lastlastY ? lastY - m * (lastlastY - lastY) : lastY).bound(false, 216)
					};
				}
				if (i == data.minutely.data.length - 1) d += `${nextControl.x},${nextControl.y} ${i * 12 + 32},${y} ${i * 12 + 32},${y}`;
			} else d += `${i * 12 + 32},${y} C`;
			lastlastY = lastY;
			lastY = y;
			var rect = document.createElementNS(svgns, 'rect');
			rect.setAttribute('x', i * 12 + 26);
			rect.setAttribute('y', 0);
			rect.setAttribute('width', 12);
			rect.setAttribute('height', 220);
			rect.style.opacity = 0;
			minutelySVG.appendChild(rect);
			if (rainCollapse) y = 216;
			minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y - 36, 14, i < 44 ? false : 'end', `{${data.minutely.data[i].precipProbability.toFixed(2)}} chance of ${data.minutely.data[i].precipType || 'pcpn'}`));
			minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y - 20, 14, i < 44 ? false : 'end', `{${(data.minutely.data[i].precipIntensity * 1000).toFixed(0)}}\u2006µm/hr`));
			var now = new Date(data.minutely.data[i].time * 1000);
			minutelySVG.appendChild(createText(i < 44 ? i * 12 + 42 : i * 12 + 24, y - 4, 14, i < 44 ? false : 'end', `at {${`00${now.getHours()}`.substr(-2)}:${`00${now.getMinutes()}`.substr(-2)}}`));
		}
		var circle = document.createElementNS(svgns, 'ellipse');
		circle.setAttribute('cx', i * 12 + 21);
		circle.setAttribute('cy', lastY);
		circle.setAttribute('rx', 4);
		circle.setAttribute('ry', 4);
		minutelySVG.appendChild(circle);
		var path = document.createElementNS(svgns, 'path');
		path.setAttribute('d', `${d}L754,216 L32,216 Z`);
		minutelySVG.insertBefore(path, minutelySVG.getElementsByTagName('rect')[0]);
		minutelySVG.appendChild(rainGradient);
		minutelySVG.appendChild(createText(rainCollapse ? -232 : -141, -8, 20, false, 'Pcpn.'));
		minutelySVG.lastChild.style.fill = '#0af';
		minutelySVG.lastChild.setAttribute('transform', 'rotate(-90)');
		if (!rainCollapse) {
			minutelySVG.appendChild(createLine(-14, 0, -14, 96, '#0af'));
			minutelySVG.appendChild(createLine(-14, 144, -14, 240, '#0af'));
		}
		block1.appendChild(minutelySVG);
	}
	cont.appendChild(block1);
	const hourlyTitle = document.createElement('h2');
	hourlyTitle.appendChild(document.createTextNode(fixSummary(data.hourly.summary)));
	const block2 = document.createElement('div');
	block2.appendChild(hourlyTitle);
	const hourlySVG = document.createElementNS(svgns, 'svg');
	hourlySVG.id = 'hourly';
	hourlySVG.setAttribute('viewBox', '28 -12 2708 676');
	const hourlySideSVG = document.createElementNS(svgns, 'svg');
	hourlySideSVG.id = 'hourly-side';
	hourlySideSVG.setAttribute('viewBox', '-24 -12 96 676');
	var min = Infinity,
		max = -Infinity;
	for (var i = 0; i < data.hourly.data.length; i++) {
		min = Math.min(min, data.hourly.data[i].temperature + 273.15);
		min = Math.min(min, data.hourly.data[i].apparentTemperature + 273.15);
		max = Math.max(max, data.hourly.data[i].temperature + 273.15);
		max = Math.max(max, data.hourly.data[i].apparentTemperature + 273.15);
	}
	var range = max - min;
	max = Math.ceil(max + range / 8);
	min = Math.floor(min - range / 8);
	var p = min;
	var incr = 212 / (max - min);
	for (var ly = 216; ly >= 4; ly -= incr) {
		if (p % 2 == 0 || range < 12) {
			hourlySVG.appendChild(createLine(32, ly, 2554, ly, '#323'));
			if (p % 4 == 0 || p % 2 == 0 && range < 12) hourlySideSVG.appendChild(createText(20, ly + 4, 11, 'end', p.toString()));
		}
		p++;
	}
	hourlySideSVG.appendChild(createText(4, 236, 14, false, 'K'));
	var max = 0;
	for (var i = 0; i < data.hourly.data.length; i++) max = Math.max(max, data.hourly.data[i].precipIntensity * 1000);
	var rainCollapse = max < 50;
	if (rainCollapse) hourlySVG.setAttribute('viewBox', '-24 -12 2708 564');
	max *= 1.3;
	max = Math.max(max, rainCollapse ? 500 : 1100);
	var p = 0;
	const incr2 = 144 / max;
	for (var ly = rainCollapse ? 272 : 384; ly > 248; ly -= incr2) {
		if (p % (max < 1500 ? 200 : max < 3000 ? 500 : max < 7000 ? 1000 : 2000) == 0) {
			hourlySVG.appendChild(createLine(32, ly, 2554, ly, '#323'));
			hourlySideSVG.appendChild(createText(20, ly + 4, 11, 'end', (p / 1000).toFixed(1)));
		}
		p++;
	}
	hourlySideSVG.appendChild(createText(4, rainCollapse ? 292 : 404, 14, false, 'mm/hr'));
	var max = 0;
	for (var i = 0; i < data.hourly.data.length; i++) max = Math.max(max, data.hourly.data[i].windSpeed);
	max *= 1.3;
	var p = 0;
	const incr5 = 100 / max;
	for (var ly = rainCollapse ? 520 : 632; ly > (rainCollapse ? 420 : 532); ly -= incr5) {
		if (p % (max < 6 ? 1 : max < 12 ? 2 : max < 24 ? 4 : 8) == 0) {
			hourlySVG.appendChild(createLine(32, ly, 2554, ly, '#323'));
			hourlySideSVG.appendChild(createText(20, ly + 4, 11, 'end', p.toString()));
		}
		p++;
	}
	hourlySideSVG.appendChild(createText(4, rainCollapse ? 540 : 662, 14, false, 'm/s'));
	for (let t = data.hourly.data[0].time; t <= data.hourly.data[data.hourly.data.length - 1].time; t += 3600) {
		var d = new Date(t * 1000),
			x = (t - data.hourly.data[0].time) / 3600 / 48 * 720 + 32;
		if (d.getHours() % 12 == 0) hourlySVG.appendChild(createLine(x, 4, x, 716, '#323'));
		else if (d.getHours() % 12 == 6 && x > 75) {
			const text = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + (d.getHours() == 18 ? ' afternoon' : ' morning');
			hourlySVG.appendChild(createText(x, 0, 11, 'middle', text));
			hourlySVG.appendChild(createText(x, rainCollapse ? 550 : 662, 11, 'middle', text));
		}
	}
	var lastlastY = undefined,
		lastY = undefined,
		nextControl = undefined,
		d = 'M',
		m = 0.5;
	let lastlastYa,
		lastYa,
		nextControla,
		da = `M32,-100 L${data.hourly.data.length * 15 + 18},-100`,
		ma = 0.5;
	var lastlastY2 = undefined,
		lastY2 = undefined,
		nextControl2 = undefined,
		d2 = 'M',
		m2 = 0.5;
	let d5 = 'M',
		lastY5,
		lastlastY5,
		m5 = 0.5,
		nextControl5;
	const hourlyGradient = document.createElementNS(svgns, 'linearGradient');
	hourlyGradient.id = 'hourly-gradient';
	hourlyGradient.setAttribute('x1', '0');
	hourlyGradient.setAttribute('y1', '0');
	hourlyGradient.setAttribute('x2', '1');
	hourlyGradient.setAttribute('y2', '0');
	const rainGradient2 = document.createElementNS(svgns, 'linearGradient');
	rainGradient2.id = 'rain-gradient2';
	const hcGradient = document.createElementNS(svgns, 'linearGradient');
	hcGradient.id = 'hc-gradient';
	const hvGradient = document.createElementNS(svgns, 'linearGradient');
	hvGradient.id = 'hv-gradient';
	for (var i = 0; i < data.hourly.data.length; i++) {
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${i / data.hourly.data.length * 100}%`);
		stop.setAttribute('stop-color', `hsl(${Math.round(data.hourly.data[i].humidity * 140)}, 100%, 50%)`);
		hourlyGradient.appendChild(stop);
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${i / data.hourly.data.length * 100}%`);
		stop.setAttribute('stop-color', `hsl(0, 0%, ${100 - data.hourly.data[i].cloudCover * 95}%)`);
		hcGradient.appendChild(stop);
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${i / data.hourly.data.length * 100}%`);
		stop.setAttribute('stop-color', `rgb(${Math.round(data.hourly.data[i].visibility / 16.09 * 255)}, ${Math.round(data.hourly.data[i].visibility / 16.09 * 144)}, 0)`);
		hvGradient.appendChild(stop);
		var y = 216 - (data.hourly.data[i].temperature + 273.15 - min) * incr;
		if (lastY) {
			if (i > 1) d += `${nextControl.x},${nextControl.y} ${i * 15 + 18 - 15 * m},${lastY + m * (lastY - y)} ${i * 15 + 18},${lastY} `;
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastY);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			hourlySVG.appendChild(circle);
			if (lastlastY) {
				m = 1 / (2 + 0.2 * Math.pow(Math.abs(lastlastY - lastY - (lastY - y)), 1.5));
				nextControl = {
					'x': i * 15 + 18 + 15 * m,
					'y': lastY - m * (lastlastY - lastY)
				};
			} else {
				nextControl = {
					'x': lastlastY ? i * 15 + 18 + 15 * n : i * 15 + 18,
					'y': lastlastY ? lastY - m * (lastlastY - lastY) : lastY
				};
			}
			if (i == data.hourly.data.length - 1) d += `${nextControl.x},${nextControl.y} ${i * 15 + 32},${y} ${i * 15 + 32},${y}`;
		} else d += `${i * 15 + 32},${y} C`;
		lastlastY = lastY;
		lastY = y;
		const ya = data.hourly.data[i].temperature == data.hourly.data[i].apparentTemperature ? undefined : 216 - (data.hourly.data[i].apparentTemperature + 273.15 - min) * incr;
		if (lastYa) {
			if (i > 1 && ya && nextControla) da += `${nextControla.x},${nextControla.y} ${i * 15 + 18 - 15 * ma},${lastYa + ma * (lastYa - ya)} ${i * 15 + 18},${lastYa} `;
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastYa);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			hourlySVG.appendChild(circle);
			if (lastlastYa && ya) {
				ma = 1 / (2 + 0.2 * Math.pow(Math.abs(lastlastYa - lastYa - (lastYa - ya)), 1.5));
				nextControla = {
					'x': i * 15 + 18 + 15 * ma,
					'y': lastYa - ma * (lastlastYa - lastYa)
				};
			} else if (ya) {
				nextControla = {
					'x': i * 15 + 18,
					'y': lastYa
				};
			} else nextControla = undefined;
			if (i == data.hourly.data.length - 1 || nextControla && data.hourly.data[i + 1].temperature == data.hourly.data[i + 1].apparentTemperature) da += `${nextControla.x},${nextControla.y} ${i * 15 + 32},${ya} ${i * 15 + 32},${ya}`;
		} else if (ya) da += ` M${i * 15 + 32},${ya} C`;
		if (ya) {
			lastlastYa = lastYa;
			lastYa = ya;
		} else lastlastYa = lastYa = undefined;
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${i / data.hourly.data.length * 100}%`);
		var scolor = data.hourly.data[i].precipProbability * 223;
		stop.setAttribute('stop-color', `rgb(32, ${Math.round(32 + scolor / 2)}, ${Math.round(32 + scolor)})`);
		rainGradient2.appendChild(stop);
		const y2 = (rainCollapse ? 272 : 384) - data.hourly.data[i].precipIntensity * 1000 * incr2;
		if (lastY2) {
			if (i > 1) d2 += `${nextControl2.x},${nextControl2.y} ${i * 15 + 18 - 15 * m2},${(lastY2 + m2 * (lastY2 - y2)).bound(false, rainCollapse ? 272 : 384)} ${i * 15 + 18},${lastY2} `;
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastY2);
			circle.setAttribute('rx', 4);
			circle.setAttribute('ry', 4);
			hourlySVG.appendChild(circle);
			if (lastlastY2) {
				m2 = 1 / (2 + 0.2 * Math.pow(Math.abs(lastlastY2 - lastY2 - (lastY2 - y2)), 1.5));
				nextControl2 = {
					'x': i * 15 + 18 + 15 * m2,
					'y': (lastY2 - m2 * (lastlastY2 - lastY2)).bound(false, rainCollapse ? 272 : 384)
				};
			} else {
				nextControl2 = {
					'x': lastlastY2 ? i * 15 + 18 + 10 * n : i * 15 + 18,
					'y': (lastlastY2 ? lastY2 - m2 * (lastlastY2 - lastY2) : lastY2).bound(false, rainCollapse ? 272 : 384)
				};
			}
			if (i == data.hourly.data.length - 1) d2 += `${nextControl2.x},${nextControl2.y} ${i * 15 + 32},${y2} ${i * 15 + 32},${y2}`;
		} else d2 += `${i * 15 + 32},${y2} C`;
		lastlastY2 = lastY2;
		lastY2 = y2;
		const y5 = (rainCollapse ? 520 : 632) - data.hourly.data[i].windSpeed * incr5;
		if (lastY5) {
			if (i > 1) d5 += `${nextControl5.x},${nextControl5.y} ${i * 15 + 18 - 15 * m5},${(lastY5 + m5 * (lastY5 - y5)).bound(false, rainCollapse ? 520 : 632)} ${i * 15 + 18},${lastY5} `;
			var circle = document.createElementNS(svgns, 'ellipse');
			circle.setAttribute('cx', i * 15 + 18);
			circle.setAttribute('cy', lastY5);
			circle.setAttribute('rx', 5);
			circle.setAttribute('ry', 5);
			hourlySVG.appendChild(circle);
			if (lastlastY5) {
				m5 = 1 / (2 + 0.2 * Math.pow(Math.abs(lastlastY5 - lastY5 - (lastY5 - y5)), 1.5));
				nextControl5 = {
					'x': i * 15 + 18 + 15 * m5,
					'y': (lastY5 - m5 * (lastlastY5 - lastY5)).bound(false, rainCollapse ? 520 : 632)
				};
			} else {
				nextControl5 = {
					'x': lastlastY5 ? i * 15 + 18 + 10 * n : i * 15 + 18,
					'y': (lastlastY5 ? lastY5 - m5 * (lastlastY5 - lastY5) : lastY5).bound(false, rainCollapse ? 520 : 632)
				};
			}
			if (i == data.hourly.data.length - 1) d5 += `${nextControl5.x},${nextControl5.y} ${i * 15 + 32},${y5} ${i * 15 + 32},${y5}`;
		} else d5 += `${i * 15 + 32},${y5} C`;
		lastlastY5 = lastY5;
		lastY5 = y5;
		var rect = document.createElementNS(svgns, 'rect');
		rect.setAttribute('x', i * 15 + 26);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', 15);
		rect.setAttribute('height', 700);
		rect.style.opacity = 0;
		hourlySVG.appendChild(rect);
		hourlySVG.appendChild(createText(i * 15 + 42, y, 14, false, `{${(data.hourly.data[i].temperature + 273.15).toFixed(2)}}\u2006K, {${data.hourly.data[i].humidity.toFixed(2)}} humidity`));
		hourlySVG.appendChild(createText(i * 15 + 42, y + 16, 14, false, `at {${new Date(data.hourly.data[i].time * 1000).getHours()}:00}`));
		hourlySVG.appendChild(createText(i * 15 + 42, y2 - 36, 14, false, `{${data.hourly.data[i].precipProbability.toFixed(2)}} chance of ${data.hourly.data[i].precipType || 'pcpn'}`));
		if (rainCollapse) hourlySVG.lastChild.style.opacity = 0;
		hourlySVG.appendChild(createText(i * 15 + 42, y2 - 20, 14, false, `{${(data.hourly.data[i].precipIntensity * 1000).toFixed(0)}}\u2006µm/hr`));
		hourlySVG.appendChild(createText(i * 15 + 42, y2 - 4, 14, false, `at {${new Date(data.hourly.data[i].time * 1000).getHours()}:00}`));
		const y3 = rainCollapse ? 366 : 478;
		hourlySVG.appendChild(createText(i * 15 + 42, y3 - 28, 14, false, `{${data.hourly.data[i].cloudCover.toFixed(2)}} cloud cover`));
		hourlySVG.appendChild(createText(i * 15 + 42, y3 + 4, 14, false, `${data.hourly.data[i].visibility > 16.08 ? '{Max}' : `{${(data.hourly.data[i].visibility || 0).toFixed(2)}}\u2006km`} visibility`));
		if (isNaN(data.hourly.data[i].visibility)) hourlySVG.lastChild.style.display = 'none';
		hourlySVG.appendChild(createText(i * 15 + 42, y3 + 20, 14, false, `at {${new Date(data.hourly.data[i].time * 1000).getHours()}:00}`));
		if (data.hourly.data[i].windSpeed) hourlySVG.appendChild(createText(i * 15 + 42, y5 - 20, 14, false, `{${data.hourly.data[i].windSpeed.toFixed(2)}}\u2006m/s`));
		hourlySVG.appendChild(createText(i * 15 + 42, y5 - 4, 14, false, `at {${new Date(data.hourly.data[i].time * 1000).getHours()}:00}`));
	}
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastY);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastYa);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastY2);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	var circle = document.createElementNS(svgns, 'ellipse');
	circle.setAttribute('cx', i * 15 + 18);
	circle.setAttribute('cy', lastY5);
	circle.setAttribute('rx', 4);
	circle.setAttribute('ry', 4);
	hourlySVG.appendChild(circle);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d);
	path.style.stroke = 'url(#hourly-gradient)';
	hourlySVG.insertBefore(path, hourlySVG.getElementsByTagName('rect')[0]);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', da);
	path.style.stroke = 'url(#hourly-gradient)';
	path.style.opacity = 0.6;
	hourlySVG.insertBefore(path, hourlySVG.getElementsByTagName('rect')[0]);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d2 + (rainCollapse ? 'L2554,272 L32,272 Z' : 'L2554,384 L32,384 Z'));
	path.style.fill = 'url(#rain-gradient2)';
	hourlySVG.insertBefore(path, hourlySVG.getElementsByTagName('rect')[0]);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d5);
	path.style.stroke = '#8f8';
	hourlySVG.insertBefore(path, hourlySVG.getElementsByTagName('rect')[0]);
	hourlySVG.appendChild(hourlyGradient);
	hourlySVG.appendChild(rainGradient2);
	hourlySVG.appendChild(hcGradient);
	hourlySVG.appendChild(hvGradient);
	var rect = document.createElementNS(svgns, 'rect');
	rect.setAttribute('x', 32);
	rect.setAttribute('y', (rainCollapse ? 366 : 478) - 54);
	rect.setAttribute('width', 2520);
	rect.setAttribute('height', 12);
	rect.style.fill = 'url(#hc-gradient)';
	hourlySVG.insertBefore(rect, hourlySVG.getElementsByTagName('rect')[0]);
	var rect = document.createElementNS(svgns, 'rect');
	rect.setAttribute('x', 32);
	rect.setAttribute('y', (rainCollapse ? 366 : 478) - 22);
	rect.setAttribute('width', 2520);
	rect.setAttribute('height', 12);
	rect.style.fill = 'url(#hv-gradient)';
	hourlySVG.insertBefore(rect, hourlySVG.getElementsByTagName('rect')[0]);
	hourlySideSVG.appendChild(createText(-136, -8, 20, false, 'Temp'));
	hourlySideSVG.lastChild.style.fill = '#ff0';
	hourlySideSVG.lastChild.setAttribute('transform', 'rotate(-90)');
	hourlySideSVG.appendChild(createText(rainCollapse ? -288 : -340, -8, 20, false, 'Pcpn.'));
	hourlySideSVG.lastChild.style.fill = '#0af';
	hourlySideSVG.lastChild.setAttribute('transform', 'rotate(-90)');
	hourlySideSVG.appendChild(createText(rainCollapse ? -368 : -472, -8, 20, false, 'Cloud'));
	hourlySideSVG.lastChild.style.fill = '#eee';
	hourlySideSVG.lastChild.setAttribute('transform', 'rotate(-90)');
	if (!isNaN(data.hourly.data[0].visibility)) {
		hourlySideSVG.appendChild(createText(rainCollapse ? -396 : -500, 18, 20, false, 'Visibility'));
		hourlySideSVG.lastChild.style.fill = '#f96';
		hourlySideSVG.lastChild.setAttribute('transform', 'rotate(-90)');
	}
	hourlySideSVG.appendChild(createText(rainCollapse ? -500 : -604, -8, 20, false, 'Wind'));
	hourlySideSVG.lastChild.style.fill = '#8f8';
	hourlySideSVG.lastChild.setAttribute('transform', 'rotate(-90)');
	hourlySideSVG.appendChild(createLine(-14, 12, -14, 74, '#ff0'));
	hourlySideSVG.appendChild(createLine(-14, 144, -14, 236, '#ff0'));
	const a = rainCollapse ? 0 : 104;
	hourlySideSVG.appendChild(createLine(-14, 236, -14, 234 + a / 2, '#0af'));
	hourlySideSVG.appendChild(createLine(-14, 292 + a / 2, -14, 304 + a, '#0af'));
	hourlySideSVG.appendChild(createLine(-14, 408 + a, -14, 448 + a, '#8f8'));
	hourlySideSVG.appendChild(createLine(-14, 504 + a, -14, 552 + a, '#8f8'));
	const hourlySVGCont2 = document.createElement('div');
	hourlySVGCont2.id = 'hourly-cont2';
	hourlySVGCont2.appendChild(hourlySVG);
	const hourlySVGCont = document.createElement('div');
	hourlySVGCont.id = 'hourly-cont';
	hourlySVGCont.appendChild(hourlySideSVG);
	hourlySVGCont.appendChild(hourlySVGCont2);
	block2.appendChild(hourlySVGCont);
	const dailyTitle = document.createElement('h2');
	dailyTitle.appendChild(document.createTextNode(fixSummary(data.daily.summary)));
	cont.appendChild(block2);
	const block3 = document.createElement('div');
	block3.appendChild(dailyTitle);
	const dailySVG = document.createElementNS(svgns, 'svg');
	dailySVG.id = 'daily';
	dailySVG.setAttribute('viewBox', innerWidth >= 2400 ? '0 0 960 786' : '0 0 960 496');
	var min = Infinity,
		max = -Infinity;
	for (var i = 0; i < data.daily.data.length; i++) {
		min = Math.min(min, data.daily.data[i].temperatureMin + 273.15);
		min = Math.min(min, data.daily.data[i].apparentTemperatureMin + 273.15);
		max = Math.max(max, data.daily.data[i].temperatureMax + 273.15);
		max = Math.max(max, data.daily.data[i].apparentTemperatureMax + 273.15);
	}
	var range = max - min,
		s = Math.ceil(range / 8);
	max = Math.ceil(max + range / 10);
	min = Math.floor(min - range / 10);
	range = max - min;
	var p = min;
	var incr = 252 / range;
	for (let lx = 104; lx <= 368; lx += incr) {
		if (p % s == 0) {
			dailySVG.appendChild(createLine(lx, 16, lx, 790, '#323'));
			dailySVG.appendChild(createText(lx, 14, 12, 'middle', p.toString()));
		}
		p++;
	}
	dailySVG.appendChild(createText(88, 16, 14, 'end', 'K'));
	function calcx(d) {
		return 104 + 252 * (d - min) / range;
	}
	function calcy(d) {
		return 16 + (innerWidth >= 2400 ? 748 : 468) * (d - data.daily.data[0].time) / 86400 / 8;
	}
	const dailyGradient = document.createElementNS(svgns, 'linearGradient');
	dailyGradient.id = 'daily-gradient';
	dailyGradient.setAttribute('y2', '1');
	dailyGradient.setAttribute('x1', '0');
	dailyGradient.setAttribute('x2', '0');
	const dcGradient = document.createElementNS(svgns, 'linearGradient');
	dcGradient.id = 'dc-gradient';
	dcGradient.setAttribute('y2', '1');
	dcGradient.setAttribute('x1', '0');
	dcGradient.setAttribute('x2', '0');
	var d1 = 'M',
		d2 = 'M';
	for (var i = 0; i < data.daily.data.length; i++) {
		const k = data.daily.data[i];
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${((k.time - data.daily.data[0].time) / 864 + 50) / 8}%`);
		stop.setAttribute('stop-color', `hsl(${Math.round(k.humidity * 140)}, 100%, 50%)`);
		dailyGradient.appendChild(stop);
		var stop = document.createElementNS(svgns, 'stop');
		stop.setAttribute('offset', `${((k.time - data.daily.data[0].time) / 864 + 50) / 8}%`);
		stop.setAttribute('stop-color', `hsl(0, 0%, ${100 - k.cloudCover * 95}%)`);
		dcGradient.appendChild(stop);
		d1 += k.temperatureMinTime < k.temperatureMaxTime
			? `${calcx(k.temperatureMin + 273.15)},${calcy(k.temperatureMinTime)}L${calcx(k.temperatureMax + 273.15)},${calcy(k.temperatureMaxTime)}L`
			: `${calcx(k.temperatureMax + 273.15)},${calcy(k.temperatureMaxTime)}L${calcx(k.temperatureMin + 273.15)},${calcy(k.temperatureMinTime)}L`;
		d2 += k.apparentTemperatureMinTime < k.apparentTemperatureMaxTime
			? `${calcx(k.apparentTemperatureMin + 273.15)},${calcy(k.apparentTemperatureMinTime)}L${calcx(k.apparentTemperatureMax + 273.15)},${calcy(k.apparentTemperatureMaxTime)}L`
			: `${calcx(k.apparentTemperatureMax + 273.15)},${calcy(k.apparentTemperatureMaxTime)}L${calcx(k.apparentTemperatureMin + 273.15)},${calcy(k.apparentTemperatureMinTime)}L`;
		dailySVG.appendChild(createText(4, calcy(k.time + 43200) + 4, 16, false, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date(k.time * 1000)).getDay()]));
		if (i) dailySVG.insertBefore(createLine(0, calcy(k.time), 960, calcy(k.time), '#323'), dailySVG.firstChild);
		dailySVG.appendChild(createText(400, calcy(k.time + 43200) - 6, 16, false, `{${fixSummary(k.summary)}}`));
		var rect = document.createElementNS(svgns, 'rect');
		rect.setAttribute('x', 400);
		rect.setAttribute('y', calcy(k.time + 43200) - 1);
		rect.setAttribute('width', Math.sqrt(k.precipIntensity) * 100);
		rect.setAttribute('height', 6);
		rect.style.fill = '#0af';
		dailySVG.appendChild(rect);
		dailySVG.appendChild(createLine(400, calcy(k.time + 43200) + 2, 400 + Math.sqrt(k.precipIntensityMax) * 100, calcy(k.time + 43200) + 2, '#0af'));
		let dayRainText = '';
		if (k.precipIntensity) dayRainText += `{${k.precipProbability.toFixed(2)}} chance of ${k.precipType || 'pcpn'} at {${(k.precipIntensity * 1000).toFixed(0)}}\u2006µm/hr`;
		else dayRainText += 'No pcpn';
		if (k.precipIntensityMaxTime) dayRainText += `, max of {${(k.precipIntensityMax * 1000).toFixed(0)}}\u2006µm/hr at {${(new Date(k.precipIntensityMaxTime * 1000)).getHours()}}:00`;
		dailySVG.appendChild(createText(400, calcy(k.time + 43200) + 19, 14, false, dayRainText));
		if (k.sunriseTime) dailySVG.appendChild(createLine(104, calcy(k.sunriseTime), 372, calcy(k.sunriseTime), '#990'));
		if (k.sunsetTime) dailySVG.appendChild(createLine(104, calcy(k.sunsetTime), 372, calcy(k.sunsetTime), '#740'));
		const srt = new Date(k.sunriseTime * 1000);
		if (k.sunriseTime) dailySVG.appendChild(createText(100, Math.max(calcy((data.daily.data[i - 1] || {'sunsetTime': 0}).sunsetTime) + 14, calcy(k.sunriseTime)) + 5, 12, 'end', `{${srt.getHours()}:${`00${srt.getMinutes()}`.substr(-2)}:${`00${srt.getSeconds()}`.substr(-2)}}`));
		const sst = new Date(k.sunsetTime * 1000);
		if (k.sunsetTime) dailySVG.appendChild(createText(100, Math.max(calcy(k.sunriseTime) + 14, calcy(k.sunsetTime)) + 5, 12, 'end', `{${sst.getHours()}:${`00${sst.getMinutes()}`.substr(-2)}:${`00${sst.getSeconds()}`.substr(-2)}}`));
	}
	dailySVG.appendChild(dailyGradient);
	dailySVG.appendChild(dcGradient);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d1.substr(0, d1.length - 1));
	path.style.stroke = 'url(#daily-gradient)';
	dailySVG.appendChild(path);
	var path = document.createElementNS(svgns, 'path');
	path.setAttribute('d', d2.substr(0, d2.length - 1));
	path.style.stroke = 'url(#daily-gradient)';
	path.style.opacity = 0.6;
	dailySVG.appendChild(path);
	var rect = document.createElementNS(svgns, 'rect');
	rect.setAttribute('x', 372);
	rect.setAttribute('y', 18);
	rect.setAttribute('width', 12);
	rect.setAttribute('height', innerWidth >= 2400 ? 746 : 466);
	rect.style.fill = 'url(#dc-gradient)';
	dailySVG.appendChild(rect);
	block3.appendChild(dailySVG);
	cont.appendChild(block3);
	document.body.insertBefore(cont, document.body.firstChild);
}

if (localStorage.lastData) {
	try {
		drawData(JSON.parse(localStorage.lastData));
	} catch (e) {
		console.log(e);
	}
}

let apiInput = document.getElementById('api-key'),
	locationInput = document.getElementById('location');
apiInput.value = localStorage.apiKey || apiInput.focus() || '';
locationInput.value = localStorage.lastLocation || '';
apiInput.oninput = function() {
	localStorage.apiKey = this.value;
};
locationInput.oninput = function() {
	localStorage.lastLocation = this.value;
};
function refreshLocation() {
	navigator.geolocation.getCurrentPosition((pos) => {
		localStorage.lastLocation = `${pos.coords.latitude},${pos.coords.longitude}`;
		location.reload();
	}, (e) => {
		alert('Error determining location.');
		throw JSON.stringify(e);
	});
}
function refresh() {
	const req = new XMLHttpRequest();
	req.open('GET', `https://devdoodle.net:2244/?url=${encodeURIComponent(`${apiInput.value}/${locationInput.value}?units=si&extend=hourly&v=${Math.random()}`)}`); // TODO: display full week of hourly data
	req.send();
	req.addEventListener('load', function() {
		const e = document.getElementsByTagName('section')[0];
		if (e) e.parentNode.removeChild(e);
		try {
			drawData(JSON.parse(localStorage.lastData = this.responseText));
		} catch (e) {
			console.log(e);
		}
	});
}
if (!locationInput.value) refreshLocation();
else refresh();
// var interval = setInterval(refresh, 300000);
// document.addEventListener('visibilitychange', function() {
// 	if (document.hidden) clearInterval(interval);
// 	else {
// 		refresh();
// 		interval = setInterval(refresh, 300000);
// 	}
// });

document.getElementById('refresh-location').addEventListener('click', refreshLocation);
let lastInnerWidth = innerWidth;
addEventListener('resize', () => {
	if (lastInnerWidth < 2400 != innerWidth < 2400) {
		const e = document.getElementsByTagName('section')[0];
		if (e) e.parentNode.removeChild(e);
		drawData(JSON.parse(localStorage.lastData));
	}
	lastInnerWidth = innerWidth;
});
