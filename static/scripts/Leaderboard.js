/*
author: Joshua Cao

This is the main script run by Leaderboard.html


TODO:
-divergence leaderboard is busted
-we want to sort by regions, buildings
-option to view leaderboard by dates e.g. past year versus past month
 currently the default is 30 days, it runs super slow when doing 60 days
-individual user rankings(last in priority)

Notes:
look at the top of TippersFormattedData.js for information on name_funcs
uses helper functions from CalculateLeaderboard(there isn't much there, maybe just move everything into this file?)
@Sid or anyone else feel free to restructure code or anything you have the power to whatever you want
*/


//Button variables
var waste_type = "R";
var category_type = "Floor";
var selected_time = "Daily";

leaderboard_json = {
	"R": ["Top Recyclers", "Amount Recycled (grams)"],
	"C": ["Top Composters", "Amount Composted (grams)"],
	"D": ["Top Diverters", "Diversion rate (%)"]
}

var TIPPERS_MOMENT_FORMAT = 'YYYY-MM-DD HH:mm:ss';


//@param name_func an object that has names as indicies and functions as values (see top of TippersFormattedData.js for details)
//@param start_timestamp moment object
//@param end_timestamp moment object
function get_waste_leaderboard({name_func = {}, start_timestamp = moment().subtract(30, 'days'),
					end_timestamp = moment()} 
					= {}){
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
}

//@param num_floors rank from floors 1 to num_floors
//@param waste_type R for recycling, C for compost, L for Landfill
//@return a name_func object, see top of TippersFormattedData.js for details
function create_name_func(num_floors, waste_type = "R"){
	//FLOOR FUNCTION
	function floor_func(waste_type, i){
		//Return function that checks waste type and whether sensor location is on floor
		return function(sensor){return sensor["name"].charAt(0) == waste_type && parseInt(sensor["z"]) == i};
	}
	//REGION FUNCTION
	function region_func(waste_type, geometry){ 
		//Return function that checks waste type and whether sensor location is within region geometry
		return function(sensor){
			return sensor["name"][0] == waste_type && 
			geometry[0]["x"] <= parseInt(sensor["x"]) &&
			parseInt(sensor["x"]) <= geometry[1]["x"] &&
			geometry[0]["y"] <= parseInt(sensor["y"]) &&
			parseInt(sensor["y"]) <= geometry[1]["y"] &&
			parseInt(sensor["z"]) == geometry[0]["z"]
		};
	}
	
	//name_func is a dictionary whose values are lists of functions
	var name_func = {};
	//Retrieves json data
	$.ajax({
		url: "http://sensoria.ics.uci.edu:8059/infrastructure/get?",
		async: false,
		dataType: "json",
		type: "get",
		success: function(data){
			//Creates name_func dict
			if (category_type === "Floor") {
				for (var i = 1; i < num_floors + 1; ++i) {
					//Each value should be a list of only one function
					name_func["Floor " + i] = [floor_func(waste_type, i)];
				}
			}
			else if (category_type === "Region") {
				data.forEach(function(d) {
					if (d["region"]["geometry"].length !== 0) { //Some regions don't have anything in geometry
						if (name_func[d["area"]] === undefined) {
							name_func[d["area"]] = [];
						}
						name_func[d["area"]].push(region_func(waste_type, d["region"]["geometry"]));
					}
				});
			}
			else if (category_type === "Building") {
				// TODO: make building thing work
			}
			else { //shouldn't happen
				alert("How did you make it here");
			}
		}
	});
	return name_func;
}


function create_start_timestamp() {
	//returns appropriate start_timestamp
	if (selected_time === "Daily") {
		return moment().subtract(1, 'days');
	}
	else if (selected_time === "Weekly") {
		return moment().subtract(1, 'weeks');
	}
	else if (selected_time === "Monthly") {
		return moment().subtract(1, 'months');
	}
	else if (selected_time === "Yearly") {
		return moment().subtract(1, 'years');
	}
	else if (selected_time === "All Time") {
		return moment.unix(1531443661).utc(); // July 1 2018
	}
	else {
		alert("How did you make it here");
	}
}


//call this whenever updating leaderboard
function update_leaderboard(){
	//divergence leaderboard, this is pretty busted atm somebody gotta fix this
	if (waste_type == "D") {
		leaderboard = get_divergence_leaderboard({start_timestamp: moment().subtract(1, 'days')}/*create_start_timestamp()*/);
		
		leaderboard_sorted = leaderboard.sort(function(a,b){return b[1]-a[1]}); //descending order

		$("#public_leaderboard").append("<h2>Divergence</h2>");
		$("#public_leaderboard").append("<table class='table' id='leaderboard_table'><thead><tr><th>Rank</th><th>Floor</th><th>" 
										+ leaderboard_json[waste_type][1] + 
										"</tr></thead></table>");
		for(var i in leaderboard_sorted){
			entry = leaderboard_sorted[i];
			$("#leaderboard_table").append("<tr><td>" + (Number(i) + 1) + "</td><td>" + entry[0] + "</td><td>" + 
											entry[1] + "</td></tr>");
		}
	}
	//recycling/compost leaderboard
	else{
		get_waste_leaderboard({start_timestamp: create_start_timestamp(), name_func: create_name_func(6, waste_type)}).then(function(data){
			//create skeleton of table
			
			//Title and Interval select menu
			$("#public_leaderboard").append("<h2>" + leaderboard_json[waste_type][0] + `
												<div class='dropdown' id='time-dropdown'>
													<button class='btn btn-primary dropdown-toggle' type='button' id='timeButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'> ${ selected_time } </button> 
													<div class='dropdown-menu' aria-labelledby='dropdownMenuButton'> 
														<a id='daily_select' class='dropdown-item ${ selected_time === "Daily" ? "active" : "" }' href='#'>Daily</a> 
														<a id='weekly_select' class='dropdown-item ${ selected_time === "Weekly" ? "active" : "" }' href='#'>Weekly</a> 
														<a id='monthly_select' class='dropdown-item ${ selected_time === "Monthly" ? "active" : "" }' href='#'>Monthly</a> 
														<a id='yearly_select' class='dropdown-item ${ selected_time === "Yearly" ? "active" : "" }' href='#'>Yearly</a> 
														<a id='all_select' class='dropdown-item ${ selected_time === "All Time" ? "active" : "" }' href='#'>All Time</a> 
													</div>
												</div>
											</h2>
			`);
			
			//Category select menu
			var categoryToggle = `
				<div class='dropdown' id='category-dropdown'>
					<button class='btn btn-primary dropdown-toggle' type='button' id='categoryButton' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'> ${ category_type } </button> 
					<div class='dropdown-menu' aria-labelledby='dropdownMenuButton'> 
						<a id='floor_select' class='dropdown-item ${ category_type === "Floor" ? "active" : "" }' href='#'>Floor</a> 
						<a id='region_select' class='dropdown-item ${ category_type === "Region" ? "active" : "" }' href='#'>Region</a> 
						<a id='building_select' class='dropdown-item ${ category_type === "Building" ? "active" : "" }' href='#'>Building</a>
					</div>
				</div>
			`;
			
			//Table header
			$("#public_leaderboard").append("<table class='table' id='leaderboard_table'><thead><tr><th>Rank</th><th>"
											+ categoryToggle + "</th><th>" + leaderboard_json[waste_type][1] + "</tr></thead></table>");
			
			//sort in descending order
			keysSorted = Object.keys(data).sort(function(a,b){return data[b]-data[a]});
			//input into leaderboard in order
			for(var i in keysSorted){
				key = keysSorted[i];
				$("#leaderboard_table").append("<tr><td>" + (Number(i) + 1) + "</td><td>" + key + "</td><td>" + 
												data[key] + "</td></tr>");
			}
		});
	}
}


$(document).ready(function(){
	//whenever a dropdown item is clicked generate a new leaderboard
	$(document).on('click', '.dropdown-item', function() {
		$(".dropdown-item").removeClass("active")
		$(this).addClass("active");
		$(this).closest(".dropdown").find(".dropdown-toggle").text($(this).text());
	});
	//Leaderboard select menu changey stuff
	$(document).on('click', '#leaderboard-dropdown .dropdown-item', function() {
		$("#public_leaderboard").empty();
		if($(this).attr("id") == "divergence_select"){
			waste_type = "D";
		}
		else if($(this).attr("id") == "recycling_select"){
			waste_type = "R";
		}
		else if($(this).attr("id") == "compost_select"){
			waste_type = "C";
		}
		update_leaderboard();
	});
	//Category select menu changey stuff
	$(document).on('click', '#category-dropdown .dropdown-item', function() {
		$("#public_leaderboard").empty();
		
		if($(this).attr("id") == "floor_select"){
			category_type = "Floor";
		}
		else if($(this).attr("id") == "region_select"){
			category_type = "Region";
		}
		else if($(this).attr("id") == "building_select"){
			category_type = "Building";
		}
		update_leaderboard();
	});
	//Interval select menu changey stuff
	$(document).on('click', '#time-dropdown .dropdown-item', function() {
		$("#public_leaderboard").empty();
		
		if($(this).attr("id") == "daily_select"){
			selected_time = "Daily";
		}
		else if($(this).attr("id") == "weekly_select"){
			selected_time = "Weekly";
		}
		else if($(this).attr("id") == "monthly_select"){
			selected_time = "Monthly";
		}
		else if($(this).attr("id") == "yearly_select"){
			selected_time = "Yearly";
		}
		else if($(this).attr("id") == "all_select"){
			selected_time = "All Time";
		}
		update_leaderboard();
	});
	
	update_leaderboard();
});