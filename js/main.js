(function(){

    //pseudo-global variables
    var attrArray = ["Heart Disease", "Cancer", "Respiratory Disease", "Diabetes", "Stroke", "Alzheimer's Disease"] //list of attributes
    var expressed = attrArray[0]; //initial attribute

    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 500,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([490, 0])
    .domain([0, 300]);
    
    //begin script when window loads
    window.onload = setMap();
    deathsChart();
    //set up choropleth map
    function setMap(){
        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 500;
    
        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height)
            
    
        var projection = d3.geoAlbersUsa()
    
        var path = d3.geoPath()
            .projection(projection);
    
        //use Promise.all to parallelize asynchronous data loading
        var promises = [d3.csv("data/DeathCauses.csv"),                    
            d3.json("data/unitedStates.topojson")                
            ];    
    Promise.all(promises).then(callback);
    
    
    function callback(data) {
        var csvData = data[0],
            us = data[1]
            
        
        //translate europe and France TopoJSONs
        var unitedStates = topojson.feature(us, us.objects.unitedStates).features
        
        //join csv data to GeoJSON enumeration units
        unitedStates = joinData(unitedStates, csvData);
    
        //create color scale
        var colorScale = makeColorScale(csvData);
    
        setEnumerationUnits(unitedStates, map, path, colorScale);
    
        //add coordinated visualization to the map
        setChart(csvData, colorScale);

        createDropdown(csvData);

        changeAttribute(props);
        
    };
    }; //end of setMap()
    
    
    function joinData(unitedStates, csvData){
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
    var csvState = csvData[i]; //the current region
    var csvKey = csvState.STUSPS; //the CSV primary key
    
    //loop through geojson regions to find correct region
    for (var a=0; a<unitedStates.length; a++){
    
        var geojsonProps = unitedStates[a].properties; //the current region geojson properties
        var geojsonKey = geojsonProps.STUSPS; //the geojson primary key
    
        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey == csvKey){
    
            //assign all attributes and values
            attrArray.forEach(function(attr){
                var val = parseFloat(csvState[attr]); //get csv attribute value
                geojsonProps[attr] = val; //assign attribute and value to geojson properties
            });
        };
    };
    };
    return unitedStates;
    };
    
    function setEnumerationUnits(unitedStates, map, path, colorScale){
        //add states to map
        var states = map.selectAll(".states")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.STUSPS;
            })
            .attr("d", path)
            .style("fill", function(d){
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(d.properties[expressed]);            
                } else {                
                    return "#ccc";            
                }    
            })
            .on("mouseover", function(event,d){
                highlight(d.properties);
            })
            .on("mouseout", function(event, d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
        var desc = states.append("desc")
            .text('{"stroke": "#9b9b9b", "stroke-width": "0.5px"}');
    }


    
    //set color scales for each variable
    var colorAttr = [];
    var heartDisease = ["#FEE5D9", "#FCAE91", "#FB6A4A", "#DE2D26", "#A50F15"]
    var cancer = ["#F1EEF6", "#D7B5D8", "#DF65B0", "#DD1C77", "#980043"]
    var respDisease = ["#FEEDDE", "#FDBE85", "#FD8D3C", "#E6550D", "#A63603"]
    var diabetes =["#F1EEF6", "#BDC9E1", "#74A9CF", "#2B8CBE", "#045A8D"]
    var stroke = ["#EDF8E9", "#BAE4B3", "#74C476", "#31A354", "#006D2C"  ]
    var alzhheimer = ["#F2F0F7", "#CBC9E2", "#9E9AC8", "#756BB1", "#54278F"]

    colorAttr.push( heartDisease, cancer, respDisease, diabetes, stroke, alzhheimer)

    //function to create color scale generator
    function makeColorScale(data, attribute){
    
    //create if statements to pull color scales
    var colorClasses;
    if (expressed == "Heart Disease"){colorClasses = colorAttr[0];}
    if (expressed == "Cancer"){colorClasses = colorAttr[1];}
    if (expressed == "Respiratory Disease"){colorClasses = colorAttr[2];}
    if (expressed == "Diabetes"){colorClasses = colorAttr[3];}
    if (expressed == "Stroke"){colorClasses = colorAttr[4];}
    if (expressed == "Alzheimer's Disease"){colorClasses = colorAttr[5];} 
    
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);
    
        return colorScale;
    };
    

//function to create coordinated bar chart
function setChart(csvData, colorScale){
         
//create a second svg element to hold the bar chart
var chart = d3.select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");

//create a rectangle for chart background fill
var chartBackground = chart.append("rect")
    .attr("class", "chartBackground")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([490, 0])
    .domain([0, 300]);

//set bars for each province
var bars = chart.selectAll(".bar")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b){
        return b[expressed]-a[expressed]
    })
    .attr("class", function(d){
        return "bar " + d.STUSPS;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    .on("mouseover", function(event,d){
        highlight(d);
    })
    .on("mouseout", function(event, d){
        dehighlight(d);
    })
    .on("mousemove", moveLabel);
//style descriptor
var desc = bars.append("desc")
    .text('{"stroke": "none", "stroke-width": "0px"}');

//create a text element for the chart title
var chartTitle = chart.append("text")
    .attr("x", 120)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text(expressed + " Mortality Rate by State")
    .style('fill', 'white')
    

var chartSubtitle = chart.append("text")
    .attr("x", 140)
    .attr("y", 55)
    .attr("class", "chartSubtitle")
    .text("Number of deaths per 100,000 total population")
    .style('fill', 'white')

//create vertical axis generator
var yAxis = d3.axisLeft()
    .scale(yScale);


//place axis
var axis = chart.append("g")
    .attr("class", "axis")
    .attr("transform", translate)
    .call(yAxis);
   

//create frame for chart border
var chartFrame = chart.append("rect")
    .attr("class", "chartFrame")
    .attr("width", chartInnerWidth)
    .attr("height", chartInnerHeight)
    .attr("transform", translate);

updateChart(bars, csvData.length, colorScale);

}; //end of setChart

//create total deaths chart
function deathsChart(){
//create horizontal bar chart
var container = d3.select("#panel")
                  .append("svg")
                  .attr("width", 750)
                  .attr("height", 300)
                  .attr("class", "container");
                  

var data = [
    {cause: "Heart Disease", deaths: 695547},
    {cause: "Cancer", deaths: 605213},
    {cause: "Stroke", deaths: 162890},
    {cause: "Respiratory Disease", deaths: 142342},
    {cause: "Alzheimer's Disease", deaths: 119399},
    {cause: "Diabetes", deaths: 103294}
];

//sort bars based on value
data = data.sort(function(a, b){
    return d3.ascending(a.deaths, b.deaths);
});


var x = d3.scaleLinear()
          .range([0, 500])
          .domain([0, d3.max(data, function(d){
            return d.deaths;
          })]);
var y = d3.scaleBand()
          .range([250, 0], .1)
          .domain(data.map(function (d) {
            return d.cause;
          }));

//make y axis to show bar names
var yAxis = d3.axisLeft()
              .scale(y)
              

var gy = container.append("g")
                  .attr("class", "yaxis")
                  .call(yAxis)

var bars1 = container.selectAll(".bar")
                    .data(data)
                    .enter()
                    .append("g")

//append rects
bars1.append("rect")
    .attr("class", "bar1")
    .attr("y", function(d){
        return y(d.cause);
    })
    .attr("height", 250/data.length -10)
    .style("fill", function(d){
        if(d.cause == "Heart Disease"){
            return "#A50F15";
        }
        if(d.cause == "Cancer"){
            return "#980043";
        }
        if(d.cause == "Respiratory Disease"){
            return "#A63603";
        }
        if(d.cause == "Diabetes"){
            return "#045A8D";
        }
        if(d.cause == "Stroke"){
            return "#006D2C"
        }
        if(d.cause == "Alzheimer's Disease"){
            return "#54278F"
        }
    })
    .attr("x", 0)
    .attr("width", function(d){
        return x(d.deaths);
    });

bars1.append("text")
    .attr("class", "label")
    .attr("y", function (d){
        return y(d.cause) + y.bandwidth()/2 +4;
    })
    .attr("x", function(d, i){
        return x(d.deaths) + 3;
    })
    .text(function (d){
        return d.cause + " - " + d.deaths + " deaths";
    })
};

//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};


//dropdown change event handler
function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    
    //recolor enumeration units
    var states = d3.selectAll(".states")
        .transition()
        .duration(1000)
        .style("fill", function (d) {
        var value = d.properties[expressed];
            if (value) {
                return colorScale(d.properties[expressed]);
            } 
            else {
                return "#ccc";
            }
    });
    
    //Sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
    //Sort bars
        .sort(function(a, b){
         return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d,i){
            return i*20
        })
        .duration(500);
    updateChart(bars, csvData.length, colorScale);  
    
};


//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 490 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){            
            var value = d[expressed];            
            if(value) {                
                return colorScale(value);            
            } else {                
                return "#ccc";            
            }    
    });

    var chartTitle = d3.select(".chartTitle")
        .text(expressed + " Mortality Rate by State");
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", "black")
        .style("stroke-width", "2")
    
    setLabel(props);
};

//reset style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };    
    d3.select(".infolabel")
        .remove();
};

//funciton to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + "Mortality Rate" + "</b>";

    //create info label div
    var infolabel =d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.STUSPS + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.STUSPS);
};

//function to move label with mouse
function moveLabel(){
    //get get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};


    })();
    