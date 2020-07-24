#!/bin/bash
#
# Imports the mapbox admin ID to names collection into Mongo DB.
# Typically run this script after running boundaries.sh to generate the file to import.

readonly USAGE="Usage: $0 [-m <mongodb_connection_string>] [-f boundaries.json] [-c <collection>]"
mongodb_connection_string='mongodb://127.0.0.1:27017/covid19'
file='boundaries.json'
collection='admins'

while getopts :m:f:d:c flag
do
    case "${flag}" in
        m) mongodb_connection_string=${OPTARG};;
        d) db=${OPTARG};;
        c) collection=${OPTARG};;
        f) file=${OPTARG};;
        ?) echo $USAGE; exit 1
    esac
done

main() {
    print "Running with:\n
    [-m] MongoDB connection string: $mongodb_connection_string
    [-d] database: $db
    [-c] collection: $collection
    [-f] file: $file"
    
    mongoimport --uri=$mongodb_connection_string --collection=$collection --file=$file --drop
}

main