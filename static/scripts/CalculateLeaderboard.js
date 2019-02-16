
var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';


function get_leaderboard_data(sensors, leaderboard, waste_type, leaderboard_type, start_time=null, end_time=null){
	
	function create_accumulated_callback(sensor){
		return function(observations){
			//store payload and a count in a variable
			var payload;
			
			//store previous payload to check if bin was emptied out
			var prev_payload = 0;
			
			//store the accumulated amount to the data in a var
			var acc_payload;
							
			// reset payload, prev_payload and accumulated payload
			payload = 0;	
			prev_payload = 0;
			acc_payload = 0;
			for(observation in observations){
				payload = observations[observation]["payload"]["weight"];
				//check previous payload to see how much was added
				//if percent different is greater than 25%
				//or the current or previous payload is 0, the bin was emptied
				//set acc_payload to the payload
				if((Math.abs(payload - prev_payload) / ((payload + prev_payload) / 2) > .25)
					|| payload == 0 || prev_payload == 0){
					acc_payload += payload;
				}
				//if the new payload is greater than the previous payload, the acc_payload is the difference between the two
				else if(payload > prev_payload){
					acc_payload += payload - prev_payload
				}
				//if acc_payload is less than payload, but the percent difference is less than 50%, leave acc_payload as 0
				//set previous payload equal to the current payload
				prev_payload = payload;
			}
			leaderboard[sensor[leaderboard_type]] += acc_payload;
		}
	}
	
	var deferreds = [];
	for(i in sensors){
		sensor = sensors[i];
		if(sensor["name"][0] == waste_type){
			if(!leaderboard.hasOwnProperty(sensor[leaderboard_type])){
				leaderboard[sensor[leaderboard_type]] = 0;
			}
			deferreds.push( $.getJSON(BASE_OBS_URL + "sensor_id=" + sensor["id"] +
									"&start_timestamp=" + encodeURIComponent(start_time) +
									"&end_timestamp=" + encodeURIComponent(end_time),
									create_accumulated_callback(sensor)));
		}
	}
	return deferreds;
}





function get_divergence_leaderboard(start_time=null, end_time=null){
	
	function create_callback(floor){
		
		return function(data){
			var divergence = [];
					
			var landfill = data["landfill_obs"];
			var recycling = data["recycling_obs"];
			var compost = data["compost_obs"];
			
			for(var i = 0; i < data["labels"].length; ++i){
				if(recycling[i] + compost[i] + landfill[i] == 0){
					divergence.push(100);
				}
				else{
					divergence.push((recycling[i] + compost[i]) / 
										(recycling[i] + compost[i] + landfill[i]) * 100);
				}
			}
			leaderboard.push([floor, divergence[divergence.length-1]]);
		}
	}
	
	if(start_time === null || end_time === null){
		start_time = moment().subtract(60, 'days').format(TIPPERS_MOMENT_FORMAT);
		end_time = moment().format(TIPPERS_MOMENT_FORMAT);
	}
	
	var deferreds = [];
	var leaderboard = [];
	for(var floor = 1; floor <= 6; ++floor){
		deferreds.push(get_chart_data(false, 6, start_time, end_time, 1, 0, [floor]).then(create_callback(floor)))
	}
	return $.when.apply($, deferreds).then(function(data){
		console.log(leaderboard)
		return leaderboard;
	});
}


//waste type "D" is divergence
function get_leaderboard(waste_type, leaderboard_type, start_time=null, end_time=null){
	var leaderboard = {};
	//set time frame to the most recent day if time is not given
	if(start_time === null || end_time === null){
		start_time = moment().subtract(60, 'days').format(TIPPERS_MOMENT_FORMAT);
		end_time = moment().format(TIPPERS_MOMENT_FORMAT);
	}
	// get bin data
	// loop starting from sensors to minimize tippers requests
	// this way we retrieve observations for each sensor only once
	return $.getJSON( BASE_SENSOR_URL + "sensor_type_id=6").then(function( data ) {	
		sensors = data;
		var deferreds = get_leaderboard_data(sensors, leaderboard, waste_type, leaderboard_type, start_time, end_time);
		return $.when.apply($, deferreds).then(function(data){
			return leaderboard;
		});
		
	});
}