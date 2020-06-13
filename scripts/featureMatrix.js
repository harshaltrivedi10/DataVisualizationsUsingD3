function draw (data) {
    // console.log("function called draw");
    d3.select("#grid").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();
    cols = data.columns;
    data.forEach(function (d) {
        for(var key of Object.keys(d)) {
            d[key] = Number(d[key]);
        }
    });
    console.log("Inside Feature Matrix");
    var corr = jz.arr.correlationMatrix(data, cols);
    var extent = d3.extent(corr.map(function(d){ return d.correlation; }).filter(function(d){ return d !== 1; }));
    var grid = data2grid.grid(corr);
    var rows = d3.max(grid, function(d){ return d.row; });
    var margin = {top: 0, bottom: 0, left: 50, right: 0};
    var dim = d3.min([window.innerWidth * .9, window.innerHeight * .9]);
    var h = window.innerHeight;
    var width = h*0.20;
    var height = h*0.20;
    var svg = d3.select("#grid").append("svg")
        .attr("width", width*2)
        .attr("height", height*2)
        .append("g")
        .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
    
    console.log(svg);
    var padding = .1;
    var x = d3.scaleBand()
        .range([0, width])
        .paddingInner(padding)
        .domain(d3.range(1, rows + 1));

    var y = d3.scaleBand()
        .range([0, height])
        .paddingInner(padding)
        .domain(d3.range(1, rows + 1));

    var c = chroma.scale(["tomato", "white", "steelblue"])
        .domain([extent[0], 0, extent[1]]);

    var x_axis = d3.axisTop(y);
    var y_axis = d3.axisLeft(x).tickFormat(function(d, i){ return cols[i]; });

    svg.append("g")
        .attr("class", "x axis")
        .call(x_axis);

    svg.append("g")
        .attr("class", "y axis")
        .call(y_axis);

    svg.selectAll("rect")
        .data(grid, function(d){ return d.column_a + d.column_b; })
        .enter().append("rect")
        .attr("x", function(d){ return x(d.column); })
        .attr("y", function(d){ return y(d.row); })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", function(d){ return c(d.correlation); })
        .style("opacity", 1e-6)
        .transition()
        .style("opacity", 1);

    var legend_top = 15;
    var legend_height = 15;

    var legend_svg = d3.select("#legend").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", legend_height + legend_top)
        .append("g")
        .attr("transform", "translate(" + margin.left + ", " + legend_top + ")");

    var defs = legend_svg.append("defs");
    var gradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    var stops = [{offset: 0, color: "tomato", value: extent[0]}, {offset: .5, color: "white", value: 0}, {offset: 1, color: "steelblue", value: extent[1]}];

    gradient.selectAll("stop")
        .data(stops)
        .enter().append("stop")
        .attr("offset", function(d){ return (100 * d.offset) + "%"; })
        .attr("stop-color", function(d){ return d.color; });

    legend_svg.append("rect")
        .attr("width", width)
        .attr("height", legend_height)
        .style("fill", "url(#linear-gradient)");

    legend_svg.selectAll("text")
        .data(stops)
        .enter().append("text")
        .attr("x", function(d){ return width * d.offset; })
        .attr("dy", -3)
        .style("text-anchor", function(d, i){ return i == 0 ? "start" : i == 1 ? "middle" : "end"; })
        .text(function(d, i){ return d.value.toFixed(2) + (i == 2 ? ">" : ""); });

}
