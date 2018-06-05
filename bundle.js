function addAxesAndLegend (svg, xAxis, yAxis, margin, chartWidth, chartHeight) {
  // var legendWidth  = 200,
  //     legendHeight = 100;

  // clipping to make sure nothing appears behind legend
  // svg.append('clipPath')
  //   .attr('id', 'axes-clip')
  //   .append('polygon')
  //     .attr('points', (-margin.left)                 + ',' + (-margin.top)                 + ' ' +
  //                     (chartWidth - legendWidth - 1) + ',' + (-margin.top)                 + ' ' +
  //                     (chartWidth - legendWidth - 1) + ',' + legendHeight                  + ' ' +
  //                     (chartWidth + margin.right)    + ',' + legendHeight                  + ' ' +
  //                     (chartWidth + margin.right)    + ',' + (chartHeight + margin.bottom) + ' ' +
  //                     (-margin.left)                 + ',' + (chartHeight + margin.bottom));

  var axes = svg.append('g');
  //   .attr('clip-path', 'url(#axes-clip)');

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

  var upperInnerArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.pct75); })
    .y1(function (d) { return y(d.pct50); });

  var medianLine = d3.svg.line()
    .interpolate('basis')
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.pct50); });

  var lowerInnerArea = d3.svg.area()
    .interpolate('basis')
    .x (function (d) { return x(d.date) || 1; })
    .y0(function (d) { return y(d.pct50); })
    .y1(function (d) { return y(d.pct25); });

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
}

function makeChart (data) {
  var svgWidth  = 960,
      svgHeight = 500,
      margin = { top: 20, right: 40, bottom: 40, left: 40 },
      chartWidth  = svgWidth  - margin.left - margin.right,
      chartHeight = svgHeight - margin.top  - margin.bottom;

  var x = d3.time.scale().range([0, chartWidth])
            .domain(d3.extent(data, function (d) { return d.date; })),
      y = d3.scale.linear().range([chartHeight, 0])
            .domain([d3.min(data, function (d) { return d.pct25; }), d3.max(data, function (d) { return d.pct75; })]);

  var xAxis = d3.svg.axis().scale(x).orient('bottom')
                .innerTickSize(-chartHeight).outerTickSize(0).tickPadding(10),
      yAxis = d3.svg.axis().scale(y).orient('left')
                .innerTickSize(-chartWidth).outerTickSize(0).tickPadding(10);

  var svg = d3.select('body').append('svg')
    .attr('width',  svgWidth)
    .attr('height', svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  addAxesAndLegend(svg, xAxis, yAxis, margin, chartWidth, chartHeight);
  drawPaths(svg, data, x, y);
}

var parseDate  = d3.time.format('%Y-%m-%d').parse;
d3.csv('92c20db0-1537-4376-8063-c78efecec1ba.csv', function (error, rawData) {
  if (error) {
    console.error(error);
    return;
  }

  var data = rawData
    .filter(function (d) { return d.geocodeisp.indexOf('Comcast') !== -1; })
    .map(function (d) {
      return {
        date:  parseDate(d.dt),
        pct25: parseFloat(d.pct_25_norm),
        pct50: parseFloat(d.pct_50_norm),
        pct75: parseFloat(d.pct_75_norm),
        geocodeisp: d.geocodeisp.toLowerCase().replace(/[^\sa-z]/g, '').replace(/\s+/g, '-')
      };
    });

  makeChart(data);
});