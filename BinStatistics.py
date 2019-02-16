

'''
Example Result Dictionary:
{'2017-11-11 12:11:11': {'sensor_id': 'zot-bin-weight-2', 'payload': '{"weight":1}', 'request_ids': '[]', 'id': 3082816}, '2017-11-07 20:41:00': {'sensor_id': 'zot-bin-weight-2', 'payload': '{"weight":20}', 'request_ids': '[]', 'id': 3088142}, '2017-11-07 20:41:31': {'sensor_id': 'zot-bin-weight-2', 'payload': '{"weight":20}', 'request_ids': '[]', 'id': 3088158}}

'''
def waste_weight_sum(data_dict):
    '''returns the sum of a bin (if the google sheet only has one specific bin)'''
    result = 0  # assigns value as the waste_sum
    prev = None
    
    for item in sorted( data_dict.items() ):        
        val_dict = item[1]
        if len(val_dict) < 2:
            continue
        if prev == None:
            prev = float(val_dict['weight'])
        else:
            diff = float(val_dict['weight']) - prev
            avg = (float(val_dict['weight']) + prev) / 2
            percent_diff = 0
            if avg != 0: percent_diff = abs(diff) / avg * 100
            if percent_diff > 50 and diff < 0: result += prev
            prev = float(val_dict['weight'])  # replaces temp with current value
	
	#added this wierd stuff because prev is None and exception was raised because adding int and nonetype)
    return result + (0 if prev == None else prev)  # I add the last value to include the current weight in the bin that hasn't been emptied yet.
  
# OLD GSPREAD Dict: {"2017-08-25 15:02:04":    [21.23 (distance),    0.9953463817 (weight),    Not full]}
# NEW BIN            Dict: {'2017-11-11 11:11:11': {'weight': 30, 'distance': 30}}

def diversion_calc(compost, recycle, land):
	'''returns the percent value of the diversion rate'''
	
	# return 0
	
	total = land + recycle + compost
	# if(total == 0):
		# return 0
	diversion_rate = ((compost + recycle) / total) * 100
	return round(diversion_rate, 4)