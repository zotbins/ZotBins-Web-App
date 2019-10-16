
var WEIGHT_SENSOR_TYPE = 6
var DIST_SENSOR_TYPE = 7

//these later should be based on tippershost
var BASE_INFRASTRUCTURE_URL = "http://sensoria.ics.uci.edu:8059/infrastructure/get?";
var BASE_SENSOR_URL = "http://sensoria.ics.uci.edu:8059/sensor/get?";
var BASE_OBS_URL = "http://sensoria.ics.uci.edu:8059/observation/get?";

var TIPPERS_FORMAT = 'YYYY-MM-DD HH:mm:ss';


//call these functions like this: get_sensors(6).then(function(data){ });


/*
	@return an infrastructure json object
	http://sensoria.ics.uci.edu:8059/sensor/get?sensor_type_id=6
*/
function get_infrastructure() {
	return $.getJSON(BASE_INFRASTRUCTURE_URL).then(function(data) {
		// console.log("asdf");
		throw "asdf";
		return data;
	})
	.catch(function() {
		return [
			{
				"name":"DBH",
				"id":193813,
				"type":"building",
				"region":
					{
						"geometry":[],
						"id":412,
						"floor":0
					},
				"capacity":0
			},
			{
				"name":"ISG",
				"id":193821,
				"type":"region",
				"region":
					{
						"geometry":[],
						"id":420,
						"floor":2
					},
				"capacity":0},
			{
				"name":
				"2-floor",
				"id":193838,
				"type":"floor",
				"region":
					{
						"geometry":[],
						"id":440,
						"floor":0
					},
				"capacity":0
			},
			{"area":"ISG","name":"2065","id":28,"type":"conference_room","region":{"geometry":[{"x":55,"y":8,"z":2},{"x":60,"y":19,"z":2}],"id":28,"floor":2},"building":"DBH","capacity":20}
		]
	});
}

/*
@param sensor_type 6 for weight, 7 for distance
@return a sensor json object
http://sensoria.ics.uci.edu:8059/sensor/get?sensor_type_id=6
*/
function get_sensors(sensor_type) {
	return $.getJSON( BASE_SENSOR_URL + "sensor_type_id=" + sensor_type).then(function( data ) {
		return data;
	})
	.catch(function() {
		return [
			{
				"id": "ZBin1",
				"name": "RZotbins",
				"x": 10,
				"y": 20,
				"z": 2
			},
			{
				"id": "ZBin2",
				"name": "RZotbins",
				"x": 50,
				"y": 40,
				"z": 2
			}
		];
	});
}

//@param sensor_id the id of the sensor e.g. ZBin1
//@param type the type of the sensor (WEIGHT_OBS_TYPE = 2 DIST_OBS_TYPE = 3)
//@param start_time the timestamp in which to start getting observations
//@param end_time the timestamp in which to stop getting observations
//@return an observation json object, sorted	
//http://sensoria.ics.uci.edu:8059/observation/get?sensor_id=ZBin1&type=2&start_timestamp=2018-07-01+00%3A00%3A00&end_timestamp=2018-07-25+00%3A00%3A00
//default timestamps are within the past 24 hours
function get_observation(sensor_id, start_time=null, end_time=null){
	if(start_time === null || end_time === null){
		start_time = moment().subtract(1, 'days').format(TIPPERS_FORMAT);
		end_time = moment().format(TIPPERS_FORMAT);
	}
	return $.getJSON(BASE_OBS_URL + "sensor_id=" + sensor_id +
									"&start_timestamp=" + encodeURIComponent(start_time) +
									"&end_timestamp=" + encodeURIComponent(end_time)).then(function( data ) {
		return data;
	})
	.catch(function() {
		return [
			{
				"sensor_id": sensor_id,
				"payload": {
								"weight": 123
							},
				"request_ids": [],
				"id": 123,
				"timestamp": start_time
			},
			{
				"sensor_id": sensor_id,
				"payload": {
								"weight": 127
							},
				"request_ids": [],
				"id": 123,
				"timestamp": end_time - start_time
			}
		];
	});
}



