function wordCloud(selector) {
    console.log("WordCloud1");
    d3.select("#chart").selectAll("*").remove();
    var fill = d3.scaleOrdinal(d3.schemeCategory20);

    var h = window.innerHeight;
    var width = h*0.20;
    var height = h*0.20;
    //Construct the word cloud's SVG element
    var svg = d3.select(selector).append("svg")
        .attr("width", width*2)
        .attr("height", height*2)
        .attr("class", "wordCloud")
        .append("g")
        .attr("transform", "translate("+width+","+height+")");


    //Draw the word cloud
    function draw(words) {
        console.log("draw");
        var cloud = svg.selectAll("g text")
                        .data(words, function(d) { return d.text; })

        //Entering words
        cloud.enter()
            .append("text")
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr('font-size', 1)
            .text(function(d) { return d.text; });

        //Entering and existing words
        cloud
            .transition()
                .duration(600)
                .style("font-size", function(d) { return d.size + "px"; })
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .style("fill-opacity", 1);

        //Exiting words
        cloud.exit()
            .transition()
                .duration(200)
                .style('fill-opacity', 1e-6)
                .attr('font-size', 1)
                .remove();
    }


    //Use the module pattern to encapsulate the visualisation code. We'll
    // expose only the parts that need to be public.
    return {

        //Recompute the word cloud for a new set of words. This method will
        // asycnhronously call draw when the layout has been computed.
        //The outside world will need to call this function, so make it part
        // of the wordCloud return value.
        update: function(words) {
            console.log("update");
            d3.layout.cloud().size([width*2, height*2])
                .words(words)
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .on("end", draw)
                .start();
        }
    }

}

//Some sample data - http://en.wikiquote.org/wiki/Opening_lines
// var words = [
//     'Alc', 'Malic acid', 'Ash', 'Alcal. of ash', 'Magnesium', 'Ttl phenols',
// 'Flavanoids', 'Nonflav. phenols', 'Proanth.', 'Col. intens.', 'Hue',
// 'OD280/OD315', 'Proline'
// ]

// var contributions = [-0.56930614,  0.00947918, -0.36003572,  0.35995936, -0.05803809, -0.14046298,
//     -0.3954186,   0.08502408,  0.02142342, -0.10754503, -0.18944886, -0.351985,
//     -0.45136046]


var sizeScale = d3.scaleLinear().domain([-1,1]).range([0,1]);

//Prepare one of the sample sentences by removing punctuation,
// creating an array of words and computing a random size attribute.
function getWords(words, contributions) {
    return words
            // .replace(/[!\.,:;\?]/g, '')
            // .split(' ')
            .map(function(d,i) {
                
                return {text: d, size: 10 + sizeScale(contributions[i]) * 15};
            })
}

//This method tells the word cloud to redraw with a new set of words.
//In reality the new words would probably come from a server request,
// user input or some other source.
function showNewWords(vis,words,contributions) {
    vis.update(getWords(words,contributions))
}

// function onHover(){
//     //Create a new instance of the word cloud visualisation.
//         var myWordCloud = wordCloud('#chart');


//         var request = new XMLHttpRequest()
//         var data;
//         request.open('GET', 'http://127.0.0.1:5000/getWordCLoud', true)
//         request.onload = function() {
//         // Begin accessing JSON data here
//         data = JSON.parse(this.response)
//         console.log(data);
//         myWordCloud.update(getWords(data[0],data[1]));
//         //Start cycling through the demo data
//         showNewWords(myWordCloud,data[0],data[1]);
        
//         }

//         request.send();

// }

// function onMouseOut(){
//     d3.select('.wordCloud').remove();
// }

