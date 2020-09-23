#!/bin/bash
#
# Converts boundaries files provided by Mapbox into files optimized for serving.
# Will output a single file named boundaries.json that can be used as a config
# map in a kubernetes cluster and that the curator service can load to serve
# administrative boundaries during geocoding.
# In that file each line is a JSON object like {"id": "id of boundary", "name": "name of boundary"}.
# If you are wondering how to get your hands on the boundaries-adm*-v3.json files, you have
# to contact mapbox sales people and they will send those to you once you register
# for the boundaries API.

readonly USAGE="usage: $0 /path/to/boundaries-adm1-v3.json /path/to/boundaries-adm2-v3.json boundaries-adm3-v3.json"
readonly SCRIPT_PATH="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$#" -ne 3 ]; then
    echo "Illegal number of parameters: $USAGE"
    exit 1
fi

echo -e "Running with:\n
Admin 1 file: $1
Admin 2 file: $2
Admin 3 file: $3"

# Generate one JSON object per line and append the result to the final file.
# Some entries have an English name which we will prefer.
cat $1 | jq -c '.adm1.data.all | to_entries[] | {id: .key, name: (.value.name_en // .value.name) }' > ${SCRIPT_PATH}/boundaries.json
cat $2 | jq -c '.adm2.data.all | to_entries[] | {id: .key, name: (.value.name_en // .value.name) }' >> ${SCRIPT_PATH}/boundaries.json
cat $3 | jq -c '.adm3.data.all | to_entries[] | {id: .key, name: (.value.name_en // .value.name) }' >> ${SCRIPT_PATH}/boundaries.json

echo -e 'Fin!'
