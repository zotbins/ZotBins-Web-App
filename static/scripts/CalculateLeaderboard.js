
/*
author: Joshua Cao

helper functions for Leaderboard.js
was originally intended to have functions that calculate the leaderboard rankings
turns out most of the rankings can be done through TipperFormattedData.js so there isn't much here
we can consider moving everything here to Leaderboard.js and removing this file
*/

var BASE_SENSOR_URL = "http://sensoria.ics.uci.edu:8059/sensor/get?";
var BASE_OBS_URL = "http://sensoria.ics.uci.edu:8059/observation/get?";

var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';

//I HAVE NOW REPURPOSED THIS FILE FOR DIVERGENCE LEADERBOARD HELPERS
function get_divergence_leaderboard({start_timestamp = moment().subtract(1, 'days'),
					end_timestamp = moment()} = {}){
						
	var leaderboard = [];
	var labels_list = [];
	var label = start_timestamp;
	var end_d = end_timestamp;
	
	start_timestamp = label.format(TIPPERS_MOMENT_FORMAT);
	
	while(label < end_d){
		labels_list.push(moment(label));
		label.add(24, 'hours');
	}
	
	function get_data_from_list(id_list){
		var total = 0;
		
		for (index in id_list) {
			$.ajax({
				url: BASE_OBS_URL + "sensor_id=" + id_list[index] +
					"&start_timestamp=" + encodeURIComponent(moment(start_timestamp).format(TIPPERS_MOMENT_FORMAT)) +
					"&end_timestamp=" + encodeURIComponent(moment(end_timestamp).format(TIPPERS_MOMENT_FORMAT)),
				async: false,
				dataType: "json",
				type: "get",
				success: function(observations){
					for (date in labels_list) {
						payload = 0;
						
						for (o in observations) {
							var obs = observations[o];
							
							if (moment(obs["timestamp"], TIPPERS_MOMENT_FORMAT) > labels_list[date]) {
								break;
							}
							
							payload = obs["payload"]["weight"];
						}
						
						total += payload;
					}
				}
			});
		}
		
		return total;
	}
	
	floor_dict = {};
	// {floor_name : {waste_type : [id]} }
	
	
	$.ajax({
		url: BASE_SENSOR_URL + "sensor_type_id=6",
		async: false,
		dataType: "json",
		type: "get",
		success: function(sensors){
			for (index in sensors) {
				var floor_name = "Floor " + sensors[index]["z"];
				var waste_type = sensors[index]["name"].charAt(0);
				
				if (floor_dict[floor_name] === undefined) {
					floor_dict[floor_name] = {};
					floor_dict[floor_name][waste_type] = [];
				}
				else if (floor_dict[floor_name][waste_type] === undefined) {
					floor_dict[floor_name][waste_type] = [];
				}
				
				floor_dict[floor_name][waste_type].push(sensors[index]["id"]);
			}
		}
	});
	
	for (floor_name in floor_dict) {
		var diverted = 0;
		var total = 0;
		
		diverted += get_data_from_list(floor_dict[floor_name]["C"]);
		diverted += get_data_from_list(floor_dict[floor_name]["R"]);
		total += diverted;
		total += get_data_from_list(floor_dict[floor_name]["L"]);

		if (total == 0) {
			leaderboard.push([floor_name, -1]);
		}
		else {
			leaderboard.push([floor_name, (diverted/total) * 100]);
		}
	}

	return leaderboard;
}














