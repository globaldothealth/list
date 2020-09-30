# Working with line-list data

This directory contains scripts for converting, ingesting, and otherwise munging line-list data.

## Prerequisites

Install python dependencies:

```shell
python3 -m pip install -r requirements.txt
```

## Converting line-list data

`convert_data.py` is a script to convert the line-list data from its original format, a CSV, to the new MongoDB
schema-compliant json format.

To use this script, you need to clone `https://github.com/beoutbreakprepared/nCoV2019.git` into your --ncov2019_path.

```console
git clone https://github.com/beoutbreakprepared/nCoV2019.git /path/to/nCoV2019
```

You will also need to supply a sourceId as this is a required field in the mongo DB. You should create a mongo Source (either in the mongo shell or the Portal UI) with the URL set to [this documentation](https://github.com/globaldothealth/list/blob/main/data-serving/scripts/convert-data#converting-line-list-data), then grab the sourceId and add it to your command. The documentation link will be the main sourceURL for all of the cases and their actual source will be in additionalSources. This was done so that the table of automated ingestion sources is not cluttered with non-automated ingestion sources.

If you wish to convert [all spreadsheets data](https://github.com/beoutbreakprepared/nCoV2019/tree/master/latest_data), you can run the following

```console
python3 convert_data.py --ncov2019_path=/path/to/nCoV2019 --source_id=<sourceID> --outfile=cases.json [--sample_rate=.1]
```

If you wish to convert your own csv in the spreadsheets format (e.g. a specific subset of the spreadsheets data),
add the --filename argument.

```console
python3 convert_data.py --ncov2019_path=/path/to/nCoV2019 --filename=my_data.csv --source_id=<sourceID> --outfile=cases.json [--sample_rate=.1]
```

Errors will be written to `conversion_errors.tsv`.

### Current stats

- 99.8% of rows from the CSV file convert entirely successfully to JSON. For those with errors, only the failed fields
  are omitted.
- 100% of rows from `cases.json` validate and import successfully into mongodb.

### Lossy fields

A few fields can't be converted losslessly because they need to be normalized upon insertion into the new data format.
All of the original values are strings; some of the target representations are bools, ints, floats, or enums.
Additionally, the new schema has validation rules and invalid values, e.g. an age over 300. When a value can't be
successfully converted, the failure is logged in `conversion_errors.tsv` and the value for that field is dropped (though
again, the original value is archived in the appropriate `originalCase` field).

The following fields are lossy:

- `demographics.ageRange`: Some values are too large to be ages. Ex. row `002-23162` with age value `2073`.
- `events[name='onsetSymptoms']`: Some values are in an invalid format, ex. row `000-1-20073` with value `08.03.20202`
- `travelHistory.location`: This field is highly unstructured, and includes lists of locations, free-form text, and
  locations of all (unmarked) granularity.
- `travelHistory.dateRange`: As with `events[name='onsetSymptoms']`, the date format varies.
- `location.geoResolution`: Some values don't match the enum values.

> **Open question:** How much effort should be put into converting these fields? What are the requirements and use cases
> for the line-list data?

> **Open question:** Where on the ROC curve do we want to be? Are we optimizing for precision or recall?

The following fields are *not* lossy, although they require conversion to a new type:

- `gender`
- `location.geometry.latitude`, `location.geometry.longitude`
- `events[name='admissionHospital']`, `events[name='confirmed']`, `events[name='deathOrDischarge']`

### Future improvements

- Add validation logic to all dates to ensure that they are between 12/2019 and today.

- If a date fails to parse/validate in the `mm/dd/yy` format, attempt to parse it in other formats, including
  `dd/mm/yy`, `mm.dd.yy`, and `dd.mm.yy`.

- Clean up the source data in the case of obvious errors in the logs, e.g. ages in the thousands or dates with one too
  many or too few digits.

- Use Sheets or GitHub history to infer `revisionMetadata.date`.

- De-duplicate events populated from the original outcome field with the others; ex. in some cases we have
  `events[name="deathOrDischarge"]`, from the `date_death_or_discharge` field, plus `events[name="death"]`
  from the `outcome` field.

- Manually review `symptoms` and `preexistingConditions` fields to confirm that we're supporting all possible list
  delimiters (currently colon and comma).

## What's included in the new schema?

### Converted fields

We are currently populating all of the new fields in the schema with data from the old, except for those whose values
can't be inferred from the original data.

Fields that are being converted include:

- `preexistingConditions`
- `demographics`
- `events`
- `location`
- `notes`
- `revisionMetadata`
- `source`
- `symptoms`
- `travelHistory`

### Archived fields

Some fields can't or should not be carried over into the new schema, but will be archived under an `importedCase` field,
including:

- Fields that were relevant early on in the outbreak, but aren't tracked any longer: `lives_in_Wuhan`,
  `reported_market_exposure`

- Fields supplanted by new values: `ID`

- Non-normalized or redundant location fields, including `city`, `province`, `country`
  
- Fields whose values can be imputed from other fields: `chronic_disease_binary`, `travel_history_binary`

### Backfilled fields

We are backfilling fields including:

- `revisionMetadata.revisionNumber`: We are treating each record as if it's on its first revision. It would be extremely
  labor-intensive to reconstruct revision history from the source data, but it will baked into the new system.

### Fields absent in the original data

Some fields in the new schema cannot be converted because they are not present in the original data, including:

- `demographics.occupation`
- `demographics.nationality`
- `demographics.ethnicity`
- `pathogens`
- `revision.notes`
- `revision.date`
- `source.id`
- `travelHistory.purpose`

### Original fields archive

All nonempty fields from the original dataset are archived for posterity as fields of the same name in the new schema's
`importedCase` document.