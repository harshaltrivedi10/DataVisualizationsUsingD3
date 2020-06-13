function histogram(datasetname , featurename, labelname) {
    d3.select("#histogram").selectAll("*").remove();
    console.log("inside Histogram");
    var data = []
    var featurelist = []
    if(datasetname.includes("_updated")) {
        url = "./data/" + datasetname.toString() + ".csv" 
        d3.csv("./data/" + datasetname.toString() + ".featurenames.csv", function(features) {
            data.forEach(function(d) {
                featurelist.push(d.feature);
           })
        });
      }
      else {
          url = "./backend/sample_data/" + datasetname.toString() + ".csv"
        
        d3.csv("./backend/sample_data/" + datasetname.toString() + ".featurenames.csv", function(features) {
            features.forEach(function(d) {
                featurelist.push(d.feature);
           })
        });
      }
    var index = 0;
    for(i=0;i<=featurelist.length;i++){
        if(featurename == featurelist[i])
        {
            index = i;
        }
    }
    var columnname = "dim " + index;

    d3.csv(url, function(data){
        classData = []
        featureData = []
        data.forEach(function(d){
            featureData.push(d[columnname]);
            if(d["label"] == labelname) {
                classData.push(d);
            }
        })
        var classData = classData.map(function(d) {return d[columnname];});

        var color = d3
        .scaleOrdinal()
        .domain(["-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
        .range(d3.schemeTableau10);

        var border=1;
        var bordercolor='black';
    
        var h = window.innerHeight;
        var margin = {top: 50, left: 50},
            width = h*0.3 - margin.left,
            height = h*0.3 - margin.top;
        
        // append the svg object to the body of the page
        var svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform",
                    "translate(" + margin.left + ","+(-margin.top)+")");
        
                    // d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/1_OneNum.csv", function(data) {
            featuremax = d3.max(featureData);
            featuremin = d3.min(featureData);
            console.log(featuremax)
            console.log(featuremin)

            var ticks = []
            var fmin = featuremin;
            var fmax = featuremax;
            var d = (fmax - fmin)/10;
            console.log(typeof d);
            for(var i=0; i<10; i++) {
                ticks.push(Number(fmin));
                fmin = Number(fmin) + Number(d);
            }
            console.log("ticks: "+ticks);

            var x = d3.scaleLinear()
                .domain([featuremin, featuremax])     // can use this instead of 1000 to have the max of data: d3.max(data, function(d) { return +d.price })
                .range([0, width])
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

                // Y axis: scale and draw:
                var y = d3.scaleLinear()
                    .range([height, margin.top+10]);
                    y.domain([0, 1]);   // d3.hist has to be called before the Y axis obviously
                svg.append("g")
                    .call(d3.axisLeft(y).ticks(3));

            // set the parameters for the histogram
            //var newData = data.map(function(d) {return Math.abs(d/178*100)});
    
            var histogram = d3.histogram()
                .value(function(d) {
                    return d; })   // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(ticks); // then the numbers of bins

            // And apply this function to data to get the bins
            var bins = histogram(featureData);

            var newhistogram = d3.histogram()
                .value(function(d) {
                    return d; })   // I need to give the vector of value
                .domain(x.domain())  // then the domain of the graphic
                .thresholds(ticks); // then the numbers of bins

            // And apply this function to data to get the bins
            var newbins = newhistogram(classData);

            // var newbins = histogram(newData);
            // console.log(newbins);
            // append the bar rectangles to the svg element

            var l = featureData.length;

            svg.selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d) {var a = d.length/l*5; return "translate(" + x(d.x0) + "," + y(a) + ")"; })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
                .attr("height", function(d) { var a = d.length/l*5; return height - y(a); })
                .style("fill", "#d3d3d3");


            svg.selectAll("rect1")
                .data(newbins)
                .enter()
                .append("rect")
                .attr("x", 1)
                .attr("transform", function(d) { var a = d.length/l*5; return "translate(" + x(d.x0) + "," + y(a) + ")"; })
                .attr("width", function(d) { return x(d.x1) - x(d.x0) ; })
                .attr("height", function(d) { 
                    var a = d.length/l*5; 
                    return height - y(a);
                   })
                .style("fill", function(){
                    return color(labelname);
                });

                    svg.append("text")
                        .attr("class", "axisLabel")
                        .attr("transform",
                            "translate(" + (width / 2) + " ," +
                            (height + 28) + ")")
                        .style("text-anchor", "middle")
                        .html(featurename).style("font-size", "12px");

                    svg.append("text")
                        .attr("class", "axisLabel")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 0 - margin.left)
                        .attr("x", 0 - (height / 2) - margin.top)
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text("Relative Frequency").style("font-size", "12px");

                    var borderPath = svg.append("rect")
                        .attr("x", -margin.left)
                        .attr("y", margin.top)
                        .attr("height", height )
                        .attr("width", width + 2*margin.left)
                        .style("stroke", bordercolor)
                        .style("fill", "none")
                        .style("stroke-width", border);
    


    })
    
}

// var datasetname = "wine"
// var featurename = "Alc"
// var labelname = "0"
// histogram(datasetname, featurename, labelname)