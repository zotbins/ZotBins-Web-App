/*
author: Joshua Cao

This file provides functions to asynchronously get TIPPERS data in a convenient format.
The important functions are located at the bottom.
*/




var WEIGHT_SENSOR_TYPE = 6
var DIST_SENSOR_TYPE = 7

var BASE_SENSOR_URL = "http://sensoria.ics.uci.edu:8059/sensor/get?";
var BASE_OBS_URL = "http://sensoria.ics.uci.edu:8059/observation/get?";

var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';


//PRIVATE


function get_real_time_data(labels_list, sensors, payload_type, landfill_obs, recycling_obs, compost_obs){
	
	function create_real_time_callback(sensor){
		return function(observations){
			//store payload and a count in a variable
			var payload = 0;
			var i = 0;
							
			//set it to be labels_list plus the date one interval before
			for(date in labels_list){
				// reset payload
				payload = 0;
				for(observation in observations){
					// if observation timestmap is greater than the date in the labels list, break out of loop
					if(moment(observations[observation]["timestamp"], TIPPERS_MOMENT_FORMAT) > labels_list[date]){
						break
					}
					// set payload depending on sensor type
					if(type == WEIGHT_SENSOR_TYPE){
						payload = observations[observation]["payload"][payload_type];
					}
					else if(type == DIST_SENSOR_TYPE){
						payload = observations[observation]["payload"][payload_type];
						//this is no good cause i pushed percentages into tippers
						// payload = (BIN_HEIGHT - payload) / BIN_HEIGHT * 100;
						if(payload > 1){
							payload = 0;
						}
					}
				}
				//add payload to the data lists
				if(sensor["name"][0] == "L"){
					landfill_obs[i] = landfill_obs[i] + payload;
				}
				else if(sensor["name"][0] == "R"){
					recycling_obs[i] = recycling_obs[i] + payload;
				}
				else if(sensor["name"][0] == "C"){
					compost_obs[i] = compost_obs[i] + payload;
				}
				++i;
			}
		}
	}
	
	var start_timestamp = labels_list[0].subtract(1, 'days').format(TIPPERS_MOMENT_FORMAT);
	var end_timestamp = labels_list[labels_list.length - 1].format(TIPPERS_MOMENT_FORMAT);
	var deferreds = [];
	for(sensor in sensors){
		// console.log(sensors[sensor]["name"])
		//get observations for each sensor within the specified floors
		if(floors.indexOf(Number(sensors[sensor]["z"])) != -1 &&
		sensors[sensor]["id"] != "zot-bin-weight-1" || sensors[sensor]["id"] != "zot-bin-weight-2"){
			deferreds.push( $.getJSON(BASE_OBS_URL + "sensor_id=" + sensors[sensor]["id"] +
									"&start_timestamp=" + encodeURIComponent(start_timestamp) +
									"&end_timestamp=" + encodeURIComponent(end_timestamp),
									create_real_time_callback(sensors[sensor])));
		}
	}
	
	return deferreds;
}



function get_accumulated_data(labels_list, sensors, payload_type, landfill_obs, recycling_obs, compost_obs, floors){
	
	function create_accumulated_callback(sensor){
		return function(observations){
			//store payload and a count in a variable
			var payload;
			var i = 0;
			
			//store previous payload to check if bin was emptied out
			var prev_payload = 0;
			
			//store the accumulated amount to the data in a var
			var acc_payload;
			
			// set previous date to the first date minus the interval
			// prev_date = moment(labels_list[0]).subtract(interval_days, 'days').subtract(interval_hours, 'hours')
																				// .subtract(interval_minutes, 'minutes'); 
							
			//set it to be labels_list plus the date one interval before
			for(date in labels_list){
				// reset payload, prev_payload and accumulated payload
				payload = 0;	
				prev_payload = 0;
				acc_payload = 0;
				for(observation in observations){
					// if observation timestmap is greater than the date in the labels list, break out of loop
					if(moment(observations[observation]["timestamp"], TIPPERS_MOMENT_FORMAT) > labels_list[date]){
						break
					}
					// set payload depending on sensor type
					if(type == WEIGHT_SENSOR_TYPE){
						payload = observations[observation]["payload"][payload_type];
					}
					else if(type == DIST_SENSOR_TYPE){
						payload = (BIN_HEIGHT - payload) / BIN_HEIGHT * 100;
					}
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
				//add payload to the data lists
				if(sensor["name"][0] == "L"){
					landfill_obs[i] = landfill_obs[i] + acc_payload;
				}
				else if(sensor["name"][0] == "R"){
					recycling_obs[i] = recycling_obs[i] + acc_payload;
				}
				else if(sensor["name"][0] == "C"){
					compost_obs[i] = compost_obs[i] + acc_payload;
				}
				// prev_date = moment(labels_list[date]);
				++i;
			}
		}
	}
	
	var start_timestamp = labels_list[0].format(TIPPERS_MOMENT_FORMAT);
	var end_timestamp = labels_list[labels_list.length - 1].format(TIPPERS_MOMENT_FORMAT);
	var deferreds = [];
	for(sensor in sensors){
		//get observations for each sensor within the specified floors
		if(floors.indexOf(Number(sensors[sensor]["z"])) != -1){
			deferreds.push( $.getJSON(BASE_OBS_URL + "sensor_id=" + sensors[sensor]["id"] +
									"&start_timestamp=" + encodeURIComponent(moment(start_timestamp).format(TIPPERS_MOMENT_FORMAT)) +
									"&end_timestamp=" + encodeURIComponent(moment(end_timestamp).format(TIPPERS_MOMENT_FORMAT)),
									create_accumulated_callback(sensors[sensor])));
		}
	}
	return deferreds;
}



//PUBLIC



/*
@param real_time true if getting real time data, false if getting accumulated data
@param sensor_type 6 for WEIGHT_SENSOR_TYPE, 7 for DIST_SENSOR_TYPE
@param start_timestamp moment object
@param end_timestamp moment object
@param interval how many hours between each interval
@param floors a list of floors to get data from

@return a thenable where the data is in the format:
{'labels': [], 'recycling_obs': [], 'landfill_obs': [], 'compost_obs': []} where each array is the same size
labels contains the timestamps, and the other arrays contains the corresponding data points
example call: get_interval_data(...).then(function(data){...});

-use this function to get intervaled data, e.g. weight from Monday to Tuesday, intervals on one hour
-real time data example: how much weight is in bins at each timestamp
-accumulated data example: at 1:00PM, bins have 100g, between 1:00 and 2:00PM, 50g was thrown in bins,
 data point at 2:00PM now has 100g + 50g = 150g
*/
// function get_interval_data(real_time, sensor_type, start_timestamp, end_timestamp, interval_days, interval, floors){	
function get_interval_data({real_time = true, sensor_type = 6, start_timestamp = moment().subtract(1, 'days'),
							end_timestamp = moment(), interval = 1, floors = [1]} 
							= {}){	
	// set up labels
	labels_list = [];
	var label = start_timestamp;
	var end_d = end_timestamp;

	//set start_timestamp to one interval earlier
	// moment_start = moment(start_timestamp, displayMomentFormat);
	label.subtract(interval_days, 'days').subtract(interval, 'hours');
	start_timestamp = label.format('YYYY-MM-DD hh:mm A');
	
	// add labels to a labels_list
	while(label < end_d){
		labels_list.push(moment(label));
		label.add(interval_days, 'days').add(interval, 'hours');
	}
	// push the last date to make sure we cover the end date
	labels_list.push(moment(label));
	
	//store observations
	landfill_obs = [];
	recycling_obs = [];
	compost_obs = [];
	
	//fill each data list with 0
	for(var i = 0; i < labels_list.length; ++i){
		landfill_obs.push(0);
		recycling_obs.push(0);
		compost_obs.push(0);
	}
	
	//set payload type 
	payload_type = "weight";
	if(sensor_type == DIST_SENSOR_TYPE){
		payload_type = "distance";
	}

	// get bin data
	// loop starting from sensors to minimize tippers requests
	// this way we retrieve observations for each sensor only once
	console.log(BASE_SENSOR_URL + "sensor_type_id=" + sensor_type)
	return $.getJSON( BASE_SENSOR_URL + "sensor_type_id=" + sensor_type).then(function( data ) {	
		console.log("b");
		sensors = data;
		// use promises to wait for all api requests before returning
		if(real_time) {
			var deferreds = get_real_time_data(labels_list, sensors, payload_type, landfill_obs, recycling_obs, compost_obs, floors);
		}
		else{
			var deferreds = get_accumulated_data(labels_list, sensors, payload_type, landfill_obs, recycling_obs, compost_obs, floors);
		}
		return $.when.apply($, deferreds).then(function(){		
			//average distance
			if(sensor_type == DIST_SENSOR_TYPE){
				console.log("dist");
				for(i in labels_list){
					landfill_obs[i] /= sensors.length;
					recycling_obs[i] /= sensors.length;
					compost_obs[i] /= sensors.length;
				}
			}
			return {'labels': labels_list, 'recycling_obs': recycling_obs, 'landfill_obs': landfill_obs, 'compost_obs': compost_obs}
		});
		
	});
}