

// leaflet maps
var m;
$(document).ready(function(){
	console.log(closest_bins)
	if(closest_bins.length == 0){
		$("div.container-fluid").append("<h1>Sorry, there are no bins available on your floor right now</h1>");
	}
	else {
		$("div.container-fluid").prepend("<h1>Your current location is the <span style='color:red'>red</span> marker." + 
										"<br/> Your destination is the bin highlighted in <span style='color:blue'>blue</span>.</h1>");
		m = createMap("Floor2");
		console.log(user_location[0], user_location[1])
		circleLocation(m, [user_location[0], user_location[1]])
		markBin(m, closest_bins["id"], bin_type, [closest_bins[0]["x"], closest_bins[0]["y"]]);
	}
});







/*var scaleF = 10;

$(document).ready(function(){
	var myCanvas = document.getElementById("myCanvas");	
	// myCanvas.getContext('2d').transform(1, 0, 0, -1, 0, myCanvas.height);
	var ctx = document.getElementById("myCanvas").getContext("2d");
	var url = "static/";
	if(bin_type == "L"){
		url += "landfill_bin.PNG"
	}
	else if(bin_type == "R"){
		url += "recycling_bin.PNG"
	}
	else if(bin_type == "C"){
		url += "compost_bin.PNG"
	}
	bin_img = new Image();
	bin_img.src = url;
	bin_img.onload = function(){
		//draw bin
		var x = closest_bins[0]["x"] * scaleF;
		var y = closest_bins[0]["y"] * scaleF;
		var radius = 50;
		ctx.drawImage(bin_img, x - radius / 2, y - radius / 2, 50, 50);
		//draw circle
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
		ctx.fill();
		ctx.lineWidth = 5;
		ctx.strokeStyle = 'rgba(255, 0, 0)';
		ctx.stroke();
	}
});*/