
//leaflet "x" goes vert, "y" goes horiz

//leaflet constants
var MAP_WIDTH = 4096;
var MAP_HEIGHT = 3206;
var BIN_WIDTH = 35;
var BIN_HEIGHT = 55;

//tippers constants
var MAX_TIPPERS_X = 76;
var MAX_TIPPERS_Y = 65;


function tippersToLeaflet([x, y]){
	var leafletHoriz = (x * MAP_WIDTH / MAX_TIPPERS_X);
	var leafletVert = (y * MAP_HEIGHT / MAX_TIPPERS_Y);
	return [leafletVert, leafletHoriz];
}

function createTiledMap(img){
	var mapmargin = 50;
	$('#map').css("height", ($(window).height() - mapmargin));
	
	var map = L.map('map', {crs: L.CRS.Simple}).setView([0, 0], 1);
	map.setMaxBounds(new L.LatLngBounds([[0, MAP_WIDTH], [MAP_HEIGHT, 0]]));
	
	L.tileLayer('static/' + img + '/{z}/{x}/{y}.png', {
				minZoom: 1,
				maxZoom: 4,
				continuousWorld: false,
				noWrap: true}).addTo(map);
								
	return map;
}

function createMap(img){
	
	var mapmargin = 50;
	$('#map').css("height", "500px");
	// $('#map').css("height", ($(window).height() - mapmargin));
	
	var map = L.map('map', {
		crs: L.CRS.Simple,
		maxZoom: 0,
		minZoom: -3
	}).setView([MAP_HEIGHT / 2, MAP_WIDTH / 2], -3);

	var yx = L.latLng;

	var xy = function(x, y) {
		if (L.Util.isArray(x)) {    // When doing xy([x, y]);
			return yx(x[1], x[0]);
		}
		return yx(y, x);  // When doing xy(x, y);
	};

	var bounds = [xy(0, 0), xy(MAP_WIDTH, MAP_HEIGHT)];
	var image = L.imageOverlay('static/' + img + '.png', bounds).addTo(map);
	
	return map;
}

function markBin(m, binID, binType, coords, marker=false){	
	url = "static/"
	if(binType == "L"){
		url += "landfill_bin.PNG"
	}
	else if(binType == "R"){
		url += "recycling_bin.PNG"
	}
	else if(binType == "C"){
		url += "compost_bin.PNG"
	}
	else{
		console.log("invalid bin type: " + binType + " , try L, R, or C")
		return;
	}
	
	var binIcon = L.icon({
    iconUrl: url,
    iconSize: [BIN_WIDTH, BIN_HEIGHT],
    iconAnchor: [BIN_WIDTH / 2, BIN_HEIGHT / 2],
    popupAnchor: [0, -50],
	});
	
	var bin = L.marker(tippersToLeaflet(coords), {icon: binIcon}).addTo(m);
		console.log("<form action='TestBin?binID="+binID+"&binType="+binType+"'><input type='submit' value = 'View Bin' name = 'View Test Bin' id = 'viewtestbinbutton' class='btn btn-primary'/></form>");
		bin.bindPopup("<a href='TestBin?binID="+binID+"&binType="+binType+"'>View Bin</a>").openPopup();
	if(marker){
		var circle = L.circleMarker(tippersToLeaflet(coords), {
			color: 'blue',
			fillColor: 'blue',
			fillOpacity: 0.5,
			radius: 40
		}).addTo(m);
	}
}

function circleLocation(m, coords){
	var circle = L.circleMarker(tippersToLeaflet(coords), {
		color: 'red',
		fillColor: 'red',
		fillOpacity: 0.5,
		radius: 20
	}).addTo(m);
}

function testLocation(m, coords){
	var circle = L.circleMarker(coords, {
		color: 'red',
		fillColor: 'blue',
		fillOpacity: 0.5,
		radius: 10
	}).addTo(m);
}
				
