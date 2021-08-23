# Retrieve geocodes for Admin1 and Admin2 from OSM
import re
import json
import time
import pycountry
from urllib.parse import urlencode
from pathlib import Path
from pprint import pprint

import requests

OSM = "https://nominatim.openstreetmap.org/search?"
CZ = pycountry.subdivisions.get(country_code="CZ")

Path("geo").mkdir(exist_ok=True)


def get_geocode(place):
    query = urlencode(
        {
            "q": f"{place}, Czechia",
            "format": "geojson",
            "countrycodes": "cz",
            "limit": 1,
        }
    )
    r = requests.get(f"{OSM}{query}")
    j = r.json()
    pprint(j)
    try:
        lon, lat = r.json()["features"][0]["geometry"]["coordinates"]
    except (ValueError, KeyError, IndexError):
        return None
    return {"latitude": lat, "longitude": lon}


parent = {s.code: s.parent_code for s in CZ}
name = {s.code: s.name for s in CZ}

for s in CZ:
    fn = Path("geo") / (s.code + ".json")
    _type = s.type
    L = {}
    if fn.exists():
        print("skip", fn, s.name)
        continue
    print(s.code, s.name)
    n = s.name if s.type != "capital city" else "Praha"
    # Match Praha districts to Praha
    if re.match(r"Praha \d{1,2}$", n):
        n = "Praha"
    L[s.code] = {
        "name": n,
        "country": "Czech Republic",
        "geoResolution": "Admin2" if _type == "district" else "Admin1",
        "geometry": get_geocode(n),
    }
    if L[s.code]["geometry"] is None:
        continue
    if s.type == "district":
        L[s.code]["administrativeAreaLevel2"] = s.name
        L[s.code]["administrativeAreaLevel1"] = name[parent[s.code]]
    else:
        L[s.code]["administrativeAreaLevel1"] = s.name
    (Path("geo") / (s.code + ".json")).write_text(json.dumps(L, indent=2))
    print("  ok", fn, s.name)
    time.sleep(3)  # requests should be limited to 1/second

L = {}
geos = list(Path("geo").glob("*.json"))
if len(CZ) == len(geos):
    for i in geos:
        with i.open() as f:
            d = json.load(f)
            k = next(iter(d.keys()))
            if isinstance(d[k]["name"], list):
                d[k]["name"] = d[k]["name"][0]
            L.update(d)
    geocode_txt = json.dumps(L, indent=2, sort_keys=True, ensure_ascii=False)
    for i in geocode_txt.split("\n"):
        print("G:", i)
    print("| grep ^G: | cut -c 4- to get JSON output")
else:
    print("Missing certain geocodes, run script again")
