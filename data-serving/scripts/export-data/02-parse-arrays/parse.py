import csv
import json
from functools import reduce

def deep_get(dictionary, keys, default=None):
    return reduce(lambda d, key: d.get(key, default) if isinstance(d, dict) else default, keys.split("."), dictionary)

def convert_event(event):
    suffix = event['name']
    col_name = f"events.{suffix}"
    
    return ({
        f"{col_name}.value": event.get("value"),
        f"{col_name}.date.start": deep_get(event, "dateRange.start.$date"),
        f"{col_name}.date.end": deep_get(event, "dateRange.end.$date")
    })

def convert_string_list(item):
    try:
        if (type(item) != str) or (item == ''):
            return None
        if type(json.loads(item)) == list:
            return ", ".join(json.loads(item))
        else:
            return item
    except:
        print(item)
        
def process_chunk(infile, outfile=None):
    if not outfile:
        outfile = infile[:-4] + "_processed.csv"
    with open(outfile, 'w+') as g:
        with open(infile, 'r') as f:
            reader = csv.DictReader(f)
            writer = csv.DictWriter(g, fieldnames=fields, extrasaction='ignore')
            writer.writeheader()
            for row in reader:
                if "ObjectId" not in row['_id']:
                    continue
                if type(row['notes']) == str:
                    row['notes'] = row['notes'].replace('\n', ', ')
                row['notes']
                for event in json.loads(row['events']):
                    row = row | convert_event(event)
                writer.writerow(row)
    print(outfile)