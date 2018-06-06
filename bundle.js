var ISP = {
  'charter-communications': 'Charter',
  'comcast-cable-communications-llc': 'Comcast',
  'mci-communications-services-inc-dba-verizon-business': 'Verizon Business',
  'att-services-inc': 'AT&T'
};

function toggle() {
  console.log(this.className);
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

function drawPaths (svg, data, x, y) {
  var maxEntries = d3.max(data, function (d) { return d3.max(d.values, function(e) { return e.date; })});

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
      var shaded = d3.select(this)
        .append('path')
        .datum(d.values)
        .attr('d', area)
        .attr('class', 'area upper outer ' + d.values[0].geocodeisp)
        .attr('clip-path', 'url(#rect-clip)');
    });

  var lineGroup = svg
    .append('g')
    .selectAll('g')
    .data(data)
    .enter()
    .append('g')
    .each(function(d, i, nodes) {
      var line = d3.select(this)
        .append('path')
        .datum(d.values)
        .attr('d', medianLine)
        .attr('class', 'median-line ' + d.values[0].geocodeisp)
        .attr('clip-path', 'url(#rect-clip)');
    });

  var anchor = d3.select('body')
    .append('div')
    .attr('class', 'labels')
    .selectAll('a')
    .data(data)
    .enter()
    .append('a');
  anchor.append('div').attr('class', 'swatch');
  anchor.append('span').text(function(d) { return ISP[d.values[0].geocodeisp]; }).attr('class', 'inner-text');
  anchor.attr('rel', function(d) { return d.values[0].geocodeisp; })
    .attr('class', function(d) { return 'toggle ' + d.values[0].geocodeisp; })
    .on('click', toggle);

  svg.append("line")
    .attr("x1", 0)
    .attr("y1", y(0))
    .attr("x2", x(d3.max(data, function (d) { return d3.max(d.values, function(e) { return e.date; })})))
    .attr("y2", y(0))
    .attr("class", "zeroCrossing");
}

function makeChart (data) {
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

  var xAxis = d3.axisBottom(x)
                .tickSizeInner(-chartHeight).tickSizeOuter(0).tickPadding(10).tickFormat(d3.timeFormat('%-m/%-d/%y')),
      yAxis = d3.axisLeft(y)
                .tickSizeInner(-chartWidth).tickSizeOuter(0).tickPadding(10);

  var svg = d3.select('body').append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var controls = d3.select('body').append('div')
    .attr('id', 'controls');

  var nestedData = d3.nest()
    .key(function (d) { return d.geocodeisp; })
    .entries(data);

  drawPaths(svg, nestedData, x, y);

  addAxes(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
}

d3.csv('92c20db0-1537-4376-8063-c78efecec1ba.csv', function (d) {
  return {
    date:  new Date(d.dt),
    pct25: parseFloat(d.pct_25_norm),
    pct50: parseFloat(d.pct_50_norm),
    pct75: parseFloat(d.pct_75_norm),
    geocodeisp: d.geocodeisp.toLowerCase().replace(/[^\sa-z]/g, '').replace(/\s+/g, '-')
  };
})
.then(function(data) { makeChart(data); });