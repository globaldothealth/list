# Working with line-list data

This directory contains scripts for converting, ingesting, and otherwise munging line-list data.

## Converting line-list data

`convert_data.py` is a script to convert the line-list data from its original format, a CSV, to the new MongoDB schema-compliant json format.

```console
python3 convert_data.py --infile="latestdata.csv" [--outfile="cases.json"]
```

Logs will be written to `convert_data.log`.

### Current stats

- 99.68% of rows from the CSV file convert successfully to JSON
- 100% of rows from `cases.json` validate and import successfully into mongodb

### Lossy fields

A few fields can't be converted losslessly because they need to be normalized upon insertion into the new data format. All of the original values are strings; some of the target representations are bools, ints, floats, or enums. Additionally, the new schema has validation rules and invalid values, e.g. an age over 300. When a value can't be successfully converted, the failure is logged in `convert_data.log` and the value for that field is dropped (though again, the original value is archived in the approrpiate `originalCase` field).

The following fields are lossy:

- `demographics.ageRange`: Some values are too large to be ages. Ex. row `002-23162` with age value `2073`.
- `events[name='onsetSymptoms']`: Some values are in an invalid format, ex. row `000-1-20073` with value `08.03.20202`
- `outbreakSpecifics.reportedMarketExposure`: Some values are not bools, ex. row `000-1-13167` has value `exposed to people who come back from wuhan`
- `travelHistory.location`: TODO: Finish this
- `travelHistory.dateRange`: TODO: Finish this

The following fields are *not* lossy, although they require conversion to a new type, because their data is properly normalized in the source (as of writing):

- `sex`
- `outbreakSpecifics.livesInWuhan`
- `location.geometry.latitude`, `location.geometry.longitude`
- `events[name='admissionHospital']`, `events[name='confirmed']`, `events[name='deathOrDischarge']`

### Future improvements

- Add validation logic to all dates to ensure that they are between 12/2019 and today.

- If a date fails to parse/validate in the `mm/dd/yy` format, attempt to parse it in other formats, including `dd/mm/yy`, `mm.dd.yy`, and `dd.mm.yy`.

- Take free-form text from `outbreakSpecifics.reportedMarketExposure` and add it to the notes field.

- Clean up the source data in the case of obvious errors in the logs, e.g. ages in the thousands or dates with one too many or too few digits.

- Use Sheets or GitHub history to infer `revision.date`.

- De-duplicate events populated from the original outcome field with the others; ex. in some cases we have `events[name="deathOrDischarge"]`, from the `date_death_or_discharge` field, plus `events[name="death"]` from the `outcome` field.

- Manually review `symptoms` and `chronicDisease` fields to confirm that we're supporting all possible list delimiters (currently colon and comma).

## What's included in the new schema?

### Converted fields

We are currently populating all of the new fields in the schema with data from the old, except for those whose values can't be inferred from the original data.

Fields that are being converted include:

- `chronicDisease`
- `demographics`
- `events`
- `location`
- `notes`
- `outbreakSpecifics`
- `pathogens`
- `revisionMetadata`
- `source`
- `symptoms`
- `travelHistory`

Fields that can't be converted include:

- `travelHistory.purpose`: The existing travel history fields -- `travel_history_dates`, `travel_history_location`, and `travel_history_binary` do not encompass this data (or at least not in a structured way), but we may want to include it going forward.

- `location.id`: Although the original data has a location id, we may not use the same geocoding system going forward, so these ids have been archived in the `originalCase` field but not ported to `location.id`.

- `revision.date`: The source data does not include the date on which the data was ingested (or updated). The new system will support this.

- `source.id` and `pathogens.sequenceSource.id`: Sources may have ids to link them to the new `sources` collection; it's possible that we may be able to backfill this later once that dataset is developed and we can cross-reference by URL.

### Backfilled fields

We are backfilling fields including:

- `demographics.species`: We are assuming that all reported cases have been in humans thus far, but are leaving the option open for other species in future cases.

- `revision.id` and `revision.notes`: We are treating each record as if it's on its first revision. It would be extremely labor-intensive to reconstruct revision history from the source data, but it will baked into the new system.

> **Open question:** Do we want to backfill data or leave those fields empty for imported data?

### Original fields archive

All nonempty fields from the original dataset are archived for posterity as fields of the same name in the new schema's `importedCase` document.

> **Open question:** Should those fields that are 100% losslessly converted be removed from this archive?