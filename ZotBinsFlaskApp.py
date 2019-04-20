
from TippersRequests import *
from BinStatistics import * 
from utils import *
from ChartData import *

import requests
from flask import Flask, request, render_template, url_for, Markup, jsonify, session, copy_current_request_context, Blueprint
from flask.helpers import send_from_directory
import atexit

#dict of binsIDs and their locations, we shouldnt use this anymore
DBHbin_locations = {"1":1}
DBHBins = ["1"]


app = Flask(__name__)
app.register_blueprint(tippers_requests)
app.register_blueprint(utils_blueprint)

app.secret_key = b'?6f7?"%F+_52RG3d3/#9-Q-=G-}x2#=4`?Ka)m]PHS~FYU3h17z(?wjSY;wJ:+~z3-5w{'


@app.route("/", methods=["GET", "POST"])
@app.route("/index", methods=["GET", "POST"])
def landing_page():
	if request.method == 'POST':
		session.clear()
		session["email"] = request.values.get("email")
		session["tippershost"] = request.values.get("tippershost")
		return render_template("login.html", name=request.values.get("email"), tippershost=request.values.get("tippershost"))
	else:
		return render_template("index.html")

@app.route("/FindClosestBin")
def find_closest_bin():
	return render_template("FindClosestBin.html")#, rooms = sorted(rooms), bins = get_sensors(WEIGHT_SENSOR_TYPE))

@app.route("/BuildingStats", methods=['GET', 'POST'])
def building_stats():
	#setup timestamps and labels
	start_timestamp = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:00')
	end_timestamp = (datetime.now()).strftime('%Y-%m-%d %H:%M:00')
		
	return render_template("BuildingStats.html", type = WEIGHT_SENSOR_TYPE, start_timestamp = start_timestamp, end_timestamp = end_timestamp,
							interval_days = 0, interval_hours = 1, interval_minutes = 0)
							
@app.route("/Leaderboard")
def leaderboard():
	return render_template("Leaderboard.html")
	
@app.route("/TestBin", methods = ['GET', 'POST'])
def test_bin():
	bin_id = request.args.get("binID")
	bin_type = request.args.get("binType")
	
	start_timestamp = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:00')
	end_timestamp = (datetime.now()).strftime('%Y-%m-%d %H:%M:00')
	
	return render_template("TestBin.html", bin_id = bin_id, type = WEIGHT_SENSOR_TYPE, start_timestamp = start_timestamp, end_timestamp = end_timestamp, 
	interval_days = 0, interval_hours = 1, interval_minutes = 0)
	
	
	
#helper to get chart data

	
#api calls
@app.route('/set_session', methods=['POST'])
def set_session():
	if not request.json:
		return json.dumps({}), 400
	data = request.json
	session.clear()
	session['email'] = data['email']
	session['tippershost'] = data['tippershost']
	print(session)
	return json.dumps(data), 200

@app.route('/get_bin_observations', methods=['GET'])
def get_bin_observations():
	bin_id = request.args.get("bin_id")
	type = int(request.args.get("type"))
	start_timestamp = request.args.get("start_timestamp")
	end_timestamp = request.args.get("end_timestamp")
	interval_days = int(request.args.get("interval_days"))
	interval_hours = int(request.args.get("interval_hours"))
	interval_minutes = int(request.args.get("interval_minutes"))
	
	return jsonify(get_bin_chart_data(bin_id, type, start_timestamp, end_timestamp, interval_days, interval_hours, interval_minutes))
	
@app.route('/get_building_observations', methods=['GET'])
def get_building_obseravations():
	#HTTP get data
	type = int(request.args.get("type"))
	start_timestamp = request.args.get("start_timestamp")
	end_timestamp = request.args.get("end_timestamp")	
	interval_days = int(request.args.get("interval_days"))
	interval_hours = int(request.args.get("interval_hours"))
	interval_minutes = int(request.args.get("interval_minutes"))
						
	return jsonify(get_chart_data(type, start_timestamp, end_timestamp, interval_days, interval_hours, interval_minutes))
	
@app.route('/get_building_divergence', methods=['GET'])
def get_building_divergence():
	#HTTP get data
	start_timestamp = request.args.get("start_timestamp")
	end_timestamp = request.args.get("end_timestamp")
	
	obs = get_chart_data(WEIGHT_SENSOR_TYPE, start_timestamp, end_timestamp)
	
	labels = obs['labels']
	landfill = obs['landfill_obs']
	recycling = obs['recycling_obs']
	compost = obs['compost_obs']
	
	divergence = []
	
	for i in range(len(labels)):
		if(recycling[i] + compost[i] + landfill[i] == 0):
			divergence.append(0)
		else:
			divergence.append((recycling[i] + compost[i]) / (recycling[i] + compost[i] + landfill[i]) * 100)
			
	return jsonify({'labels': labels, 'divergence': divergence})
	
@app.route('/get_closest_bins', methods=['GET'])
def get_closest_bins():
	#closest bin using tportal	
	location = get_location()
	#print(location)
	tippers_room = get_tippers_room(location["payload"]["location"])
	#print(tippers_room)
	
	#comment out the line below to use tportal automatic location
	# tippers_room = get_tippers_room(request.form['room'])
	
	weight_sensors = get_sensors(WEIGHT_SENSOR_TYPE)
	
	#set user location
	coords = tippers_room[0]['region']['geometry']
	if(len(coords) > 0):
		user_location = [(coords[0]['x'] + coords[1]['x']) / 2, (coords[0]['y'] + coords[1]['y']) / 2,  coords[0]['z']]
	else:
		user_location = [0, 0, 1]

	#calculate and sort closest bins
	def filter_bins(bin):
		print(bin)
		return (bin["id"][0:4] == "ZBin" and 
			#get_bin_fullness(bin["id"] + "D") <= .9 and
			bin["name"][0] == request.args.get("type") and int(bin["z"]) == user_location[2])
	# a=[1,2,3,4,65,6,7,8]
	# b = list(filter(lambda x: )
	filtered_bins = list(filter(filter_bins, weight_sensors))

	closest_bins = sorted(filtered_bins, key = lambda bin : (abs(user_location[2] - float(bin["z"])	), 
									math.sqrt((user_location[0] - float(bin["x"])) ** 2 + (user_location[1] - float(bin["y"])) ** 2)))
	
	return jsonify({'closest_bins': closest_bins})
                

if __name__ == "__main__":
	app.run(debug = True)
