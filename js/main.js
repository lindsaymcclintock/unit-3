(function(){
    
    //pseudo-global variables
    var attrArray = ["Heart Disease", "Cancer", "Respiratory Disease", "Diabetes", "Stroke", "Alzheimer's Disease"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    
    //begin script when window loads
    window.onload = setMap();
    
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
            .attr("height", height);
    
        var projection = d3.geoAlbersUsa()
    
        var path = d3.geoPath()
            .projection(projection);
    
    
        //use Promise.all to parallelize asynchronous data loading
        var promises = [d3.csv("data/DeathCauses.csv"),                    
            d3.json("data/unitedStates.topojson"),                 
            ];    
    Promise.all(promises).then(callback);
    
    
    function callback(data) {
        var csvData = data[0],
            us = data[1]
            
        console.log(csvData);
        console.log(us);
        
        //translate europe and France TopoJSONs
        var unitedStates = topojson.feature(us, us.objects.unitedStates).features
        
        //join csv data to GeoJSON enumeration units
        unitedStates = joinData(unitedStates, csvData);
    
        //create color scale
        var colorScale = makeColorScale(csvData);
    
        setEnumerationUnits(unitedStates, map, path, colorScale);
    
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
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
            });
    
    }
    
    //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#ffbaba",
            "#ff7b7b",
            "#ff5252",
            "#db1414",
            "#a70000"
        ];
    
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
            //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
    chartHeight = 500,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

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
    .attr("x", function(d, i){
        return i * (chartInnerWidth / csvData.length) + leftPadding;
    })
    .attr("height", function(d, i){
        return 490 - yScale(parseFloat(d[expressed]));
    })
    .attr("y", function(d, i){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    .style("fill", function(d){
        return colorScale(d[expressed]);
    });

//create a text element for the chart title
var chartTitle = chart.append("text")
    .attr("x", 120)
    .attr("y", 40)
    .attr("class", "chartTitle")
    .text(expressed + " Mortality Rate by State");

var chartSubtitle = chart.append("text")
    .attr("x", 140)
    .attr("y", 55)
    .attr("class", "chartSubtitle")
    .text("Number of deaths per 100,000 total population")

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
};
    
    })();
    