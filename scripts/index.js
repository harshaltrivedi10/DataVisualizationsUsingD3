// This is what you could consider the "central control" file 

// global variables for our visualizations
var scatterPlot = undefined;

url1= "./data/wine.csv";
url2= "./data/nutrients.csv";
url3= "./data/tennis_women.csv";
url4= "./data/crime.csv";
url5= "./data/mnist.csv";
url6= "./data/fashion_mnist.csv";


dataset1 = "wine";
dataset2 = "nutrients";
dataset3 = "tennis_women";
dataset4 = "crime";
dataset5 = "mnist";
dataset6 = "fashion";
// only called once, to instantiate your charts
function initCharts(url, dataset) {
    //remove all charts if any
    //add code to remove charts here
    d3.select(".scatter").selectAll('*').remove();
    d3.select("#chart").selectAll("*").remove();
    d3.select("#grid").selectAll("*").remove();
    d3.select("#legend").selectAll("*").remove();
    // instantiate the all plots, and send it the container it should exist in (.scatter)
    scatterPlot = new ScatterPlot(d3.select('.scatter'),url, dataset);
    createHeatmap(dataset);
}

//This function will remove all csv's except original ones
window.onload = function(){
    
    var request = new XMLHttpRequest()
    request.open('GET', 'http://127.0.0.1:5000/', true)
    request.onload = function() {
        // Begin accessing JSON data here
        var data = JSON.parse(this.response);
        console.log("Initial Request Successfull");
    }

    request.send()

    initCharts(url1,dataset1);
}
