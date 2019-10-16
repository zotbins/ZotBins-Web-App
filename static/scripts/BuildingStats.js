//constants
var WEIGHT_SENSOR_TYPE = 6;
var DIST_SENSOR_TYPE = 7;

var BIN_HEIGHT = 80;

var DISPLAY_MOMENT_FORMAT = 'YYYY-MM-DD hh:mm A';

var floors = [];

colors = {
	"Recycling" : ["blue", "rgba(0, 0, 255, .1)"],
	"Landfill" : ["red", "rgba(0, 0, 255, .1)"],
	"Compost" : ["green", "rgba(0, 255, 0, .1)"]
}
var rColor = "blue";
var rBackground = "rgba(0, 0, 255, .1)";

var lColor = "red";
var lBackground = "rgba(255, 0, 0, .1)";

var cColor = "green";
var cBackground = "rgba(0, 255, 0, .1)";

//chart and dataset variables
var chart;
var barData = {};
var options;

var labels;
var landfill_obs;
var recycling_obs;
var compost_obs;

var real_time = true;


function within_location(sensor){
	return floors.includes(parseInt(sensor["z"]));
}

name_func = {
	"Landfill": (sensor) => {return sensor["name"].length > 0 && sensor["name"][0]	== "L" &&
				within_location(sensor)},
	"Recycling":(sensor) => {return sensor["name"].length > 0 && sensor["name"][0]	== "R" &&
				within_location(sensor)},
	"Compost": (sensor) => {return sensor["name"].length > 0 && sensor["name"][0]	== "C" &&
				within_location(sensor)}
}

// @param type 6 for WEIGHT_SENSOR_TYPE, 7 for DIST_SENSOR_TYPE
// updates weight or fullness chart
function update_chart_obs(type){
	if(type == WEIGHT_SENSOR_TYPE){
		var payload_type = "weight";
		options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Weight (grams)';
	}
	else{
		var payload_type = "distance";
		options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Percent Average Fullness';
	}	
	get_data({real_time: real_time, start_timestamp: start_timestamp, end_timestamp: end_timestamp,
						name_func: name_func}).then(function(data){
		console.log(data)
		for(label in data["labels"]){
			barData.labels.push(data["labels"][label].format('YYYY-MM-DD hh:mm A'));
		}
		
		var series = data["data"];
		for(s in series){
			barData.datasets.push(get_dataset(series[s], s + " " + payload_type, colors[s][0], colors[s][1]));
		}
				 
	    chart.update();
	    $('#plot_points').prop('disabled', false);
		
		var landfill = data["data"]["Landfill"];
		var recycling = data["data"]["Recycling"];
		var compost = data["data"]["Compost"];
	})
	.always(function(){
		console.log("always")
		end_plot_procedure();
	});
}

// @param type 6 for WEIGHT_SENSOR_TYPE, 7 for DIST_SENSOR_TYPE
// updates divergence chart
function update_chart_divergence(){
	options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Percent Divergence';
	get_data({real_time: real_time, start_timestamp: start_timestamp, end_timestamp: end_timestamp,
						name_func: name_func}).then(function(data){
		
		for(label in data["labels"]){
			barData.labels.push(data["labels"][label].format('YYYY-MM-DD hh:mm A'));
		}
		var divergence = [];
		var landfill = data["data"]["Landfill"];
		var recycling = data["data"]["Recycling"];
		var compost = data["data"]["Compost"];
		
		for(var i = 0; i < data["labels"].length; ++i){
			if(recycling[i] + compost[i] + landfill[i] == 0){
				divergence.push(100);
			}
			else{
				divergence.push((recycling[i] + compost[i]) / 
									(recycling[i] + compost[i] + landfill[i]) * 100);
			}
		}
		
		barData.datasets = [get_dataset(divergence, "Divergence", rColor, rBackground)];
		
	    chart.update();
	    $('#plot_points').prop('disabled', false);
	})
	.always(function(){
		end_plot_procedure();
	});
}

// updates the chart and reenables the plot button
function end_plot_procedure() {
	chart.update();
	$('#plot_points').prop('disabled', false);
}

// plots the graph depending on inputs
function plotgraph(){
	$('#plot_points').prop('disabled', true);
	start_timestamp = moment($("#startdatetimepicker > input").val(), DISPLAY_MOMENT_FORMAT);
	end_timestamp = moment($("#enddatetimepicker > input").val(), DISPLAY_MOMENT_FORMAT);
	floors = [];
	$('.floor_check:checked').each(function(){
		floors.push(Number($(this).val()));
	});
	
	var chart_type_val = $('input[type=radio][name=accumulated_or_realtime]:checked').val();
	real_time = chart_type_val == 'real-time';
	
	options = chart["options"];
	
	barData.labels = [];
	barData.datasets = [];
	var metric = $("input[name=metric]:checked").val();
	if(metric == 'weight'){
		update_chart_obs(WEIGHT_SENSOR_TYPE);
	}	
	else if(metric == 'fullness'){
		update_chart_obs(DIST_SENSOR_TYPE);
	}
	else if(metric == 'divergence'){
		update_chart_divergence();
	}
}


$(document).ready(function(){
		
	$('#plot_points').click(function() {
		plotgraph();
	});
	
	$(function() {
		$('.chosen-select').chosen({
			width: "50%",
		}).change(function(){
			
		});
	});
	
	$('#startdatetimepicker').datetimepicker({
		date: start_timestamp,
		format: 'YYYY-MM-DD hh:mm A',
		maxDate: end_timestamp
	});
	$('#enddatetimepicker').datetimepicker({
		date: end_timestamp,
		format: 'YYYY-MM-DD hh:mm A',
		maxDate: end_timestamp
	});			
	
	$('#fullness').click(function(){
		$('#real-time').click();
		$('#accumulated').attr('disabled', 'disabled');
	});
	$('#weight, #divergence').click(function(){
		$('#accumulated').removeAttr('disabled');
	});
			
	var ctx = document.getElementById("chart");
	chart = new Chart(ctx, {
		type: 'line',
		data: barData,
		options: get_default_options(),
		yAxisID: "Fullness and Weight"
	});
				
	plotgraph();
	
});