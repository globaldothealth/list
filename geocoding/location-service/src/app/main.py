import json
import pymongo
from flask import Blueprint, Flask, jsonify, request
from os import environ

from src.app.admins_fetcher import AdminsFetcher
from src.app.fake_geocoder import FakeGeocoder
from src.app.geocoder import Geocoder
from src.app.geocoder_suggester import GeocodeSuggester
from src.integration.mapbox_client import mapbox_geocode

app = Flask(__name__)

geocoders = []

if 'ENABLE_FAKE_GEOCODER' in environ:
    faking_it = Blueprint('fake_geocoder', __name__)
    fake_geocoder = FakeGeocoder()
    @faking_it.route("/geocode/seed", methods=['POST'])
    def seed_fake_geocoder():
        obj = request.json
        fake_geocoder.seed(obj['name'], obj)
        return ''

    @faking_it.route("/geocode/clear", methods=['POST'])
    def clear_fake_geocoder():
        fake_geocoder.clear()
        return ''

    geocoders.append(fake_geocoder)
    app.register_blueprint(faking_it)

if 'MAPBOX_TOKEN' in environ:
    access_token = environ['MAPBOX_TOKEN']
    mongo_client = None
    if 'DB_CONNECTION_STRING' in environ:
        # searching for 'pymongo can auth on command line but not in container' leads to suggestions
        # to add the 'authSource' parameter on connection ¯\_(ツ)_/¯
        # e.g. https://www.reddit.com/r/learnpython/comments/m8ieht/am_trying_to_use_python_with_mongodb_and_am/
        mongo_client = pymongo.MongoClient(environ['DB_CONNECTION_STRING'], authSource='admin')
    rate_limit = int(environ.get('MAPBOX_GEOCODE_RATE_LIMIT_PER_MIN', 600))
    admins_fetcher = AdminsFetcher(access_token, mongo_client.get_database(environ['DB']), rate_limit=rate_limit)
    mapbox_geocoder = Geocoder(access_token, admins_fetcher, rate_limit=rate_limit)
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
    if not query:
        return "No query supplied", 400
    options = {}
    resolution = request.args.get('limitToResolution', '[]', type=str)
    listOfResolutions = json.loads(resolution)
    if len(listOfResolutions) > 0:
        options['limitToResolution'] = listOfResolutions
    countries = request.args.get('limitToCountry', '[]', type=str)
    listOfCountries = json.loads(countries)
    if len(listOfCountries) > 0:
        options['limitToCountry'] = listOfCountries
    for g in geocoders:
        locations = g.geocode(query, options)
        if len(locations) > 0:
            return jsonify(locations)
    return jsonify([])


@app.route("/geocode/suggest")
def suggest_geocode():
    try:
        return jsonify(suggester.suggest(request.args))
    except ValueError:
        return f"Bad limitToResolution value {request.args.get('limitToResolution', str)}", 422

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
