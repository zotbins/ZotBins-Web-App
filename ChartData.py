from TippersRequests import *

#this function is probably not working

#rename 'type' as something else
def get_chart_data(type, start_timestamp, end_timestamp, interval_days, interval_hours, interval_minutes):
	#set up labels
	labels_list = []
	label = datetime.strptime(start_timestamp, '%Y-%m-%d %H:%M %p')
	end_d = datetime.strptime(end_timestamp, '%Y-%m-%d %H:%M %p')
		
	# set start_timestamp to one interval before the specified date
	start_timestamp = (label - timedelta(days=interval_days, hours=interval_hours, minutes=interval_minutes)).strftime('%Y-%m-%d %H:%M:%S')
	end_timestamp = end_d.strftime('%Y-%m-%d %H:%M:%S')
	
	# add lables to a labels_list
	while label <= end_d:
		labels_list.append(label.strftime('%Y-%m-%d %H:%M'))
		label = label + timedelta(days=interval_days, hours=interval_hours, minutes=interval_minutes)
	
	#get bin data
	sensors = get_sensors(type)
	

	# set up data
	landfill_obs = [0 for x in labels_list]
	recycling_obs = [0 for x in labels_list]
	compost_obs = [0 for x in labels_list]
	payload_type = "weight" if type == WEIGHT_SENSOR_TYPE else "distance"
	
	# get observations for each bin
	# for sensor in sensors:
		# observations = get_observation( sensor["id"], get_obs_type(type), start_timestamp, end_timestamp)
		# prev_payload = 0
		# i = 0
		# for date in labels_list:
			# for observation in observations:
				# if(observation["timestamp"] > date):
					# break
				# prev_payload = observation["payload"][payload_type]
				# if type == DIST_SENSOR_TYPE:
					# prev_payload = (BIN_HEIGHT - prev_payload) / BIN_HEIGHT * 100
					
	# for date in labels_list:
		# for sensor in sensors:
			# observations = get_observation( sensor["id"], get_obs_type(type), start_timestamp, end_timestamp)
			# for observation in observations:
				# if observation["timestamp"] > date:
					# break
				# elif observation["timestamp"] > prev_date:
					# payload = payload + observation["payload"][payload_type]
					
	# loop starting from sensors to minimize tippers requests
	# this way we retrieve observations for each sensor only once
	for sensor in sensors:
		# get observations from tippers
		observations = get_observation( sensor["id"], get_obs_type(type), start_timestamp, end_timestamp)
		# store the payload and a count in a variable
		payload = 0
		i = 0
		# set previous date to the first date minus the interval
		prev_date = labels_list[0] - timedelta(days=interval_days, hours=interval_hours, minutes=interval_minutes)
		
		for date in labels_list:
			# reset payload
			payload = 0
			# only use dates between the previous and current date
			if date > prev_date:
			
				for observation in observations:
					# if observation timestmap is greater than the date in the labels list, break out of loop
					if(observation["timestamp"] > date):
						break
					# set payload depending on sensor type
					if type == WEIGHT_SENSOR_TYPE:
						payload = payload + observation["payload"][payload_type]
					elif type == DIST_SENSOR_TYPE:
						payload = (BIN_HEIGHT - observation["payload"][payload_type]) / BIN_HEIGHT * 100
					
				#add the payload to the lists
				if sensor["name"][0] == "L":
					landfill_obs[i] = landfill_obs[i] + payload
				elif sensor["name"][0] == "R":
					recycling_obs[i] = recycling_obs[i] + payload
				elif sensor["name"][0] == "C":
					compost_obs[i] = compost_obs[i] + payload
				# set previous date to current date and increment count
				prev_date = date
				++i
		
	d = []
	for i in range(len(labels_list)):
		d.append({labels_list[i]: recycling_obs[i]})
	print(d)

	return {'labels': labels_list, 'recycling_obs': recycling_obs, 'landfill_obs': landfill_obs, 'compost_obs': compost_obs}


def get_bin_chart_data(bin_id, type, start_timestamp, end_timestamp, interval_days, interval_hours, interval_minutes):
	'''
	Retrieve data for a bin given the bin_id, starting time, ending time, interval measure, and type
	'''

	#set up labels
	labels_list = []
	label = datetime.strptime(start_timestamp, '%Y-%m-%d %H:%M %p')
	end_d = datetime.strptime(end_timestamp, '%Y-%m-%d %H:%M %p')
	
	start_timestamp = label.strftime('%Y-%m-%d %H:%M:%S')
	end_timestamp = end_d.strftime('%Y-%m-%d %H:%M:%S')
	
	while label <= end_d:
		labels_list.append(label.strftime('%Y-%m-%d %H:%M'))
		label = label + timedelta(days=interval_days, hours=interval_hours, minutes=interval_minutes)


	# sort data
	payload_type = "weight" if type == WEIGHT_SENSOR_TYPE else "distance"
	return_obs = []
	observations = get_observation( bin_id, get_obs_type(type), start_timestamp, end_timestamp)
	prev_payload = 0
	i = 0
	for date in labels_list:
		for observation in observations:
			if(observation["timestamp"] > date):
				break
			prev_payload = observation["payload"][payload_type]
			# if type == DIST_SENSOR_TYPE:
				# prev_payload = (BIN_HEIGHT - prev_payload) / BIN_HEIGHT * 100
			i = i + 1
		return_obs.append(prev_payload)
	print(return_obs)
	return {'labels': labels_list, 'obervations': return_obs}