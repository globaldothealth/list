''' Valid values for sex field. '''
VALID_SEXES = ['female', 'male', 'other']

# TODO(khmoran): Include 'outcome' once the curator UI transitions to using the
# new events-based outcome field.
LOSSLESS_FIELDS = [
    'additional_information', 'admin1', 'admin2', 'age', 'chronic_disease',
    'city', 'country', 'data_moderator_initials', 'date_death_or_discharge',
    'latitude', 'lives_in_Wuhan', 'longitude', 'notes_for_discussion',
    'sequence_available', 'sex', 'source', 'symptoms']

LOCATIONS = {
    'wuhan': {
        'country': 'China',
        'administrativeAreaLevel1': 'Hubei',
        'administrativeAreaLevel2': 'Wuhan City',
        'locality': 'Wuhan City',
        'geometry': {
            'latitude': 30.62506,
            'longitude': 114.3421
        }
    },
    'iran': {
        'country': 'Iran',
        'geometry': {
            'latitude': 32.427908,
            'longitude': 53.688046
        },
    }
}
