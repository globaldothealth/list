''' The filename of the CSV file containing the case data. '''
DATA_CSV_FILENAME = 'latestdata.csv'

''' The path to the latest data gzip in the nCoV2019 repo. '''
DATA_GZIP_FILENAME = 'latestdata.tar.gz'

''' The path to the latest data gzip in the nCoV2019 repo. '''
DATA_REPO_PATH = 'latest_data'

''' The filename of the geocoding database. '''
GEOCODER_DB_FILENAME = 'geo_admin.tsv'

''' The name of the imported geocoder module. '''
GEOCODER_MODULE = 'csv_geocoder'

''' The path to the geocoding script in the nCoV2019 repo. '''
GEOCODER_REPO_PATH = 'code/sheet_cleaner/geocoding'

# TODO(khmoran): Include 'outcome' once the curator UI transitions to using the
# new events-based outcome field.
LOSSLESS_FIELDS = [
    'additional_information', 'admin1', 'admin2', 'age', 'chronic_disease',
    'city', 'country', 'data_moderator_initials', 'date_death_or_discharge',
    'latitude', 'lives_in_Wuhan', 'longitude', 'notes_for_discussion',
    'sequence_available', 'sex', 'source', 'symptoms']

COMMON_LOCATION_ABBREVIATIONS = {
    'wuhan': 'wuhan city',
    'usa': 'united states',
    'uk': 'united kingdom',
    'al': 'alabama',
    'ak': 'alaska',
    'as': 'american samoa',
    'az': 'arizona',
    'ar': 'arkansas',
    'ca': 'california',
    'co': 'colorado',
    'ct': 'connecticut',
    'de': 'delaware',
    'dc': 'district of columbia',
    'fm': 'federated states of micronesia',
    'fl': 'florida',
    'ga': 'georgia',
    'gu': 'guam',
    'hi': 'hawaii',
    'id': 'idaho',
    'il': 'illinois',
    'in': 'indiana',
    'ia': 'iowa',
    'ks': 'kansas',
    'ky': 'kentucky',
    'la': 'louisiana',
    'me': 'maine',
    'mh': 'marshall islands',
    'md': 'maryland',
    'ma': 'massachusetts',
    'mi': 'michigan',
    'mn': 'minnesota',
    'ms': 'mississippi',
    'mo': 'missouri',
    'mt': 'montana',
    'ne': 'nebraska',
    'nv': 'nevada',
    'nh': 'new hampshire',
    'nj': 'new jersey',
    'nm': 'new mexico',
    'ny': 'new york',
    'nc': 'north carolina',
    'nd': 'north dakota',
    'mp': 'northern mariana islands',
    'oh': 'ohio',
    'ok': 'oklahoma',
    'or': 'oregon',
    'pw': 'palau',
    'pa': 'pennsylvania',
    'pr': 'puerto rico',
    'ri': 'rhode island',
    'sc': 'south carolina',
    'sd': 'south dakota',
    'tn': 'tennessee',
    'tx': 'texas',
    'ut': 'utah',
    'vt': 'vermont',
    'vi': 'virgin islands',
    'va': 'virginia',
    'wa': 'washington',
    'wv': 'west virginia',
    'wi': 'wisconsin',
    'wy': 'wyoming',
}

''' Valid values for sex field. '''
VALID_SEXES = ['female', 'male', 'other']
