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
  var upperInnerArea = d3.area()
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.pct75); })
    .y1(function (d) { return y(d.pct50); })
    .curve(d3.curveBasis);

  var medianLine = d3.line()
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.pct50); })
    .curve(d3.curveBasis);

  var lowerInnerArea = d3.area()
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.pct50); })
    .y1(function (d) { return y(d.pct25); })
    .curve(d3.curveBasis);

  svg.datum(data);

  svg.append('path')
    .attr('class', 'area upper inner ' + data[0].geocodeisp)
    .attr('d', upperInnerArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'area lower inner ' + data[0].geocodeisp)
    .attr('d', lowerInnerArea)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append('path')
    .attr('class', 'median-line ' + data[0].geocodeisp)
    .attr('d', medianLine)
    .attr('clip-path', 'url(#rect-clip)');

  svg.append("line")
    .attr("x1", 0)
    .attr("y1", y(0))
    .attr("x2", x(d3.max(data, function (d) { return d.date; })))
    .attr("y2", y(0))
    .attr("class", "zeroCrossing");
}

function makeChart (data) {
  var svgWidth  = 960,
      svgHeight = 500,
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

  addAxes(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
  drawPaths(svg, data, x, y);
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
.then(function (data) {
  data = data.filter(function (d) { return d.geocodeisp.indexOf('comcast') !== -1; })
  makeChart(data);
});