from flask import Flask, jsonify, request
from os import environ

from src.app.fake_geocoder import FakeGeocoder
from src.integration.mapbox_client import mapbox_geocode

app = Flask(__name__)
fake_geocoder = FakeGeocoder()

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

@app.route("/geocode/seed", methods=['POST'])
def seed_fake_geocoder():
    obj = request.json
    fake_geocoder.seed(obj['name'], obj)
    return ''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
