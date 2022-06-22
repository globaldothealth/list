from datetime import date
from flask import Flask, request
from . import CaseController, MongoStore
from reusable_data_service.util.iso_json_encoder import ISOJSONEncoder

import os
import logging

app = Flask(__name__)
app.json_encoder = ISOJSONEncoder

case_controller = None  # Will be set up in main()


@app.route("/api/cases/<id>")
def get_case(id):
    return case_controller.get_case(id)


@app.route("/api/cases", methods = ['POST', 'GET'])
def list_cases():
    if request.method == 'GET':
        page = request.args.get("page", type=int)
        limit = request.args.get("limit", type=int)
        filter = request.args.get("q", type=str)
        return case_controller.list_cases(page=page, limit=limit, filter=filter)
    else:
        return case_controller.create_case(request.get_json())

def set_up_controllers():
    global case_controller
    store_options = {"mongodb": MongoStore.setup}
    if store_choice := os.environ.get("DATA_STORAGE_BACKEND"):
        try:
            store = store_options[store_choice]()
        except KeyError:
            logging.exception(f"Cannot configure backend data store {store_choice}")
            raise
    outbreak_date = os.environ.get("OUTBREAK_DATE")
    if outbreak_date is None:
        raise ValueError("Define $OUTBREAK_DATE in the environment")
    case_controller = CaseController(store, date.fromisoformat(outbreak_date))


def main():
    set_up_controllers()
    app.run(host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
