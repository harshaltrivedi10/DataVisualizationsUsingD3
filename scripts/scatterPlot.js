// this is where your implementation for your scatter plot should go 
var datasetName;
function ScatterPlot(svg,url,dataset) {
    datasetName = dataset;
    console.log(datasetName)

    // d3.select("#min_size_change").on("load", function(){
    //     d3.select(this).property("value") = 5;
    // });

    if(datasetName.includes("_updated") == true) {
        datasetName = datasetName.replace("_updated", "");
    }
    console.log(url)

    var margins = {
        top: 30,
        bottom: 30,
        left: 30,
        right: 30
    };

    this.svg = svg;

    // grab the bounding box of the container
    var boundingBox = this.svg.node().getBoundingClientRect();

    //  grab the width and height of our containing SVG
    var svgHeight = boundingBox.height;
    var svgWidth = boundingBox.width;

    //Set the width of axis-range
    var xWidth = svgWidth - (margins.left+margins.right);
    var yHeight = svgHeight - (margins.top+margins.bottom);

    // set the scale- set range of the scale
    var x = d3.scaleLinear().range([0, xWidth]);
    var y = d3.scaleLinear().range([0, yHeight]);

    //load the data
    d3.csv(url, function(error, data) {

        if(error) { console.log(error);}
        
            data.forEach(function(d,i) {
                d.id = i+1;
                d.x = +d.x;
                d.y = +d.y;
                d.label = +d.label;
            
            });

            
            // set the domain of the scale
            x.domain(d3.extent(data, function(d) {
                return d.x;
            }));
            y.domain(d3.extent(data, function(d) {
                return d.y;
            }));

            //color scale

            //domain for color scale
            // colorDomain = [-1,0,1,2,3,4,5,6,7,8,9,10,11];
            // colorRange = ["#000000", "#00cc44", "#ff9966", "#996633","#cc6699","#ffd633","#ff9999","#000099","#008080", "#993333", "#ff4000", "#664d00", "#004d1a"];

            // var ordinalScale = d3.scaleOrdinal()
            //                     .domain(colorDomain)
            //                     .range(colorRange);
            
            var ordinalScale = d3.scaleOrdinal()
                                .domain(["-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
                                .range(d3.schemeTableau10);
                                
            var circles = svg.append("g").selectAll("circle")	
                                .data(data)
                                .enter().append("circle")
                                            .attr("transform", "translate(50" + ","+ (margins.top) + ")")								
                                            .attr("r", 5)
                                            .attr('class','not_selected')
                                            .attr("cx", function(d) { return x(d.x); })		 
                                            .attr("cy", function(d) { return y(d.y); })
                                            .style("fill", function(d){ return ordinalScale(d.label); });
            
            d3.select("#min_size_change").on("change", function(){
                console.log("clicked!!!!");
                circles.attr("r", Number(d3.select(this).property("value")));
            });
            
            //Brush selection
            function highlightBrushedCircles() {
                
            //if it's a first brush, set opacity of unselected point to 0.2 other wise leave all the points as 
                 
                if(brushNo === 1){
                    if (d3.event.selection != null) {
                        var brush_coords = d3.event.selection;
                        
                        // style brushed circles
                        circles.attr("class",function(d){
                                                if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){ return "selected"; }
                                                else{return "not_selected";}
                               })
                               .attr("opacity", function(d){
                                                    if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){  return 1;}
                                                    else{ return 0.2; }
                                });
                    }
                    if(d3.selectAll(".selected").data().length == 0){
                        circles.attr("opacity", 1);
                    }    
                }
                else{
                    if (d3.event.selection != null) {
                        var brush_coords = d3.event.selection;
                    
                        d3.selectAll('.not_selected')
                                .classed('.not_selected', false)
                                .attr("class",function(d){
                                                        if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){ return "selected"; }
                                                        else{ return "not_selected";} 
                                    })
                               .attr("opacity", function(d){
                                                    if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){  return 1; }
                                                    else{ return 0.2; }
                                                    
                                });
                    }
                    
                }        
            }

            //function for highlighitng points selected for removal
            function highlightRemovalCircles(){
                if (d3.event.selection != null) {
                    var brush_coords = d3.event.selection;
                
                    d3.selectAll('.selected')
                            .classed('.selected', false)
                            .attr("class",function(d){
                                                    if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){ return "not_selected"; }
                                                    else{ return "selected";} 
                                })
                            .attr("opacity", function(d){
                                                if(isBrushed(brush_coords, newScaleX(d.x)+50, newScaleY(d.y)+30)){  return 0.2; }
                                                else{ return 1; }
                                                
                            });
                }    
                   
            }

            var gBrushes = svg.append('g')
                                .attr("class", "brushes");

            // We also keep the actual d3-brush functions and their IDs in a list:
            var brushes = [];
            var brushNo = brushes.length;
            var isRemovalBrush = false;

            /* CREATE NEW BRUSH
            *
            * This creates a new brush. A brush is both a function (in our array) and a set of predefined DOM elements
            * Brushes also have selections. While the selection are empty (i.e. a suer hasn't yet dragged)
            * the brushes are invisible. We will add an initial brush when this viz starts. (see end of file)
            * Now imagine the user clicked, moved the mouse, and let go. They just gave a selection to the initial brush.
            * We now want to create a new brush.
            * However, imagine the user had simply dragged an existing brush--in that case we would not want to create a new one.
            * We will use the selection of a brush in brushend() to differentiate these cases.
            */
            function newBrush() {
                brushNo = brushNo + 1;
                var brush;    
                if(isRemovalBrush){
                    isRemovalBrush = false;
                    //create a brush for removing points
                    brush = d3.brush()
                    .filter(()=>{
                        if(!d3.event.shiftKey) return false;
                        return true;
                    })
                    .on("brush", highlightRemovalCircles)
                    .on("end", brushend);
                }
                else{
                    //create a brush for removing points
                    brush = d3.brush()
                    .filter(()=>{
                        if(!d3.event.shiftKey) return false;
                        return true;
                    })
                    .on("brush", highlightBrushedCircles)
                    .on("end", brushend);
                }

                brushes.push({id: brushes.length, brush: brush});

                function brushend() {
                    // Figure out if our latest brush has a selection
                    var lastBrushID = brushes[brushes.length - 1].id;
                    var lastBrush = document.getElementById('brush-' + lastBrushID);
                    var selection = d3.brushSelection(lastBrush);

                    // If it does, that means we need another one
                    if (selection && selection[0] !== selection[1]) {
                        newBrush();
                    }

                    // Always draw brushes
                    drawBrushes();
                }
            }

            function drawBrushes() {

                    var brushSelection = gBrushes
                                            .selectAll('.brush')
                                            .data(brushes, function (d){return d.id});

                        // Set up new brushes
                    brushSelection.enter()
                                    .insert("g", '.brush')
                                    .attr('class', 'brush')
                                    .attr('id', function(brush){ return "brush-" + brush.id; })
                                    .each(function(brushObject) {
                                    //call the brush
                                    brushObject.brush(d3.select(this));
                                    });

                        /* REMOVE POINTER EVENTS ON BRUSH OVERLAYS
                        *
                        * This part is abbit tricky and requires knowledge of how brushes are implemented.
                        * They register pointer events on a .overlay rectangle within them.
                        * For existing brushes, make sure we disable their pointer events on their overlay.
                        * This frees the overlay for the most current (as of yet with an empty selection) brush to listen for click and drag events
                        * The moving and resizing is done with other parts of the brush, so that will still work.
                        */
                    brushSelection
                        .each(function (brushObject){
                        d3.select(this)
                            .attr('class', 'brush')
                            .selectAll('.overlay')
                            .style('pointer-events', function() {
                            var brush = brushObject.brush;
                            if (brushObject.id === brushes.length-1 && brush !== undefined) {
                                return 'all';
                            } else {
                                return 'none';
                            }
                            });
                        });

            brushSelection.exit()
                .remove();
            }

            newBrush();
            drawBrushes();

            //for clearing all the selection press C   
            d3.select('body').on('keydown', function(){
                
                if(d3.event.keyCode === 67){
                    circles.attr("opacity", 1);
                    circles.classed('selected', false);
                    circles.classed('not_selected', false);
                    circles.attr('class','not_selected');
                    d3.selectAll('.brush').remove();
                    brushNo = 0;

                    for( var i = 0; i < brushes.length; i++){ 
                        brushes.pop();
                     }
                    
                    newBrush();
                    drawBrushes();
                }

                //for removing points from a selection, press R
                else if(d3.event.keyCode == 82){
                    isRemovalBrush = true;
                    //select last normal brush and remove it from DOM
                    var lastBrushID = brushes[brushes.length - 1].id;
                    var lastBrush = document.getElementById('brush-' + lastBrushID);
                    d3.select(lastBrush).remove();

                    //remove it from list of brushes as well
                    brushes.pop();

                    //create a new brush
                    newBrush();
                    drawBrushes();
                }
            });


            
            // Pan and zoom

            //copy the orignal scale
            var newScaleX = d3.scaleLinear().range([0, xWidth]);
            var newScaleY = d3.scaleLinear().range([0, yHeight]);

            // set the domain of the scale
            newScaleX.domain(d3.extent(data, function(d) {
                return d.x;
            }));
            newScaleY.domain(d3.extent(data, function(d) {
                return d.y;
            }));

            var zoom = d3.zoom()
                            .scaleExtent([.5, 20])
                            .extent([[0, 0], [xWidth, yHeight]])
                            .on("zoom", zoomed);

            svg
                .style("pointer-events", "all")
                .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
                .call(zoom);

            function zoomed() {

                // create new scale ojects based on event
                    newScaleX = d3.event.transform.rescaleX(x);
                    newScaleY = d3.event.transform.rescaleY(y);
                
                    circles.data(data)
                        .attr('cx', function(d) {return newScaleX(d.x)})
                        .attr('cy', function(d) {return newScaleY(d.y)});
                }
            
    });
}

//function to check if the circle is under the selection
function isBrushed(brush_coords, cx, cy) {

    var x0 = brush_coords[0][0],
        x1 = brush_coords[1][0],
        y0 = brush_coords[0][1],
        y1 = brush_coords[1][1];

   return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
}

function selectedPoints(){

    console.log(d3.selectAll('.selected').data());
    var data = d3.selectAll('.selected').data();
    var request = new XMLHttpRequest();
 
    console.log(datasetName); 
    
    request.open('POST', 'http://127.0.0.1:5000/addCluster?dataset='+datasetName);
    //request.setRequestHeader("Content-Type", "application/json");
 
    request.onload = function() {
      // Begin accessing JSON data here
       console.log(this.response);
       //construct data url
       datasetName = datasetName + "_updated";
       url = "./data/"+ datasetName + ".csv";  
       initCharts(url,datasetName);  
    }
 
    request.send(JSON.stringify(data));
 }

