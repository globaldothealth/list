from flask import Flask, request
from . import CaseController, MongoStore

import os
import logging

app = Flask(__name__)
case_controller = None  # Will be set up in main()


@app.route("/api/case/<id>")
def get_case(id):
    return case_controller.get_case(id)


def set_up_controllers():
    global case_controller
    store_options = {"mongodb": MongoStore.setup}
    if store_choice := os.environ.get("DATA_STORAGE_BACKEND"):
        try:
            store = store_options[store_choice]()
        except KeyError:
            logging.exception(f"Cannot configure backend data store {store_choice}")
            raise
    case_controller = CaseController(store)


def main():
    set_up_controllers()
    app.run(host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
