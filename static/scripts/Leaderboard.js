
var waste_type = "R";
var leaderboard_type = "z";

leaderboard_json = {
	"R": ["Top Recyclers", "Amount Recycled (grams)"],
	"C": ["Top Composters", "Amount Composted (grams)"],
	"D": ["Top Diverters", "Diversion rate (%)"]
}

var floor = true;

function update_leaderboard(){
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
	else{
		console.log(waste_type);
		get_leaderboard(waste_type, leaderboard_type).then(function(data){
			$("#public_leaderboard").append("<h2>" + leaderboard_json[waste_type][0] + "</h2>");
			$("#public_leaderboard").append("<table class='table' id='leaderboard_table'><thead><tr><th>Rank</th><th>Floor</th><th>" 
											+ leaderboard_json[waste_type][1] + 
											"</tr></thead></table>");
			keysSorted = Object.keys(data).sort(function(a,b){return data[b]-data[a]}); //descending order
			for(var i in keysSorted){
				key = keysSorted[i];
				$("#leaderboard_table").append("<tr><td>" + (Number(i) + 1) + "</td><td>" + key + "</td><td>" + 
												data[key] + "</td></tr>");
			}
		});
	}
}


$(document).ready(function(){
	
	$(".dropdown-item").click(function(){
		$(".dropdown-item").removeClass("active")
		$(this).addClass("active");
		$("#leaderboardButton").text($(this).text());
		
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
	
	update_leaderboard();
});