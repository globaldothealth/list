#!/bin/bash
#
# Exports MongoDB data to a csv or json file.

readonly USAGE="Usage: $0 [-m <mongodb_connection_string>] [-c <collection>] [-o <csv|json>] [-f <field_filepath>]"
readonly SCRIPT_PATH="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mongodb_connection_string='mongodb://127.0.0.1:27017/covid19'
collection='cases'
output_format='csv'
field_filepath=$SCRIPT_PATH/case_fields.txt

while getopts :m:c:o:f flag
do
    case "${flag}" in
        m) mongodb_connection_string=${OPTARG};;
        c) collection=${OPTARG};;
        o) output_format=${OPTARG};;
        f) field_filepath=${OPTARG};;
        ?) echo $USAGE; exit 1
    esac
done

function print() {
    echo -e "\n---------------\n$1\n---------------\n"
}

# Note that for CSVs, `mongoexport` can read the fields file -- but it can't do
# that for JSON, so we just read it into the `fields` argument that both formats
# support.
function read_fields() {
    fields=""
    while read field; 
    do 
        if [[ -z $fields ]]; then
            fields="$field"
        else
            fields="$fields,$field"
        fi
    done < $field_filepath
}

function export_data() {
    output_file="$collection.$output_format"
    print "Exporting data to $output_file"

    mongoexport \
        --uri="$mongodb_connection_string" \
        --collection="$collection" \
        --fields="$fields" \
        --type="$output_format" \
        --out="$output_file" \
        --jsonArray
}

# Establish run order
main() {
    print "Running with:\n
    [-m] MongoDB connection string: $mongodb_connection_string
    [-c] collection: $collection
    [-o] format: $output_format
    [-f] fields fieldpath: $field_filepath"

    read_fields
    export_data

    print 'Fin!'
}

main
