
from datetime import *

from flask import Blueprint, session


utils_blueprint = Blueprint('utils_blueprint', __name__, template_folder='templates')

def not_logged_in():
	return 'email' not in session or 'tippershost' not in session


# @param days the number of days to subtract from current time
# @param hours the number of hours to subtract from current time
# @param minutes the number of minutes to subtract from current time
# @return current datetime string subtracted by the paramters
# call without parameters for current datetime
def get_datetime(days = 0, hours = 0, minutes = 0):
	return (datetime.today() - timedelta(days=days, hours=hours, minutes=minutes)).strftime('%Y-%m-%d %I:%M:%S')

	
	
	
	