import codecs
import json
from os import environ
import requests

def retrieve_map(api_key: str, base_url: str) -> str:
    api_endpoint = f"{base_url}/api/geocode/countryNames"
    response = requests.get(api_endpoint, headers={ 'X-API-Key': api_key })
    if response.ok:
        return response.json()
    else:
        raise ValueError(f"Got {response.status_code} response from server: {response.text}")

if __name__ == '__main__':
    api_key = environ.get('GDOTH_API_KEY')
    base_url = environ.get('GDOTH_API_BASEURL')
    print(codecs.decode(json.dumps(retrieve_map(api_key, base_url), indent=4), 'unicode-escape'))