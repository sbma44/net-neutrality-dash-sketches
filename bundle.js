var ISP = {
  'charter-communications': 'Charter',
  'comcast-cable-communications-llc': 'Comcast',
  'mci-communications-services-inc-dba-verizon-business': 'Verizon',
  'att-services-inc': 'AT&T',
  'qwest-communications-company-llc': 'CenturyLink',
  'cox-communications-inc': 'Cox',
  'cogent-communications': 'Cogent',
  'level-parent-llc': 'Level3',
  'time-warner-cable-internet-llc': 'Spectrum'
};

window.highlights = {};

function toggle(container) {
  var button = d3.select(this);
  var off = button.attr('class').indexOf('off') === -1;
  button.classed('off', off);
  d3.selectAll(button.attr('rel') + '.graph').style('visibility', off ? 'hidden' : 'visible');
  d3.selectAll(button.attr('rel') + '.graph.highlight').style('visibility', 'hidden');
}

function highlight(container) {
  var line = d3.select(this);
  if (window.highlights[line.attr('rel')])
    clearTimeout(window.highlights[line.attr('rel')]);
  d3.select(container + ' .highlight.' + line.attr('rel')).style('visibility', 'visible');
}

function dehighlight(container) {
  var line = d3.select(this);
  window.highlights[line.attr('rel')] = setTimeout(function() {
    d3.select(container + ' .highlight.' + line.attr('rel')).style('visibility', 'hidden');
  }, 500);
}

function addAxes (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
  var axes = svg.append('g');

  axes.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + chartHeight + ')')
    .call(xAxis);

  axes.append('g')
    .attr('class', 'y axis')
    .call(yAxis)
    .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Δ median (ms)');
}

function drawPaths (container, svg, data, x, y) {
  var maxEntries = data._max;
  delete data._max;

  var colorScale = function(n) {
    var a = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    n = n % a.length;
    return a[n];
  }

  var area = d3.area()
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.pct75); })
    .y1(function (d) { return y(d.pct25); })
    .curve(d3.curveBasis);

  var medianLine = d3.line()
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.pct50); })
    .curve(d3.curveBasis);

  data = data.filter(function(d) { return d.values.length === d3.max(data, function (d) { return d.values.length; }) });

  var areaGroup = svg
    .append('g')
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .each(function(d, i, nodes) {
      var color = d3.color(colorScale(i));
      color.opacity = 0.2;
      var shaded = d3.select(this)
        .append('path')
        .datum(d.values)
        .attr('d', area)
        .style('fill', color.toString())
        .attr('class', 'graph area upper outer ' + d.values[0].geocodeisp)
        .attr('clip-path', 'url(#rect-clip)');
    });

  var areaHighlightGroup = svg
    .append('g')
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .each(function(d, i, nodes) {
      var color = d3.color(colorScale(i));
      color.opacity = 1;
      var shaded = d3.select(this)
        .append('path')
        .datum(d.values)
        .attr('d', area)
        .style('fill', color.brighter().toString())
        .style('visibility', 'hidden')
        .attr('class', 'graph area upper outer highlight ' + d.values[0].geocodeisp)
        .attr('clip-path', 'url(#rect-clip)');
    });

  var lineGroup = svg
    .append('g')
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .each(function(d, i, nodes) {
      var color = d3.color(colorScale(i));
      var line = d3.select(this)
        .append('path')
        .datum(d.values)
        .attr('d', medianLine)
        .style('stroke', color.toString())
        .attr('class', 'graph median-line ' + d.values[0].geocodeisp)
        .attr('clip-path', 'url(#rect-clip)')
        .attr('rel', container + ' ' + d.values[0].geocodeisp);
        // .on('mouseover', highlight)
        // .on('mouseout', dehighlight);
    });

  var anchor = d3.select(container)
    .append('div')
    .attr('class', 'labels')
    .selectAll('a')
    .data(data)
    .enter()
    .append('a');
  anchor.append('div').attr('class', 'swatch').style('background-color', function(d, i) { return colorScale(i); });
  anchor.append('span').text(function(d) { return ISP[d.values[0].geocodeisp] || d.values[0].geocodeisp; }).attr('class', 'inner-text');
  anchor.attr('rel', function(d) { return container + ' .' + d.values[0].geocodeisp; })
    .attr('class', function(d) { return 'toggle ' + d.values[0].geocodeisp; })
    .on('click', toggle);

  svg.append("line")
    .attr("x1", 0)
    .attr("y1", y(0))
    .attr("x2", x(d3.max(data, function (d) { return d3.max(d.values, function(e) { return e.date; })})))
    .attr("y2", y(0))
    .attr("class", "zeroCrossing");
}

function makeChart (container, data) {
  var svgWidth  = window.innerWidth - 50,
      svgHeight = window.innerHeight - 50,
      margin = { top: 20, right: 40, bottom: 40, left: 40 },
      chartWidth  = svgWidth  - margin.left - margin.right,
      chartHeight = svgHeight - margin.top  - margin.bottom;

  var x = d3.scaleTime()
            .domain([d3.min(data, function (d) { return d.date; }), d3.max(data, function (d) { return d.date; })])
            .range([0, chartWidth]);

  var y = d3.scaleLinear()
            .domain([d3.max(data, function (d) { return d.pct75; }), d3.min(data, function (d) { return d.pct25; })])
            .range([0, chartHeight]);

  var nestedData = d3.nest()
    .key(function (d) { return d.geocodeisp; })
    .entries(data);

  nestedData._max = Object.keys(nestedData).reduce(function(prev, cur) {
    return Math.max(nestedData[cur].values.length, prev);
  }, 0);

  var xAxis = d3.axisBottom(x)
                .ticks(nestedData._max).tickSizeInner(-chartHeight).tickSizeOuter(0).tickPadding(10).tickFormat(d3.timeFormat('%-m/%-d/%y')),
      yAxis = d3.axisLeft(y)
                .tickSizeInner(-chartWidth).tickSizeOuter(0).tickPadding(10);

  var svg = d3.select(container).append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var controls = d3.select(container).append('div')
    .attr('id', 'controls');

  drawPaths(container, svg, nestedData, x, y);

  addAxes(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
}

function chart(url, container) {
  d3.csv(url, function (d) {
    return {
      date:  new Date(d.dt),
      pct25: parseFloat(d.pct_25_norm),
      pct50: parseFloat(d.pct_50_norm),
      pct75: parseFloat(d.pct_75_norm),
      geocodeisp: d.geocodeisp_norm.toLowerCase().replace(/[^\sa-z]/g, '').replace(/\s+/g, '-')
    };
  })
  .then(function(data) { makeChart(container, data); });
}

chart('https://mapbox-instrumentomaton.s3.amazonaws.com/public/2018-06-10-time.csv', '#load-time');
chart('https://mapbox-instrumentomaton.s3.amazonaws.com/public/2018-06-10-dns.csv', '#dns');
chart('https://mapbox-instrumentomaton.s3.amazonaws.com/public/2018-06-10-tcp.csv', '#tcp');