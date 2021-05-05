import pymongo
from flask import Flask, jsonify, request
from os import environ

from src.app.admins_fetcher import AdminsFetcher
from src.app.fake_geocoder import FakeGeocoder
from src.app.geocoder import Geocoder
from src.app.geocoder_suggester import GeocodeSuggester
from src.integration.mapbox_client import mapbox_geocode

app = Flask(__name__)

geocoders = []
fake_geocoder = FakeGeocoder()

if 'ENABLE_FAKE_GEOCODER' in environ:
    geocoders.append(fake_geocoder)
if 'MAPBOX_TOKEN' in environ:
    access_token = environ['MAPBOX_TOKEN']
    mongo_client = None
    if 'DB_CONNECTION_STRING' in environ:
        mongo_client = pymongo.MongoClient(environ['DB_CONNECTION_STRING'])

    admins_fetcher = AdminsFetcher(access_token, mongo_client)
    mapbox_geocoder = Geocoder(access_token, admins_fetcher)
    geocoders.append(mapbox_geocoder)

suggester = GeocodeSuggester(geocoders)

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


@app.route("/geocode/clear", methods=['POST'])
def clear_fake_geocoder():
    fake_geocoder.clear()
    return ''


@app.route("/geocode/suggest")
def suggest_geocode():
    try:
        return jsonify(suggester.suggest(request.args))
    except ValueError:
        return f"Bad limitToResolution value {request.args.get('limitToResolution', str)}", 422

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
