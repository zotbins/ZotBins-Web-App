import time
from datetime import *
from utils import *
import urllib.parse
import json
import requests
import math

from flask import Blueprint, session


tippers_requests = Blueprint('tippers_requests', __name__, template_folder='templates')

#tippers api urls
BASE_ROOMS_URL = "http://sensoria.ics.uci.edu:8059/infrastructure/get?"
BASE_LOCATIONS_URL = "http://sensoria.ics.uci.edu:8059/semanticobservation/presence/getLast?"
BASE_SENSOR_URL = "http://sensoria.ics.uci.edu:8059/sensor/get?"
BASE_OBS_URL = "http://sensoria.ics.uci.edu:8059/observation/get?"

BASE_ROOMS_URL = "/infrastructure/get?"
BASE_LOCATIONS_URL = "/semanticobservation/presence/getLast?"
BASE_SENSOR_URL = "/sensor/get?"
BASE_OBS_URL = "/observation/get?"

#locations constants
LOCATION_TYPE = 4
SERVICE_ID =  7

#tippers globals
WEIGHT_OBS_TYPE = 2
DIST_OBS_TYPE = 3

WEIGHT_SENSOR_TYPE = 6
DIST_SENSOR_TYPE = 7

BIN_HEIGHT = 80

# @return all tippers rooms as a json object
# http://sensoria.ics.uci.edu:8059/infrastructure/get?
def get_tippers_rooms():
	print(session)
	return eval(requests.get(session["tippershost"] + BASE_ROOMS_URL).text)
	
# @param the floor of the rooms
# @return all tippers rooms in the given floor as a json object
# http://sensoria.ics.uci.edu:8059/infrastructure/get?
def get_tippers_rooms_by_floor(floor):
	return list(filter(lambda x: x["region"]["floor"] == floor, get_tippers_rooms()))

# @param the room to get the info for
# @return given room json object
# http://sensoria.ics.uci.edu:8059/infrastructure/get?
def get_tippers_room(room):
	parameters = urllib.parse.urlencode([("name", room)])
	return eval(requests.get("http://sensoria.ics.uci.edu:8059"  + BASE_ROOMS_URL + parameters).text)
	
	
# @param subject_id the email of the user to get the locaiton of
# @return http://sensoria.ics.uci.edu:8059/semanticobservation/presence/getLast?type=4&subject_id=dhrubajg@uci.edu&requestor_id=primal@uci.edu&service_id=7
def get_location():
	parameters = urllib.parse.urlencode([("type", LOCATION_TYPE), ("subject_id", "caoj11@uci.edu"), ("start_timestamp", "2018-07-16 00:00:00"), 
										("end_timestamp", "2018-07-16 23:00:00"), ("requestor_id", "caoj11@uci.edu"), ("service_id", SERVICE_ID)])
	try:
		return eval(requests.get("http://sensoria.ics.uci.edu:8059" + BASE_LOCATIONS_URL + parameters).text)[-1]
	# if cant find the users location
	except:
		return {"payload": {"location": 2065}}
	
	
# @param sensor_type_id WEIGHT_SENSOR_TYPE = 6, DIST_SENSOR_TYPE = 7
# @return sensors json object
# http://sensoria.ics.uci.edu:8059/sensor/get?sensor_type_id=7
def get_sensors(sensor_type_id):
	parameters = urllib.parse.urlencode([("sensor_type_id", sensor_type_id)])
	return eval(requests.get(session["tippershost"] + BASE_SENSOR_URL + parameters).text)
	
	
# @param sensor_id the id of the sensor e.g. ZBin1
# @param type the type of the sensor (WEIGHT_OBS_TYPE = 2 DIST_OBS_TYPE = 3)
# @param start_time the timestamp in which to start getting observations
# @param end_time the timestamp in which to stop getting observations
# @return an observation json object, sorted	
# http://sensoria.ics.uci.edu:8059/observation/get?sensor_id=ZBin1&type=2&start_timestamp=2018-07-01+00%3A00%3A00&end_timestamp=2018-07-25+00%3A00%3A00
# default timestamps are within the past 24 hours
def get_observation(sensor_id, type, start_time=None, end_time=None):
	if start_time is None:
		start_time = get_datetime(days=1)
	if end_time is None:
		end_time = getdatetime()
		
	parameters = urllib.parse.urlencode([("sensor_id", sensor_id), ("type", 2), ("start_timestamp", start_time), ("end_timestamp", end_time)])
	observations = eval(requests.get(session["tippershost"] + BASE_OBS_URL + parameters).text)
	return sorted(observations, key = lambda x : x['timestamp'])
	
# @param the id of the sensor e.g. ZBin1D
# @return the percentage fullness of the bin
def get_bin_fullness(bin_id):
	start = get_datetime(days = 1)
	end = get_datetime()
	obs = get_observation(bin_id, DIST_OBS_TYPE, start, end)
	if obs == []:
		return 0
	latest_ob = obs[0]
	for ob in obs:
		if ob["timestamp"] > latest_ob["timestamp"]:
			latest_ob = ob
	try:
		#fullness = (BIN_HEIGHT - latest_ob["payload"]["distance"]) / BIN_HEIGHT
		fullness = latest_ob["payload"]["distance"]
		if fullness < 0 or fullness > 1:
			fullness = 0
		return fullness
	except: 
		return 0
		
		
		
		
#helpers
def get_obs_type(sensor_type):
	if sensor_type == WEIGHT_SENSOR_TYPE:
		return WEIGHT_OBS_TYPE
	elif sensor_type == DIST_SENSOR_TYPE:
		return DIST_OBS_TYPE
	return -1