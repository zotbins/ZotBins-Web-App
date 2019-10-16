/*
author: Joshua Cao

This file provides functions to asynchronously get TIPPERS data in a convenient format.
The public functions are located at the bottom.

A Note on 'name_func'
name_func is an object with names as keys and functions as values
the functions should take a standard TIPPERS sensor object as input
e.g.
{
	"owner": "8438",
	"Type": "6",
	"name": "CZotBinSC3 WeightSensor",
	"x": "30",
	"description": "ZotBinSC3 Weight Sensor for Compost",
	"y": "10",
	"z": "6",
	"id": "ZBinSC3"
}
the function will return true if the sensor matches certain criteria
for example, if you want to find recycling bins on the 3rd floor an entry in name_func might be
{..., "Recycling_3rdfloor" : (sensor) => return sensor["name"][0] == "R" && sensor["z"] == "3",...}
*/




var WEIGHT_SENSOR_TYPE = 6
var DIST_SENSOR_TYPE = 7

var BASE_SENSOR_URL = "http://sensoria.ics.uci.edu:8059/sensor/get?";
var BASE_OBS_URL = "http://sensoria.ics.uci.edu:8059/observation/get?";

var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';


//PRIVATE

// @param name_func an object that has names as indicies and functions as values (see top of file for details)
// @param sensors an array of sensors in the TIPPERS sensor format
// @param labels_list a list of Moment date objects that are the data point intervals
// @param real_time true if getting real time data, false if getting accumulated data
// @param sensor_type 6 for WEIGHT_SENSOR_TYPE, 7 for DIST_SENSOR_TYPE

// @return a thenable object that has data with format
// {"labels": labels_list, "data": {name1: [list of datapoints], ..., nameN: [list of datapoints]}}  
function get_real_time_data(name_func, sensors, labels_list, real_time, sensor_type){
	//each callback adds the given sensors payload to the appropriate groups
	//@param sensor the sensor object in the format in the TIPPERS sensor(might not need this)
	//@param satisfied_names a list of number representing the group numbers that the sensor satisfies
	function create_callback(sensor, satisfied_names){
		return function(observations){
			for(date in labels_list){
				payload = 0;
				for(o in observations){
					var obs = observations[o];
					if(moment(obs["timestamp"], TIPPERS_MOMENT_FORMAT) > labels_list[date]){
						break
					}
					payload = obs["payload"][payload_type];
					if(sensor_type == DIST_SENSOR_TYPE && payload > 1){
						payload = 0;
					}
				}
				for(name in satisfied_names){
					data[satisfied_names[name]][date] += payload;	
				}	
			}	
		}
	}
	
	//helper function that returns the groups that the given sensor satisifies
	//@param sensor the sensor object in the format in the TIPPERS sensor
	function get_satisfied_names(sensor){
		satisfied_names = [];
		for (name in name_func) { //Dict loop
			for (i in name_func[name]) { //Function list loop
				if (name_func[name][i](sensor)) { //If function is satisfied
					satisfied_names.push(name);
				}
			}
		}
		return satisfied_names;
	}
	
	data = {};
	for(name in name_func){
		data[name] = [];
		for(interval in labels_list){
			data[name].push(0);
		}
	}
	
	var payload_type = "weight";
	if(sensor_type == DIST_SENSOR_TYPE){
		payload_type = "distance";
	}
	
	var deferreds = [];
	var start_timestamp = labels_list[0].format(TIPPERS_MOMENT_FORMAT);
	var end_timestamp = labels_list[labels_list.length - 1].format(TIPPERS_MOMENT_FORMAT);
	for(s in sensors){
		//need to remove zot-bin-weight-N from TIPPERS
		var sensor = sensors[s];
		var satisfied_names = get_satisfied_names(sensor);
		if(satisfied_names.length > 0 &&
		sensor["id"] != "zot-bin-weight-1" && sensor["id"] != "zot-bin-weight-2"){
			deferreds.push( $.getJSON(BASE_OBS_URL + "sensor_id=" + sensor["id"] +
									"&start_timestamp=" + encodeURIComponent(moment(start_timestamp).format(TIPPERS_MOMENT_FORMAT)) +
									"&end_timestamp=" + encodeURIComponent(moment(end_timestamp).format(TIPPERS_MOMENT_FORMAT)),
									create_callback(sensor, satisfied_names)));
		}
	}
	
	return $.when.apply($, deferreds).then(function(){	
		if(sensor_type == DIST_SENSOR_TYPE && sensors.length > 0){
			for(d in data){
				var grp = data[d];
				for(obs in grp){
					grp[obs] /= sensors.length;
				}
			}
		}
		if(!real_time){
			data = accumulate_data(data);
		}
		return {"data": data, "labels": labels_list};
	});
}


// takes real_time data and converts it to accumulated data
// @param data a data object in the following format:
// 		{name1 : [data_point1, dp2, ...dpM], name2 : [dp1-M], ... nameN : [dp1-M]}
// @return data object in the same format but is now accumulated
function accumulate_data(data){
	for(name in data){
		var data_points = data[name];
		for(var i = 1; i < data_points.length; ++i){
			data_points[i] += data_points[i-1];
		}
	}
	return data;
}



//PUBLIC

/*
@param real_time true if getting real time data, false if getting accumulated data
@param sensor_type 6 for WEIGHT_SENSOR_TYPE, 7 for DIST_SENSOR_TYPE
@param start_timestamp moment object
@param end_timestamp moment object
@param interval how many hours between each interval
@param name_func an object that has names as indicies and functions as values (see top of file for details)

@return a thenable where the data is in the format:
// {"labels": labels_list, "data": {name1: [list of datapoints], ..., nameN: [list of datapoints]}}  
labels contains the timestamps, and the other arrays contains the corresponding data points
example call: get_interval_data(...).then(function(data){...});

-use this function to get intervaled data, e.g. weight from Monday to Tuesday, intervals on one hour
-real time data example: how much weight is in bins at each timestamp
-accumulated data example: at 1:00PM, bins have 100g, between 1:00 and 2:00PM, 50g was thrown in bins,
 data point at 2:00PM now has 100g + 50g = 150g
*/
function get_data({real_time = true, sensor_type = 6, start_timestamp = moment().subtract(1, 'days'),
					end_timestamp = moment(), interval = 1, name_func = {}} 
					= {}){
	labels_list = [];
	var label = start_timestamp;
	var end_d = end_timestamp;

	start_timestamp = label.format(TIPPERS_MOMENT_FORMAT);
	
	while(label < end_d){ 
		labels_list.push(moment(label));
		label.add(interval, 'hours');
	}
	
	return $.getJSON( BASE_SENSOR_URL + "sensor_type_id=" + sensor_type).then(function( sensors ) {
		var data = get_real_time_data(name_func, sensors, labels_list, real_time, sensor_type);
		return data;
	});	
}



