function createHeatmap(dataset_name) {
    console.log(dataset_name)

    var url1 = "./data/" + dataset_name.toString() + "_labels.csv";
    var url2 = "./data/" + dataset_name.toString() + "_features.csv"
    var url3 = "./data/" + dataset_name.toString() + "_heatmap.csv"

    d3.queue()
    .defer(d3.csv, url1)
    .defer(d3.csv, url2)
    .defer(d3.csv, url3)
    .await(drawHeatmap);

    function drawHeatmap(error, data1, data2, data) {
        var margin = { top: 25, right: 25, bottom: 25, left: 25 };
        var width = window.innerWidth / 4;
        var height = window.innerHeight;
        var offset = 9 * width / 12;
        console.log(height);
        
        d3.select("#heatmap").selectAll("*").remove();

        var svg = d3
        .select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(0, 0)");

        var rect = svg.append("g");

        var labels = []; 
        data1.forEach(function(d) {
            labels.push(d.label);
        })
        var svgwidth = labels.length * 30;

        var features = [];
        data2.forEach(function(d) {
                features.push(d.feature);
        })
        var svgheight = features.length * 30;

        var rectSize = 30;

        var xColor = d3
            .scaleOrdinal()
            .domain(["-1", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
            .range(d3.schemeTableau10);

        var x = d3
            .scaleBand()
            .range([0, svgwidth])
            .domain(labels);

        var xAxis = svg
            .append("g")
            .attr("transform", "translate(0," + svgheight + ")")
            .attr("text-anchor", "middle")
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select(".domain").remove());

        xAxis
            .selectAll(".tick")
            .insert("rect", "text")
            .attr("x", -8.5)
            .attr("y", 5)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("width", 17)
            .attr("height", 17)
            .attr("fill", function(d) {
            return xColor(getNumericLabel(d));
            });

        xAxis
            .selectAll(".tick")
            .selectAll("text")
            .attr("fill", "white")
            .attr("y", 3)
            .attr("dy", "1.35em");

        xAxis
            .selectAll(".tick")        
            .on("click", MouseOverOnXAxis);
            // .on("mouseover", MouseOverOnXAxis)
            // .on("mouseout", MouseOutOnXAxis);

        var HoverOnLabel = 0;
        var values;
        function MouseOverOnXAxis(d, p) {
            var label = getNumericLabel(d);
            // console.log(label);
            var requestUrl = 'http://127.0.0.1:5000/getFeatMat?variable='+label+"&datasetName="+dataset_name;
            var request = new XMLHttpRequest()
            request.open('GET', requestUrl, true)
            request.onload = function() {
            // console.log("request open and sent");
            // console.log("./dataset"+label.toString()+".csv");
            // console.log("./data/dataset"+label.toString()+".csv");
            var url1 = "./data/dataset"+label.toString()+".csv";
            $.ajax({
                url:'./data/dataset'+label.toString()+'.csv',
                type:'HEAD',
                error: function()
                {
                    console.log("error");
                },
                success: function()
                {
                    d3.csv(url1, function (data) {
                        draw(data);
                    });     
                }
                });
            }
            request.send();

            var myWordCloud = wordCloud('#chart');
            var request = new XMLHttpRequest()
            var wordCloudData;
            request.open('GET', 'http://127.0.0.1:5000/getWordCloud?datasetName='+ dataset_name, true)
            var url1 = "./data/featContrib.csv";
            request.onload = function() {
                $.ajax({
                    url:'./data/featContrib.csv',
                    type:'HEAD',
                    error: function()
                    {
                        // console.log("error");
                    },
                    success: function()
                    {
                        d3.csv(url1, function (data) {
                            wordCloudData = data;
                            var features = [];
                            var contributions = [];
                            wordCloudData.forEach(function(d){
                                
                                features.push(d[0]);
                                contributions.push(+d[1]);
                            })
                            // console.log(features, contributions);
                            myWordCloud.update(getWords(features, contributions));
                            showNewWords(myWordCloud, features, contributions);
                        });     
                    }
                });
            }
            request.send();

            // console.log(getNumericLabel(d));

            HoverOnLabel = 1;
            d3.select(this).style("cursor", "default");
            values = [];
            var v = 0;
            for (var i = 0; i < data.length; i++) {
                if (d == data[i].label) {
                data[i].index = v;
                values[v] = data[i];
                v++;
                }
            }
            values.sort(function(a, b) {
                return Math.abs(b.contribution) - Math.abs(a.contribution);
            });
            values.slice(0, 3).forEach(element => MouseOverOnRect(element));
    }

    function MouseOutOnXAxis(d, p) {
        // remove featureMatrix
        d3.select("#grid").selectAll("*").remove();
        d3.select("#legend").selectAll("*").remove();

        // remove woordcloud
        d3.select('.wordCloud').remove();

        values.slice(0, 3).forEach(element => MouseOutOnRect(element));
        HoverOnLabel = 0;
    }

        var y = d3
        .scaleBand()
        .range([svgheight, 0])
        .domain(features);

        var yAxis = svg
        .append("g")
        .attr("transform", "translate( " + svgwidth + ", 0 )")
        .call(d3.axisRight(y))
        .call(g => g.select(".domain").remove());

        yAxis
        .selectAll(".tick")
        .on("mouseover", MouseOverOnYAxis)
        .on("mouseout", MouseOutOnYAxis);

    function MouseOverOnYAxis(d, i) {
        d3.select(this).style("cursor", "default");
        console.log(d);

        d3.csv("./data/"+dataset_name.toString()+".csv", function(data){
            var total = 0;
            console.log(features);
            data.forEach(function(d) {
                Object.keys(d).forEach(function(key) {
                    d[key] = Number(d[key]);
                    total += Math.abs(Number(d[key]));
                });
            });

            var dataTotalObject = {};

            data.forEach(function (d) {
                Object.keys(d).forEach(function(key) {
                    var keyList = key.split(" ")
                    if(keyList.length == 2){
                        dataTotalObject[key + " total"] = 0;
                    }
                })
            });

            data.forEach(function (d) {
                Object.keys(d).forEach(function(key) {
                    var keyList = key.split(" ");
                    if(keyList.length === 2) {
                        dataTotalObject[key + " total"] = dataTotalObject[key + " total"] + Math.abs(d[key]);
                    }
                })
            });

            var index = Object.keys(features).find(key =>  
                features[key] === d);
            
            d3.select(".scatter").selectAll("circle").attr("r", function(d) {
                console.log(Math.abs(d["dim "+index.toString()])*1000 / Math.abs(dataTotalObject["dim "+index.toString()+" total"]));
                return (Math.abs(d["dim "+index.toString()])*1000 / Math.abs(dataTotalObject["dim "+index.toString()+" total"]));
            });
        });
    }

    function MouseOutOnYAxis(d, i) {
        d3.select(".scatter").selectAll("circle").attr("r", 5);
    }

        var color = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

        rect
        .selectAll()
        .data(data, function(d) {
            return d.group + ":" + d.variable;
        })
        .enter()
        .append("rect")
        .attr("x", function(d) {
            return x(d.label);
        })
        .attr("y", function(d) {
            return y(d.feature);
        })
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("fill", function(d) {
            return color(d.contribution);
        })
        .on("click", MouseClickOnRect)
        .on("mouseover", MouseOverOnRect)
        .on("mouseout", MouseOutOnRect);

        var rectText = svg.append("g");

        var rectSelected = Array(features.length)
        .fill(0)
        .map(() => Array(labels.length).fill(0));
        var labelSelected = Array(labels.length).fill(1);

        function MouseOverOnRect(d) {
        var rs =
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ];
        if (rs == 0) {
            var ls = labelSelected[getNumericLabel(d.label) + 1];

            rectText
            .append("text")
            .attr("id", "text" + "_" + d.label + "_" + ls)
            .attr("text-anchor", "middle")
            .attr("x", x(d.label) + 15)
            .attr("y", y(d.feature) + 15 + 5)
            .attr("width", rectSize)
            .attr("height", rectSize)
            .attr("fill", "white")
            .attr("font-size", 12)
            .attr("font-family", "sans-serif")
            .attr("cursor", "default")
            .text(ls);

            rectText
            .insert("circle", "#text" + "_" + d.label + "_" + ls)
            .attr("id", "circle" + "_" + d.label + "_" + ls)
            .attr("r", 7.5)
            .attr("cx", x(d.label) + 15)
            .attr("cy", y(d.feature) + 15)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("fill", xColor(getNumericLabel(d.label)));
            if (HoverOnLabel == 1) {
            labelSelected[getNumericLabel(d.label) + 1] += 1;
            }
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ] = 1;

        }
    }

    function MouseOutOnRect(d) {
        var rs =
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ];
        if (rs == 1) {
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ] = 0;
            if (HoverOnLabel == 1) {
            labelSelected[getNumericLabel(d.label) + 1] -= 1;
            }
            var ls = labelSelected[getNumericLabel(d.label) + 1];
            svg.selectAll("#text" + "_" + d.label + "_" + ls).remove();
            svg.selectAll("#circle" + "_" + d.label + "_" + ls).remove();
        }
    }

    function MouseClickOnRect(d) {
        var rs =
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ];
        if (rs == 2) {
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ] = 0;
            labelSelected[getNumericLabel(d.label) + 1] -= 1;
            var ls = labelSelected[getNumericLabel(d.label) + 1];
            svg.selectAll("#text" + "_" + d.label + "_" + ls).remove();
            svg.selectAll("#circle" + "_" + d.label + "_" + ls).remove();
            d3.select("#histogram").selectAll("*").remove();
        } else {
            console.log("on click");
            var ls = labelSelected[getNumericLabel(d.label) + 1];
            rectText
            .append("text")
            .attr("id", "text" + "_" + d.label + "_" + ls)
            .attr("text-anchor", "middle")
            .attr("x", x(d.label) + 15)
            .attr("y", y(d.feature) + 15 + 5)
            .attr("width", rectSize)
            .attr("height", rectSize)
            .attr("fill", "white")
            .attr("font-size", 12)
            .attr("font-family", "sans-serif")
            .attr("cursor", "pointer")
            .text(ls);
            rectText
            .insert("circle", "#text" + "_" + d.label + "_" + ls)
            .attr("id", "circle" + "_" + d.label + "_" + ls)
            .attr("r", 7.5)
            .attr("cx", x(d.label) + 15)
            .attr("cy", y(d.feature) + 15)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("fill", xColor(getNumericLabel(d.label)));
            labelSelected[getNumericLabel(d.label) + 1] += 1;
            rectSelected[Math.floor(y(d.feature) / rectSize)][
            Math.floor(x(d.label) / rectSize)
            ] = 2;
            histogram(dataset_name,d.feature,getNumericLabel(d.label))
        }
        }

    function getNumericLabel(label) {
        if (label == "Z") {
        return -1;
        } else {
        return label.charCodeAt(0) - 65;
        }
    }
    }
}