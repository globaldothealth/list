from datetime import date
from flask import Flask, jsonify, request
from data_service.controller.case_controller import CaseController
from data_service.stores.mongo_store import MongoStore
from data_service.util.errors import (
    PreconditionUnsatisfiedError,
    UnsupportedTypeError,
    ValidationError,
    WebApplicationError,
)
from data_service.util.json_encoder import JSONEncoder

import os
import logging

app = Flask(__name__)
app.json_encoder = JSONEncoder

case_controller = None  # Will be set up in main()


@app.route("/api/cases/<id>", methods=["GET", "PUT", "DELETE"])
def get_case(id):
    try:
        if request.method == "GET":
            return jsonify(case_controller.get_case(id)), 200
        elif request.method == "PUT":
            return jsonify(case_controller.update_case(id, request.get_json())), 200
        else:
            case_controller.delete_case(id)
            return "", 204
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases", methods=["POST", "GET"])
def list_cases():
    if request.method == "GET":
        page = request.args.get("page", type=int)
        limit = request.args.get("limit", type=int)
        filter = request.args.get("q", type=str)
        try:
            return (
                jsonify(
                    case_controller.list_cases(page=page, limit=limit, filter=filter)
                ),
                200,
            )
        except WebApplicationError as e:
            return jsonify({"message": e.args[0]}), e.http_code
    else:
        potential_case = request.get_json()
        validate_only = request.args.get("validate_only", type=bool)
        if validate_only:
            try:
                case_controller.validate_case_dictionary(potential_case)
                return "", 204
            except WebApplicationError as e:
                return jsonify({"message": e.args[0]}), e.http_code
        count = request.args.get("num_cases", type=int)
        if count is None:
            count = 1
        try:
            case_controller.create_case(potential_case, num_cases=count)
            return "", 201
        except WebApplicationError as e:
            return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases/batchUpsert", methods=["POST"])
def batch_upsert_cases():
    try:
        result = case_controller.batch_upsert(request.get_json())
        status = 200 if len(result.errors) == 0 else 207
        return jsonify(result), status
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases/download", methods=["POST"])
def download_cases():
    try:
        req = request.get_json()
        content_types = {
            "csv": "text/csv",
            "tsv": "text/tab-separated-values",
            "json": "application/json",
        }
        mime_type = content_types.get(req.get("format"), "text/plain")
        generator = case_controller.download(
            req.get("format"), req.get("query"), req.get("caseIds")
        )
        return app.response_class(generator(), mimetype=mime_type)
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases/batchStatusChange", methods=["POST"])
def batch_status_change():
    try:
        req = request.get_json()
        case_controller.batch_status_change(
            status=req.get("status"),
            note=req.get("note"),
            case_ids=req.get("caseIds"),
            filter=req.get("query"),
        )
        return "", 204
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases/batchUpdate", methods=["POST"])
def batch_update():
    try:
        req = request.get_json()
        count = case_controller.batch_update(req.get("cases"))
        return jsonify({"numModified": count}), 200
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/cases/batchUpdateQuery", methods=["POST"])
def batch_update_query():
    try:
        req = request.get_json()
        count = case_controller.batch_update_query(req.get("query"), req.get("case"))
        return jsonify({"numModified": count}), 200
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


@app.route("/api/excludedCaseIds")
def excluded_case_ids():
    try:
        source_id = request.args.get("sourceId")
        query = request.args.get("query")
        ids = case_controller.excluded_case_ids(source_id, query)
        return jsonify(ids), 200
    except WebApplicationError as e:
        return jsonify({"message": e.args[0]}), e.http_code


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
    case_controller = CaseController(app, store, date.fromisoformat(outbreak_date))


def main():
    set_up_controllers()
    app.run(host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
