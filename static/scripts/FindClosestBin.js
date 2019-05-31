
map_images = ["Floor1", "Floor2", "Floor3", "Floor4", "Floor5", "Floor6"]

var floor = 1;
var type = "R"
var found_bin = "";

var bins;

function load_bins(){
	get_sensors(6).done(function(data){
		bins = data;
		loadNewMap();
	});
}

function loadNewMap(){
	map.remove();
	$(".map-container").append("<div id = 'map' style = 'background : #888888;'></div>");
	m = createMap(map_images[floor-1]);
	for(i in bins){
		bin = bins[i]
		if(bin["z"] == floor)
			if(bin["id"] == found_bin){
				markBin(m, [bin]["id"], bin["name"][0], [bin["x"], bin["y"]], true);
			}
			else{
				markBin(m, [bin]["id"], bin["name"][0], [bin["x"], bin["y"]]);
			}
	}
}

$(document).ready(function(){
	$(function() {
		$('.chosen-select').chosen({
			width: "20%",
		}).change(function(){
			floor = $(this).val()	;
			loadNewMap();
		});
	});
	// $('.chosen-select').chosen().change(function(){
		// console.log($(this).val());
	// });
	$("#submit").click(function(){
		type = $("#select_bin_type > label > input:checked").attr("value");
		$.getJSON( $SCRIPT_ROOT + "/get_closest_bins?type=" + type, function(data){
			closest_bin = data["closest_bins"][0]
			if(data.length == 0){
				//do something when no bins are found
			}
			else{
				floor = closest_bin["z"];
				found_bin = closest_bin["id"];
				loadNewMap();
			}
		});
	});
	//watson image recognition
	$("#watson_submit").click(function(){
		$.ajax({
			url: $SCRIPT_ROOT + "/get_waste_class",
			type: "GET",
			data: {"img_url" : $("#img_url").val()},
			contentType:"application/json; charset=utf-8",
			dataType:"json",
			success: function(data){
				result = data["images"][0]["classifiers"][0]["classes"][0]
				$("#watson_output").text("Waste type: " + result["class"] + ", Score: " + result["score"])
			}
		});
	});
	load_bins();
});