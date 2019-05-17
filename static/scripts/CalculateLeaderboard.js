
/*
author: Joshua Cao

helper functions for Leaderboard.js
was originally intended to have functions that calculate the leaderboard rankings
turns out most of the rankings can be done through TipperFormattedData.js so there isn't much here
we can consider moving everything here to Leaderboard.js and removing this file
*/

var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';


//@param name_func an object that has names as indicies and functions as values (see top of TippersFormattedData.js for details)
//@param start_timestamp moment object
//@param end_timestamp moment object
/*function get_waste_leaderboard({name_func = {}, start_timestamp = moment().subtract(30, 'days'),
					end_timestamp = moment()} 
					= {}){
						console.log(30)
	return get_data({real_time: false, start_timestamp: start_timestamp, end_timestamp: end_timestamp,
						interval: 24, name_func: name_func}).then(function(data){
		//leaderboard data contains the information we want to return
		var leaderboard_data = {};
		//we are only interested in "data"
		data = data["data"];
		//for each name, we are only interested in the last point
		//which has the accumulated value of the entire time range
		for(name in data){
			leaderboard_data[name] = data[name][data[name].length-1];
		}
		return leaderboard_data;
	});
}*/


//this function is busted, someone go
function get_divergence_leaderboard(start_time=null, end_time=null){
	
	function create_callback(floor){
		
		return function(data){
			var divergence = [];
			console.log("Data");
			console.log(data);
			var landfill = data["landfill_obs"];
			console.log(landfill);
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
		deferreds.push(get_data(false, 6, start_time, end_time, 1, 0, [floor]).then(create_callback(floor)))
	}
	return $.when.apply($, deferreds).then(function(data){
		console.log(leaderboard)
		return leaderboard;
	});
}
