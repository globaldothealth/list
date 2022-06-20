from flask import Flask, request
from . import CaseController, MongoStore

import os


app = Flask(__name__)
case_controller = None # Will be set up in main()

@app.route('/api/case/<id>')
def get_case(id):
    return case_controller.get_case(id)

def set_up_controllers():
    global case_controller
    # TODO choose which store to load from configuration
    mongo_connection_string = os.environ.get('MONGO_CONNECTION')
    mongo_database = os.environ.get('MONGO_DB')
    mongo_collection = os.environ.get('MONGO_CASE_COLLECTION')
    mongo_store = MongoStore(mongo_connection_string, mongo_database, mongo_collection)
    case_controller = CaseController(mongo_store)

def main():
    set_up_controllers()
    app.run(host='0.0.0.0', port=8080)

if __name__ == '__main__':
    main()