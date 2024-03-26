//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){

    //map frame dimensions
    var width = 960,
        height = 600;

    //create new svg container for map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on US
    var projection = d3.geoAlbers()
        .center([0, 38.15])
        .rotate([102.82, 0, 0])
        .parallels([29.5, 45.5])
        .scale(300)
        .translate([width / 2, height / 2]);

    var projection = d3.geoAlbersUsa()
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/DeathCauses.csv"));//load attributes from csv                    
    promises.push(d3.json("data/United_States.topojson"));//load spatial data                         
    Promise.all(promises).then(callback);

    function callback(data){
        var csvData = data[0],
            us = data[1];
        console.log(csvData);
        console.log(us);

        //translate topoJSON
        var usStates = topojson.feature(us, us.objects.United_States).features;
        
        //add states to map
        var states = map.selectAll(".states")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states "  + d.properties.STUSPS;
            })
            .attr("d", path);
        
    }
};
