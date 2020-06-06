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
LOSSY_FIELDS = [
    'ID', 'province', 'geo_resolution', 'date_onset_symptoms',
    'date_admission_hospital', 'date_confirmation', 'travel_history_dates',
    'travel_history_location', 'reported_market_exposure',
    'chronic_disease_binary', 'outcome', 'location', 'admin3', 'country_new',
    'admin_id', 'travel_history_binary'
]

'''
Mappings from location shorthands to tuples of their full location data, i.e.
(city, province, country), with None when a given specificity is not present.
'''
COMMON_LOCATION_ABBREVIATIONS = {
    ('wuhan',): ('Wuhan City', 'Hubei', 'China'),
    ('wuhan', 'china'): ('Wuhan City', 'Hubei', 'China'),
    ('uk',): (None, None, 'United Kingdom'),
    ('usa',): (None, None, 'United States'),
    ('al',): (None, 'Alabama', 'United States'),
    ('ak',): (None, 'Alaska', 'United States'),
    ('as',): (None, None, 'American Samoa'),
    ('az',): (None, 'Arizona', 'United States'),
    ('ar',): (None, 'Arkansas', 'United States'),
    ('ca',): (None, 'California', 'United States'),
    ('co',): (None, 'Colorado', 'United States'),
    ('ct',): (None, 'Connecticut', 'United States'),
    ('de',): (None, 'Delaware', 'United States'),
    ('dc',): (None, 'District of Columbia', 'United States'),
    ('fm',): (None, None, 'Micronesia'),
    ('fl',): (None, 'Florida', 'United States'),
    ('ga',): (None, 'Georgia', 'United States'),
    ('ge',): (None, None, 'Georgia'),
    ('gu',): (None, None, 'Guam'),
    ('hi',): (None, 'Hawaii', 'United States'),
    ('id',): (None, 'Idaho', 'United States'),
    ('il',): (None, 'Illinois', 'United States'),
    ('in',): (None, 'Indiana', 'United States'),
    ('ia',): (None, 'Iowa', 'United States'),
    ('ks',): (None, 'Kansas', 'United States'),
    ('ky',): (None, 'Kentucky', 'United States'),
    ('la',): (None, 'Louisiana', 'United States'),
    ('me',): (None, 'Maine', 'United States'),
    ('mh',): (None, None, 'Marshall Islands'),
    ('md',): (None, 'Maryland', 'United States'),
    ('ma',): (None, 'Massachusetts', 'United States'),
    ('mi',): (None, 'Michigan', 'United States'),
    ('mn',): (None, 'Minnesota', 'United States'),
    ('ms',): (None, 'Mississippi', 'United States'),
    ('mo',): (None, 'Missouri', 'United States'),
    ('mt',): (None, 'Montana', 'United States'),
    ('ne',): (None, 'Nebraska', 'United States'),
    ('nv',): (None, 'Nevada', 'United States'),
    ('nh',): (None, 'New Hampshire', 'United States'),
    ('nj',): (None, 'New Jersey', 'United States'),
    ('nm',): (None, 'New Mexico', 'United States'),
    ('ny',): (None, 'New York', 'United States'),
    ('nc',): (None, 'North Carolina', 'United States'),
    ('nd',): (None, 'North Dakota', 'United States'),
    ('mp',): (None, None, 'Northern Mariana Islands'),
    ('oh',): (None, 'Ohio', 'United States'),
    ('ok',): (None, 'Oklahoma', 'United States'),
    ('or',): (None, 'Oregon', 'United States'),
    ('pw',): (None, None, 'Palau'),
    ('pa',): (None, 'Pennsylvania', 'United States'),
    ('pr',): (None, None, 'Puerto Rico'),
    ('ri',): (None, 'Rhode Island', 'United States'),
    ('sc',): (None, 'South Carolina', 'United States'),
    ('sd',): (None, 'South Dakota', 'United States'),
    ('tn',): (None, 'Tennessee', 'United States'),
    ('tx',): (None, 'Texas', 'United States'),
    ('ut',): (None, 'Utah', 'United States'),
    ('vt',): (None, 'Vermont', 'United States'),
    ('va',): (None, 'Virginia', 'United States'),
    ('wa',): (None, 'Washington', 'United States'),
    ('wv',): (None, 'West Virginia', 'United States'),
    ('wi',): (None, 'Wisconsin', 'United States'),
    ('wy',): (None, 'Wyoming', 'United States'),
}

''' Valid values for sex field. '''
VALID_SEXES = ['female', 'male', 'other']
