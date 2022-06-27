from datetime import date
from flask import Flask, request
from . import CaseController, MongoStore
from reusable_data_service.util.iso_json_encoder import DataServiceJSONEncoder

import os
import logging

app = Flask(__name__)
app.json_encoder = DataServiceJSONEncoder

case_controller = None  # Will be set up in main()


@app.route("/api/cases/<id>")
def get_case(id):
    return case_controller.get_case(id)


@app.route("/api/cases", methods=["POST", "GET"])
def list_cases():
    if request.method == "GET":
        page = request.args.get("page", type=int)
        limit = request.args.get("limit", type=int)
        filter = request.args.get("q", type=str)
        return case_controller.list_cases(page=page, limit=limit, filter=filter)
    else:
        potential_case = request.get_json()
        validate_only = request.args.get("validate_only", type=bool)
        if validate_only:
            return case_controller.validate_case_dictionary(potential_case)
        count = request.args.get("num_cases", type=int)
        if count is None:
            count = 1
        return case_controller.create_case(potential_case, num_cases=count)


@app.route("/api/cases/batchUpsert", methods=["POST"])
def batch_upsert_cases():
    return case_controller.batch_upsert(request.get_json())


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
