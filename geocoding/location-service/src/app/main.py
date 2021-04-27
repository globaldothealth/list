from flask import Flask, jsonify, request
from os import environ

from src.integration.mapbox_client import mapbox_geocode

app = Flask(__name__)


@app.route("/health")
def index() -> str:
    if 'MAPBOX_TOKEN' not in environ:
        return jsonify({
            "status": "Unhealthy",
            "reason": "Mapbox API token is not present"
        }), 500
    return jsonify({"status": "Healthy"})

@app.route("/geocode")
def geocode():
    query = request.args.get('q', type=str)
    api_key = environ['MAPBOX_TOKEN']
    return mapbox_geocode(api_key, query)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)