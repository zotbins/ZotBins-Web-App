//constants
var WEIGHT_SENSOR_TYPE = 6;
var DIST_SENSOR_TYPE = 7;

var BIN_HEIGHT = 80;

var DISPLAY_MOMENT_FORMAT = 'YYYY-MM-DD hh:mm A';

var floors = [];

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

function update_chart_obs(type){
	if(type == WEIGHT_SENSOR_TYPE){
		var payload_type = "weight";
		options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Weight (grams)';
	}
	else{
		var payload_type = "distance";
		options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Percent Average Fullness';
	}
		get_interval_data({real_time: real_time, start_timestamp: start_timestamp, end_timestamp: end_timestamp,
							interval: interval, floors: floors}).then(function(data){
		barData.labels = [];
		for(label in data["labels"]){
			barData.labels.push(data["labels"][label].format('YYYY-MM-DD hh:mm A'));
		}
		var landfill = data["landfill_obs"];
		var recycling = data["recycling_obs"];
		var compost = data["compost_obs"]
		
		barData.datasets = [
				get_dataset(landfill, "Landfill " + payload_type, lColor, lBackground),
				get_dataset(recycling, "Recycling " + payload_type, rColor, rBackground),
				get_dataset(compost, "Compost " + payload_type, cColor, cBackground)
			];
				 
	    chart.update();
	    $('#plot_points').prop('disabled', false);
		
		//update stat table
		if(type == DIST_SENSOR_TYPE){
			update_fullness_table(landfill, recycling, compost, data["labels"][0].format('YYYY-MM-DD hh:mm A'),
			data["labels"][data["labels"].length-1].format('YYYY-MM-DD hh:mm A'));
		}
		else {
			update_divergence_table(landfill, recycling, compost, data["labels"][0].format('YYYY-MM-DD hh:mm A'),
			data["labels"][data["labels"].length-1].format('YYYY-MM-DD hh:mm A'));
		}
		console.log("not async if first");
	});
	console.log("async if first")
}

function update_chart_divergence(){
	get_interval_data({real_time: real_time, start_timestamp: start_timestamp, end_timestamp: end_timestamp,
							interval: interval, floors: floors}).then(function(data){
		options["scales"]["yAxes"][0]["scaleLabel"]["labelString"] = 'Percent Divergence';
		
		barData.labels = [];
		for(label in data["labels"]){
			barData.labels.push(data["labels"][label].format('YYYY-MM-DD hh:mm A'));
		}
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
		
		barData.datasets = [get_dataset(divergence, "Divergence", rColor, rBackground)];
		
	    chart.update();
	    $('#plot_points').prop('disabled', false);
		
		//update stat table
		if(!real_time){
			update_divergence_table(landfill, recycling, compost, data["labels"][0].format('YYYY-MM-DD hh:mm A'),
			data["labels"][data["labels"].length-1].format('YYYY-MM-DD hh:mm A'));
		}
	});
}


function update_divergence_table(landfill, recycling, compost, start_date, end_date){
	$(".stat-card .card-body").empty();
	//calculate percentages
	var acc_total = landfill[landfill.length-1] + recycling[recycling.length-1] + compost[compost.length-1];
	if(acc_total == 0){
		var l_percentage = 33.33;
		var r_percentage = 33.33;
		var c_percentage = 33.33;
		var divergence = 100;
	}
	else{
		var l_percentage = landfill[landfill.length - 1] / acc_total * 100;
		var r_percentage = recycling[recycling.length - 1] / acc_total * 100;
		var c_percentage = compost[compost.length - 1] / acc_total * 100;
		var divergence = r_percentage + c_percentage;
	}
	
	// if(real_time){
		// $(".stat-card .card-body").append("<h3>Start Date: " + start_date + "</h3>");
		// $(".stat-card .card-body").append("<h3>End Date: " + end_date + "</h3>");
	// }
	// else{
		$(".stat-card .card-body").append("<h3>Date: " + end_date + "</h3>");
	// }
	$(".stat-card .card-body").append("<h3>Divergence: " + divergence + "%</h3>");
	$(".stat-card .card-body").append("<table class='table'><thead><tr></tr></thead></table>");
	$(".table thead tr").append("<th scope='col'>Waste</th>");
	$(".table thead tr").append("<th scope='col'>Weight</th>");
	$(".table thead tr").append("<th scope='col'>% Weight</th>");
	$(".table").append("<tbody></tbody>");
	$(".table tbody").append("<tr><th scope='row'>Landfill</th><td>" + landfill[landfill.length-1].toFixed(2) + 
							"g</td><td>" + l_percentage.toFixed(2) + "%</td></tr>")
	$(".table tbody").append("<tr><th scope='row'>Recycling</th><td>" + recycling[recycling.length-1].toFixed(2) + 
							"g</td><td>" + r_percentage.toFixed(2) + "%</td></tr>")
	$(".table tbody").append("<tr><th scope='row'>Compost</th><td>" + compost[compost.length-1].toFixed(2) + 
							"g</td><td>" + c_percentage.toFixed(2) + "%</td></tr>")
}

function update_fullness_table(landfill, recycling, compost, start_date, end_date){
	$(".stat-card .card-body").empty();
	//calculate percentages
	var l_percentage = 0;
	var r_percentage = 0;
	var c_percentage = 0;
	for(i = 0; i < landfill.length; ++i){
		l_percentage += landfill[i];
		r_percentage += recycling[i];
		c_percentage += compost[i];
	}
	l_percentage /= landfill.length;
	r_percentage /= recycling.length;
	c_percentage /= compost.length;
	$(".stat-card .card-body").append("<h3>Start Date: " + start_date + "</h3>");
	$(".stat-card .card-body").append("<h3>End Date: " + end_date + "</h3>");
	$(".stat-card .card-body").append("<table class='table'><thead><tr></tr></thead></table>");
	$(".table thead tr").append("<th scope='col'>Waste</th>");
	$(".table thead tr").append("<th scope='col'>% Average Fullness</th>");
	$(".table").append("<tbody></tbody>");
	$(".table tbody").append("<tr><th scope='row'>Landfill</th><td>" + l_percentage.toFixed(2) + "%</td></tr>")
	$(".table tbody").append("<tr><th scope='row'>Recycling</th><td>" + r_percentage.toFixed(2) + "%</td></tr>")
	$(".table tbody").append("<tr><th scope='row'>Compost</th><td>" + c_percentage.toFixed(2) + "%</td></tr>")
}


function plotgraph(){
	$('#plot_points').prop('disabled', true);
	start_timestamp = moment($("#startdatetimepicker > input").val(), DISPLAY_MOMENT_FORMAT);
	end_timestamp = moment($("#enddatetimepicker > input").val(), DISPLAY_MOMENT_FORMAT);
	interval = parseFloat($("#hours_input").val());
	interval += parseFloat($("#days_input").val() * 24);
	floors = [];
	$('.floor_check:checked').each(function(){
		floors.push(Number($(this).val()));
	});
	
	var chart_type_val = $('input[type=radio][name=chart_type]:checked').val();
	if(chart_type_val == 'real-time'){
		real_time = true;
	}
	else if(chart_type_val == 'accumulated'){
		real_time = false;
	}
	
	options = chart["options"];
	
	if($('#weight').hasClass('active-nav-card')){
		update_chart_obs(WEIGHT_SENSOR_TYPE);
	}	
	else if($('#fullness').hasClass('active-nav-card')){
		update_chart_obs(DIST_SENSOR_TYPE);
	}
	else if($('#divergence').hasClass('active-nav-card')){
		update_chart_divergence();
	}
}


$(document).ready(function(){
		
	//plot data listener
	$('#plot_points').click(function() {
		plotgraph();
	});
	
	//change graph type listeners
	$('.nav-card').click(function(){
		$('.active-nav-card').removeClass('active-nav-card');
		$(this).addClass('active-nav-card');
	});
	
	//datetimepicker
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
	
	//nav cards
	$('#fullness').click(function(){
		$('#real-time').click();
		$('#accumulated').attr('disabled', 'disabled');
	});
	$('#weight, #divergence').click(function(){
		$('#accumulated').removeAttr('disabled');
	});
			
	// set up chart
	var ctx = document.getElementById("chart");
	chart = new Chart(ctx, {
		type: 'line',
		data: barData,
		options: get_default_options(),
		yAxisID: "Fullness and Weight"
	});
				
	plotgraph();
	
});