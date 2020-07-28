#!/bin/bash
#
# Imports the mapbox admin ID to names collection into Mongo DB.
# Typically run this script after running boundaries.sh to generate the file to import.

readonly USAGE="Usage: $0 [-m <mongodb_connection_string>] [-f <boundaries.json file to import>]"
mongodb_connection_string='mongodb://127.0.0.1:27017/covid19'
file='boundaries.json'

while getopts :m:f flag
do
    case "${flag}" in
        m) mongodb_connection_string=${OPTARG};;
        f) file=${OPTARG};;
        ?) echo $USAGE; exit 1
    esac
done

main() {
    echo -e "Running with:\n
    [-m] MongoDB connection string: $mongodb_connection_string
    [-f] file: $file"
    
    mongoimport --uri=$mongodb_connection_string --collection=admins --file=$file --drop
}

main