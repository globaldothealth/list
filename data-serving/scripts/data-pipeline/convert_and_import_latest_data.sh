#!/bin/bash
#
# Executes a pipeline to fetch the latest line-list data, convert it into the
# MongoDB schema format, and import it into the MongoDD database.

readonly USAGE="Usage: $0 [-m <mongodb_connection_string>] [-d <database>] [-c <collection>] [-r <sample_rate>] [-s <schema_path>]"
readonly SCRIPT_PATH="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly NCOV2019_REPO_PATH='/tmp/nCoV2019'
readonly CONVERTED_DATA_PATH='cases.json'

mongodb_connection_string='mongodb://127.0.0.1:27017'
db='covid19'
collection='cases'
sample_rate=1
schema_path="$SCRIPT_PATH/../../data-service/schemas/cases.schema.json"
index_path="$SCRIPT_PATH/../../data-service/schemas/cases.index.json"

while getopts :m:d:c:r:s flag
do
    case "${flag}" in
        m) mongodb_connection_string=${OPTARG};;
        d) db=${OPTARG};;
        c) collection=${OPTARG};;
        r) sample_rate=${OPTARG};;
        s) schema_path=${OPTARG};;
        i) index_path=${OPTARG};;
        ?) echo $USAGE; exit 1
    esac
done

function print() {
    echo -e "\n---------------\n$1\n---------------\n"
}

function fetch_latest_data() {
    # Check out the repo with the latest data archive and the geocoding script.
    if [ -d $NCOV2019_REPO_PATH ]; then 
        print "CoV2019 repo already exists at $NCOV2019_REPO_PATH; updating"
        (cd $NCOV2019_REPO_PATH;
         git checkout main &> /dev/null;
         git fetch origin;
         git reset --hard origin/main)
    else
        print "Cloning nCoV2019 repo to $NCOV2019_REPO_PATH"
        git clone https://github.com/beoutbreakprepared/nCoV2019.git \
            -- $NCOV2019_REPO_PATH
    fi
}

function convert_data() {
    print 'Converting the latest data archive to the MongoDB schema'
    python3 $SCRIPT_PATH/../convert-data/convert_data.py \
        --outfile=$CONVERTED_DATA_PATH \
        --ncov2019_path=$NCOV2019_REPO_PATH \
        --sample_rate=$sample_rate

    if [ ! -f $CONVERTED_DATA_PATH ]; then
        err 'Data conversion failed'
        exit 1
    fi
}

function setup_db() {
    print 'Preparing the database for the new import'
    CONN=$mongodb_connection_string \
        DB=$db \
        COLL=$collection \
        SCHEMA=$schema_path \
        INDEX=$index_path \
        npm run --prefix $SCRIPT_PATH/../setup-db setup
}

function import_data() {
    print 'Importing data'
    mongoimport \
        --collection $collection \
        --file $CONVERTED_DATA_PATH \
        --jsonArray \
        --uri="$mongodb_connection_string"
}

function cleanup() {
    rm -rf $NCOV2019_REPO_PATH
    rm $CONVERTED_DATA_PATH
}

# Establish run order
main() {
    print "Running with:\n
    [-m] MongoDB connection string: $mongodb_connection_string
    [-d] database: $db
    [-c] collection: $collection
    [-r] sample rate: $sample_rate
    [-s] schema path: $schema_path
    [-i] index path: $index_path"

    fetch_latest_data
    convert_data
    setup_db
    import_data
    cleanup

    print 'Fin!'
}

main
