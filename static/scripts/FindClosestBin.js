
map_images = ["Floor1", "Floor2", "Floor3", "Floor4", "Floor5", "Floor6"]

var floor = 1;
var type = "R"
var found_bin = "";

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
	loadNewMap();
});