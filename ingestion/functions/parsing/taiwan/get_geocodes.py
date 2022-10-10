# Retrieve geocodes for Admin1 from OSM
import json
import time
from urllib.parse import urlencode

import requests

OSM = "https://nominatim.openstreetmap.org/search?"

_LOCATIONS = [
    "空值",
    "金門縣",
    "新北市",
    "基隆市",
    "新竹市",
    "花蓮縣",
    "高雄市",
    "南投縣",
    "台中市",
    "雲林縣",
    "苗栗縣",
    "桃園市",
    "屏東縣",
    "連江縣",
    "嘉義縣",
    "嘉義市",
    "宜蘭縣",
    "澎湖縣",
    "台南市",
    "新竹縣",
    "台北市",
    "彰化縣",
    "台東縣",
]


def get_geocode(place):
    query = urlencode(
        {
            "q": f"{place}, Taiwan",
            "format": "geojson",
            "countrycodes": "tw",
            "limit": 1,
            "namedetails": 1,
        }
    )
    r = requests.get(f"{OSM}{query}")
    j = r.json()
    try:
        lon, lat = j["features"][0]["geometry"]["coordinates"]
    except (ValueError, KeyError, IndexError):
        return None
    namedetails = j["features"][0]["properties"]["namedetails"]
    # Try to fetch en version of name
    name = namedetails.get("name:en", None) or namedetails.get("name")
    time.sleep(3)
    return {
        "name": name,
        "geoResolution": "Admin1",
        "administrativeAreaLevel1": name,
        "geometry": {"latitude": lat, "longitude": lon},
        "country": "Taiwan",
    }


print(
    json.dumps(
        {s: get_geocode(s) for s in _LOCATIONS},
        indent=2,
        sort_keys=True,
        ensure_ascii=False,
    )
)
