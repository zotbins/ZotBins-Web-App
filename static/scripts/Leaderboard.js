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



var waste_type = "R";
var category_type = "Floor";

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
}

//@param num_floors rank from floors 1 to num_floors
//@param waste_type R for recycling, C for compost, L for Landfill
//@return a name_func object, see top of TippersFormattedData.js for details
function create_name_func(num_floors, waste_type = "R"){
	//FLOOR
	function floor_func(waste_type, i){
		return function(sensor){return sensor["name"][0] == waste_type && parseInt(sensor["z"]) == i};
	}
	//REGION
	function region_func(waste_type, geometry){
		return function(sensor){
			return sensor["name"][0] == waste_type && 
			geometry[0]["x"] <= parseInt(sensor["x"]) &&
			parseInt(sensor["x"]) <= geometry[1]["x"] &&
			geometry[0]["y"] <= parseInt(sensor["y"]) &&
			parseInt(sensor["y"]) <= geometry[1]["y"] &&
			parseInt(sensor["z"]) == geometry[0]["z"]
		};
	}
	
	var name_func = {};
	$.ajax({
		url: "http://sensoria.ics.uci.edu:8059/infrastructure/get?",
		async: false,
		dataType: "json",
		type: "get",
		success: function(data){
			console.log(data);
			
			if (category_type === "Floor") {
				for(var i = 1; i < num_floors + 1; ++i){
					name_func["Floor " + i] = floor_func(waste_type, i);
				}
			}
			else if (category_type === "Region") {
				data.forEach(function(d) {
					if (d["region"]["geometry"].length !== 0) {
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
			else {
				alert("How did you make it here");
			}
		}
	});
	console.log(name_func);
	return name_func;
}


////REGION
/*
	function create_func(waste_type, geometry){
		return function(sensor){
			return sensor["name"][0] == waste_type && 
			geometry[0]["x"] <= parseInt(sensor["x"]) &&
			parseInt(sensor["x"]) <= geometry[1]["x"] &&
			geometry[0]["y"] <= parseInt(sensor["y"]) &&
			parseInt(sensor["y"]) <= geometry[1]["y"] &&
			parseInt(sensor["z"]) == geometry[0]["z"]
		};
	}
	
	var content = {};
	$.ajax({
		url: "http://sensoria.ics.uci.edu:8059/infrastructure/get?",
		async: false,
		dataType: "json",
		type: "get",
		success: function(data){
			console.log(data);
			var name_func = {};
			data.forEach(function(d) {
				if (d["region"]["geometry"].length !== 0) {
					if (name_func[d["area"]] === undefined) {
						name_func[d["area"]] = [];
					}
					name_func[d["area"]].push(create_func(waste_type, d["region"]["geometry"]));
				}
			});
			content = name_func;
		}
	});
*/

////OLD FUNCTION FOR FLOORS
/*
function create_name_func(num_floors, waste_type = "R"){
	function create_func(waste_type, i){
		return function(sensor){return sensor["name"][0] == waste_type && parseInt(sensor["z"]) == i};
	}
	name_func = {};
	for(var i = 1; i < num_floors + 1; ++i){
		name_func["floor" + i] = create_func(waste_type, i);
	}
	return name_func;
}

*/


//call this whenever updating leaderboard
function update_leaderboard(){
	//divergence leaderboard, this is pretty busted atm somebody gotta fix this
	if(waste_type == "D"){
		console.log("D");
		get_divergence_leaderboard().then(function(data){
			leaderboard = data;
			console.log(leaderboard);
			leaderboard_sorted = leaderboard.sort(function(a,b){return b[1]-a[1]}); //descending order
			console.log(leaderboard_sorted);
			
			$("#public_leaderboard").append("<h2>Divergence</h2>");
			$("#public_leaderboard").append("<table class='table' id='leaderboard_table'><thead><tr><th>Rank</th><th>Floor</th><th>" 
											+ leaderboard_json[waste_type][1] + 
											"</tr></thead></table>");
			for(var i in leaderboard_sorted){
				entry = leaderboard_sorted[i];
				$("#leaderboard_table").append("<tr><td>" + (Number(i) + 1) + "</td><td>" + entry[0] + "</td><td>" + 
												entry[1] + "</td></tr>");
			}
		});
	}
	//recycling/compost leaderboard
	else{
		get_waste_leaderboard({name_func: create_name_func(6, waste_type)}).then(function(data){
			//create skeleton of table
			console.log(category_type);
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
			$("#public_leaderboard").append("<h2>" + leaderboard_json[waste_type][0] + "</h2>");
			$("#public_leaderboard").append("<table class='table' id='leaderboard_table'><thead><tr><th>Rank</th><th>"+categoryToggle+"</th><th>" 
											+ leaderboard_json[waste_type][1] + 
											"</tr></thead></table>");
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
	
	update_leaderboard();
});