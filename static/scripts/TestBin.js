//fullness settings
var config1 = liquidFillGaugeDefaultSettings();
config1.circleThickness = 0.4;
config1.circleColor = "#6DA398";
config1.textColor = "#0E5144";
config1.waveTextColor = "#6DA398";
config1.waveColor = "#246D5F";
config1.textVertPosition = 0.52;
config1.waveAnimateTime = 5000;
config1.waveHeight = 0;
config1.waveAnimate = false;
config1.waveCount = 2;
config1.waveOffset = 0.25;
config1.textSize = .5;
config1.minValue = 30;
config1.maxValue = 150;
var gauge1;

var weight_sensor_type = 6;
var dist_sensor_type = 7;

//chart and dataset variables
var weight_chart;
var weight_bar_data = {};

var dist_chart;
var dist_bar_data = {};

var labels;
var weight_obervations;
var dist_observations;

function update_weight_chart(){
	$.getJSON( $SCRIPT_ROOT + "/get_bin_observations?bin_id=" + bin_id + 
														"&type=" + weight_sensor_type + 
														"&start_timestamp=" + start_timestamp + 
														"&end_timestamp=" + end_timestamp + 
														"&interval_days=" + interval_days +
														"&interval_hours=" + interval_hours +
														"&interval_minutes=" + interval_minutes, 
														function( data ) {
		weight_bar_data.labels = data["labels"];
		weight_observations = data["obervations"];
		
		weight_bar_data.datasets = [
				get_dataset(weight_observations, "Weight", "blue", "rgba(0, 0, 255, .1)"),
			];
	 
	   weight_chart.update();
	   $('#plot_points').prop('disabled', false);
	});
}

function update_dist_chart(){
	$.getJSON( $SCRIPT_ROOT + "/get_bin_observations?bin_id=" + bin_id + "D" + 
														"&type=" + dist_sensor_type + 
														"&start_timestamp=" + start_timestamp + 
														"&end_timestamp=" + end_timestamp + 
														"&interval_days=" + interval_days +
														"&interval_hours=" + interval_hours +
														"&interval_minutes=" + interval_minutes, 
														function( data ) {
		dist_bar_data.labels = data["labels"];
		dist_observations = data["obervations"];
		
		dist_bar_data.datasets = [
				get_dataset(dist_observations, "distance", "red", "rgba(255, 0, 0, .1)"),
			];
			
		$("#status").text("Status: " + dist_observations[dist_observations.length - 1] + "% full")
	 
	   dist_chart.update();
	   $('#plot_points').prop('disabled', false);
	});
}


function plotgraph(){
	$('#plot_points').prop('disabled', true);
	start_timestamp = $("#startdatetimepicker > input").val();
	end_timestamp = $("#enddatetimepicker > input").val();
	interval_days = $("#days_input").val();
	interval_hours = $("#hours_input").val();
	interval_minutes = $("#minutes_input").val();

	update_weight_chart();	
	update_dist_chart();
}


$(document).ready(function(){	

	//liquid fill gauge
	gauge1 = loadLiquidFillGauge("fillgauge1", 0, config1);
	
	//plot data listener
	$('#plot_points').click(function() {
		plotgraph();
	});
	
	//datetimepicker
	$('#startdatetimepicker').datetimepicker({
		defaultDate: start_timestamp,
		format: 'YYYY-MM-DD hh:mm A'
	});
	$('#enddatetimepicker').datetimepicker({
		defaultDate: end_timestamp,
		format: 'YYYY-MM-DD hh:mm A'
	});
			
	// set up chart
	var weight_ctx = document.getElementById("weight_chart");
	weight_chart = new Chart(weight_ctx, {
		type: 'line',
		data: weight_bar_data,
		options: get_default_options(),
		yAxisID: "weight"
	});
	var dist_ctx = document.getElementById("dist_chart")
	dist_chart = new Chart(dist_ctx, {
		type: 'line',
		data: dist_bar_data,
		options: get_default_options(),
		yAxisID: "distance"
	});
			
	plotgraph();
		
});