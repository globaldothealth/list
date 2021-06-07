# Ingestion functions

## Overview

This directory contains the parsing functions
used in the Global.health ingestion system.

The objective of the ingestion system is to facilitate a semi-automated
workflow accomplishing the retrieval of epidemiological source data, the
parsing thereof to the standard Global Health data format, and the persisting
of both raw content and parsed case records for use by the Global Health
community. For more information on Global Health, refer to the
[top-level README](https://github.com/globaldothealth/list/blob/main/README.md).

The structure of ingestion is roughly as shown below:

![System diagram](./assets/system.svg)

At a high-level:

1. **Actuation** is done by an AWS EventBridge Events Scheduled Rule (one for
each source). The scheduled rule is defined, alongside the remainder of source
configuration, via the Global Health
[curator UI](../../verification/curator-service/ui/)
sources page.
2. **Retrieval** is performed by a combined
 [retrieval and parsing function](./retrieval/retrieval.py),
which downloads (b) and persists (c) data in accordance with the source
configuration, retrieved from the
[curator API](../../verification/curator-service/api/)
(a). The retrieval function uses the curator API to fetch which parser submodule to call.

   **Parsing** is performed by custom, per-source
[parsing functions](./parsing/) that are called from the retrieval function, and convert of raw source
content stored in S3 to the Global Health format. Converted data is written to the
central [data service](../../data-serving/data-service/) (for now, proxied via
the curator API, which offers an exposed, authenticated endpoint).

**Note**: In the previous architecture using AWS Lambda, parsing and retrieval ran in different process, now they have been combined into one.

## Development

### tl;dr

Ingestion functions are managed, developed, and deployed using AWS
Batch. See set up instructions and
common commands, below.

If you are using Visual Studio Code (VSCode) you can find [common settings](https://github.com/globaldothealth/list/blob/main/dev/.vscode/settings.json) around linting/style. The [CI pipeline](https://github.com/globaldothealth/list/blob/main/.github/workflows/ingestion-functions-python.yml) runs flake8 so make sure you at least have this running in your editor.

You can find more information on linting in VSCode [here](https://code.visualstudio.com/docs/python/linting).

### Setup for folks without AWS access

Local end-to-end (e2e) testing without AWS access is currently a work-in-progress. You should still be able to write parsers and test locally the components that don't require access to the curator API.

### One-time setup for people with AWS access

#### Prerequisites

1. Install the [AWS CLI](https://aws.amazon.com/cli/). You can also install it using your favourite package manager:

|OS               |Command|
|-----------------|----------------------------------------------|
|Windows          |`winget install -e --id Amazon.AWSCLI`        |
|macOS            |`brew install awscli`                         |
|Debian, Ubuntu   |`sudo apt install awscli`                     |
|Fedora, RHEL     |`sudo dnf install awscli`                     |

Note that some of these repositories may be carrying v1 of AWS CLI, compared to the current stable v2. Our workflows are currently compatible with both v1 and v2, so this shouldn't be an issue.
1. Run `aws configure` to set AWS credentials
1. Have Python 3.8 installed on your machine. To check what versions you have
installed, and to see which versions correspond to the `python` and `python3`
commands, run the following:

```shell
ls -l /usr/bin/python*
```

#### Setup
1. Setup and enter a virtual environment in `ingestion/functions`

       python3.8 -m venv venv
       source venv/bin/activate
  
1. For each function you're planning to work with, be sure you have required
modules installed, e.g. via:

```shell
# In each parsing's subdir:
python3.8 -m pip install -r requirements.txt
# In the /ingestion/functions (necessary to run unit tests).
python3.8 -m pip install -r requirements.txt
```

*NB:* Be sure you're using Python 3.8, which corresponds to the runtime of the job definitions run using Batch.

#### Manual ingestion

You should be able to run ingestion using the curator UI. This exists as
a fallback if the UI triggers for ingestion are not working.

1. You'll need AWS access, follow the steps in the previous section.
2. Once you've got AWS setup, run the following in `ingestion/functions` after switching
   to the virtualenv:

       source venv/bin/activate
       python aws.py jobdefs

   This should show existing **job definitions**. Job definitions are templates that
   tell AWS Batch which parser to run and in which environment (dev or prod). If this
   command doesn't work, contact the engineering team to setup access.

3. Check if the ingestion you want to run already has an associated job definition
   corresponding to the environment you want to run in:
   `python aws.py jobdefs | grep colombia.*prod` to search for Colombia ingestion
   in prod, which gives

       ACTIVE colombia-colombia-ingestor-prod

4. If step 3 shows that a job definition is available, you can **submit** a job:

       python aws.py submit colombia-colombia-ingestor-prod

   Check the submit help options `python aws.py submit --help`. The most common
   options to use are `-t` (or `--timeout)` to specify the maximum number of *minutes*
   the ingestion is allowed to run. The default is 60 minutes, which is fine for
   daily ingestion, but might not be enough time to run a backfill.

   To run a **backfill**, use the `-s` (`--start-date`) and `-e` (`--end-date`)
   flags to delimit the backfill duration. You can now skip to step 6.

5. If there's no existing job definition for a source, you'll need to **register** one.
   Registration creates a new job definition which can be used to submit jobs.

   First, add the parser to the source in the curator UI. The parser must be named
   as follows: `<subfolder>-<parser>-ingestor-<env>`. So for example, if you wanted
   to add a job definition corresponding to the parser `parsing/peru/peru.py` in
   the *dev* instance, you would put this as the parser `peru-peru-ingestor-dev`.
   Then, run the following:

       python aws.py register -e prod|dev <source_id> <parser>

   Here `<parser>` has to be of the form `subfolder.parser` such as `peru.peru` under
   the parsing folder. This will check that the parser corresponds to that in the
   curator UI, and create the job definition. You can then submit a job.

6. Once your job has been submitted, you can view its logs through the Cloudwatch
   AWS portal. The logs are stored in the `/aws/batch/job` log group. Once the job
   is finished, the status of the upload will also be updated in the curator UI.

### Writing and editing functions

For the most part, writing functions is writing standard Python business logic. Each parsing function has a boilerplate code at the end which allows it to be invoked from retrieval with an JSON object describing the parameters for the parsing function:

```python
def event_handler(event):
    return parsing_lib.run(event, parse_cases)

if __name__ == "__main__":
    with open('input_event.json') as f:
        event = json.load(f)
        event_handler(event)
```

You are free to write the parsers however you like. Use the existing functions as a template to get started.

### Writing a parser

You can find an example minimal parser in the [parsing/example](/ingestion/functions/parsing/example/README.md) directory, let's look at its structure:

```shell
$ tree parsing/example
parsing/example
├── README.md        # You can document your parser if you want.
├── __init__.py      # Required to make this a proper python package, usually empty.
├── example.py       # Write your parsing code here.
├── example_test.py  # Always add unit tests.
├── input_event.json # AWS EventBridge event used when testing locally, will be described below.
├── requirements.txt # Any special third-party dependency that your parser requires, this file is required even if it's empty.
└── sample_data.csv  # Some sample data used in unit tests, usually copied verbatim from a real source.
```

At a minimum, a parser must generate a list of cases that conform to the openAPI
specifications. If you have a local stack running, go to the [OpenAPI UI](http://localhost:3001/api-docs) to check the structure of a `Case` object. Otherwise you can always [check it online](https://data.covid-19.global.health/api-docs/) as well.

A minimal case looks like this:

```text
{
    "caseReference": {
        "sourceId": "5ea86423bae6982635d2e1f8",
        "sourceUrl": "cdc.gov"
    },
    "events": [
        {
            "name": "confirmed",
            "dateRange": {
                "start": "04/27/2020Z",
                "end": "04/27/2020Z"
            }
        }
    ],
    "location": {
        "query": "Canada",
    },
}
```

Its main function (usually called `parse_cases`) must yield cases one by one using [python generators](https://wiki.python.org/moin/Generators). A common library will take care of sending those cases to the server for you in batches.

For geocoding, the parser can either hardcode a location with a `name`, `geoResolution` and `geometry.latitude`, `geometry.longitude` included, in which case no geocoding will be attempted on the server.
If it doesn't have that information it can simply output a `location.query` which will get geocoded by the server. If geocodes are to be restricted to a certain administrative area level, one can pass the `location.limitToResolution`. Details about those parameters are in the OpenAPI spec for the `NewCase` schema definition.

Example of a location which will not trigger geocoding on the server:

```json
{
   "country": "Switzerland",
   "administrativeAreaLevel1": "Zurich",
   "geoResolution": "Admin1",
   "name": "Zurich canton",
   "geometry": {
         "longitude": "8.651071",
         "latitude": "47.42568",
   }
}
```

Example if a minimal location which will trigger geocoding:

```json
{
   "query": "Quebec, Canada"
}
```

Example of a location which will trigger geocoding with restricted results:

```json
{
   "query": "Quebec, Canada",
   "limitToResolution": "Admin1,Country"
}
```

Travel history locations can be geocoded in the same way, travel history should only contain travels prior to the case's location.

Prefer sending queries that go from smallest to biggest regions as mapbox can get confused by the former and geocode to a totally different country that the one you were expecting.

Fields and nested structs should be preferably not set (or set to `None`) rather than set to an empty value (for example unknown age shouldn't be set to `''` and unknown demographics altogether shouldn't be set to `{}`).

#### Unit tests

Unit testing is mostly standard `pytest`, with a caveat to be sure that tests
are run with the correct Python version. E.g.,

```shell
python3.8 -m pytest test/my_test.py
```

#### Integration and End-to-end tests

Testing beyond unit level happens inside of a docker-compose stack.

To run, [install Docker](https://docs.docker.com/get-docker/), and then run

```shell
./test_docker.sh
```

#### Manual local run

Local e2e testing is currently not available.

You can test in the live dev environment. To do this, first switch to the virtual environment in `ingestion/functions`, and then run the following to start a retrieval.

    EPID_INGESTION_ENV=dev EPID_INGESTION_SOURCE_ID=source_id python retrieval/retrieval.py

where you use the source ID corresponding to your parser that has been configured in [dev-data](https://dev-data.covid-19.global.health).

#### Debugging of parsers

When a parser is running locally via `sam local invoke`, you can access its container by listing the current docker containers with `docker container ps` and then you can inspect the container you want using its ID. This allows you to see which environment variables are set and is useful to debug potential memory exceeded errors or dangling parsers that are waiting to timeout for some obscure reason. Some useful debugging commands include `docker logs <container id>`, `docker container inspect <container id>` and `docker container stats <container id>`.

For live parsers, you can look in the [AWS console](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions) directly, all `print()` calls are logged to CloudWatch which is useful for debugging.

Example live debugging workflow:

1. [Check the Curator portal for errors](https://data.covid-19.global.health/uploads). In this example, I'll use the error in the Mexico parser from 2020-10-20.
2. Use the AWS console to find the logs. I'm doing this in the command line, so `aws logs describe-log-groups` shows the log groups. Only one of them has "Mexico" in the name, so that's the one I want.
3. `aws logs describe-log-streams --log-group-name {GROUP_NAME}` shows me the log stream names, conveniently ordered by date as it's the latest (the last in the list) that I want. They also are named after the date, if you're searching for a particular run.
4. `aws logs get-log-events --log-group-name {GROUP_NAME} --log-stream-name '{STREAM_NAME}'` shows the log events. Notice that the stream name is in single quotes to avoid shell expansion of its name.
5. Read the logs, identify the error.
6. Fix the error.
7. Submit pull request.

Steps 5-6 may take longer than indicated.

#### Debugging of retrieval function

If the ingestion process is not running as intended, but the previous steps reveal no clear issues with the parsing logic, or there are no logs present at all, the issue might be located upstream in the retrieval function.

The best place to start in this case is with the CloudWatch logs, which should provide some hints in the case that the retrieval function was invoked but did not complete as intended.

However, there is the possibility that a misconfiguration might prevent retrieval from even initiating, and that on top of that it might fail silently. In this more frustrating case, the only clue that something is wrong might be the sudden lack of invocations/logs.

To debug these cases, you can try replicating the retrieval run on dev (or even prod, if the problem can't be replicated in dev, and you wouldn't mind running the parser on production). To do so follow the steps above in the section on running locally.

Another cause of errors could be that code changes are not being pushed to the Amazon ECR registry, which is used to run retrieval.

### Deployment

Deployment is accomplished automatically via a dedicated
[GitHub action](../../.github/workflows/ingestion-python-deploy.yml).

Setup of new parsers and the associated job definitions and EventBridge rules are still manual.

### Writing a parser where deduplication of patients cannot be done

Some sources do not provide a unique ID for each case allowing us to update existing cases in subsequent parsing runs.

To accomodate for that, here is the procedure to write a parser that only imports data that is three days old (a reasonable threshold chosen arbitrarily, feel free to tune it according to your source's freshness):

1. Write the parser, it must produces all cases for its input source, the `parsing/common/parsing_lib.py` library will ensure no duplicates are entered if you follow the next steps
2. To set up your parser for ingestion, edit your source in the curator portal UI: set the date filter to only fetch data up to 3 days ago
3. Run the parser once to import all the data up to 3 days before today
4. Edit the source again to only fetch data from exactly 3 days ago
5. Set the AWS Schedule Expression for your source and have the parser run every day

That parser will now import a day worth of data with a lag of 3 days, this delay is deemed is acceptable given the inability to dedupe cases.

### Handling sources with unstable URLs

If a source has a time-based URL scheme you can use the following date formatting directives in the source URL and those will be automatically applied when retrieving the source content:

- `$FULLYEAR` is replaced with the 4 digits current year.
- `$FULLMONTH` is replaced with the 2 digits current month.
- `$FULLDAY` is replaced with the 2 digits current day of the month.
- `$MONTH` is replaced with the 1 or 2 digits current month.
- `$DAY` is replaced with the 1 or 2 digits current day of the month.

For example if a source publishes its data every day at a URL like `https://source.com/data/year-month-day.json` you can set the source URL to `https://source.com/data/$FULLYEAR-$FULLMONTH-$FULLDAY.json` and it will fetch the URL `https://source.com/data/2020-04-20.json` on the 4th of April 2020.

### Compressed sources

Some sources are provided as [zip files](https://en.wikipedia.org/wiki/Zip_(file_format)). Those are supported by the retrieval function assuming it contains a single file in the archive containing the line list data, it will extract that single file and the parsing functions will have access to it so you can write a parser without caring about the zip file at all.

If you need other archive or compression formats supported please [file an issue in this repository](https://github.com/globaldothealth/list/issues/new?assignees=&labels=Importer&template=feature_request.md&title=Additional%20compression%20support) indicating the type of support needed, thank you.

### Encoding of sources

When the retrieval function stores the contents of a source in S3, the data is automatically encoded in utf-8 so that parsers do not have to care about which
encoding to use when reading the files.

## Parsers

You can find a list of issues/FR for parsers using the [importer tag](https://github.com/globaldothealth/list/issues?q=is%3Aopen+is%3Aissue+label%3AImporter).

Here is an overview of parsers written so far and some details about the data they collect.

_Please update this table with new parsers, or pertinent changes._

| Parser                      | Code                                                                                                 | UUID/Deduping | Remarks                                                                                                                                                                                                                                                                                             | FR   |
|-----------------------------|------------------------------------------------------------------------------------------------------|---------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|
| India                       | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/india)          |       Y       | Only processes line list style data from this source. There's bulk "state of the world" data published with current values (e.g. number currently hospitalized on a given date), but it's purely aggregate/can't be disaggregated to our format..                                                   | #563 |
| Switzerland (Zurich canton) | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/ch_zurich)      |       N       | Only imports confirmed cases, not confirmed deaths as we can't link one to the other (no unique patient ID provided). Granularity for cases is weekly, not daily so we use the first day of the given week arbitrarily.                                                                             | #483 |
| Thailand                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/thailand)           |       Y       |                                                                                                                                                                                                                                                                                                     | #516 |
| Hong Kong                   | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/hongkong)       |       Y       |                                                                                                                                                                                                                                                                                                     | #518 |
| Japan                       | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/japan)          |       Y       |                                                                                                                                                                                                                                                                                                     | #481 |
| Estonia                     | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/estonia)        |       Y       |                                                                                                                                                                                                                                                                                                     | #502 |
| Amapa, Brazil               | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_amapa)   |       N       | There are two files in the source for Amapa, one for confirmed cases and one for confirmed deaths; some of these cases may also be deaths but without patient IDs we are unable to confirm.                                                                                                         | #495 |
| Paraiba, Brazil             | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_paraiba) |       Y       |                                                                                                                                                                                                                                                                                                     | #499 |
| Peru                        | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/peru)           |       Y       | Assuming PR = prueba rapida (rapid serological test) and PCR = PCR test                                                                                                                                                                                                                             | #484 |
| Taiwan                      | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/taiwan)         |       N       |                                                                                                                                                                                                                                                                                                     | #517 |
| Colombia                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/colombia)       |       Y       | Assuming the date confirmed is the date of diagnosis (Fecha diagnostico) rather than Fecha de notificación (generally several days earlier). When date of diagnosis, using date reported online as proxy. Tipo recuperación refers to how they decided the patient had recovered: either by 21 days elapsing since symptoms, or a negative PCR/antigen test. No dates for travel history, only distinction is between cases of type: 'Importado' vs. 'Relacionado'. | #504 |
| Germany                     | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/germany)        |       N       |                                                                                                                                                                                                                                                                                                     | #482 |
| Distrito Federal, Brazil    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_distrito_federal) | N    |                                                                                                                                                                                                                                                                                                     | #498 |
| Argentina                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/argentina)       |       Y       | We are currently only incorporating cases classified ('clasificacion_resumen') as 'Confirmed'. However, 970k out of 1.5M cases are listed as 'Discarded', even though many have data values resembling confirmed Covid-19 patients, eg date_of_diagnosis, ICU_admission, mechanical breathing assistance. Future versions may want to modify this behaviour. For cases classified as Confirmed but lacking a Date of Diagnosis, we use Date of Symptom onset where present, and Date of Case Opening where neither Date of Diagnosis or Date of Symptom Onset are present. For case location, we use the residential address of the patient, as this gives more detailed location information (to department level) than 'carga_provincia_nombre' (== location where test was carried out, given to province level).| #508 |
| Goias, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_goias)       |       N       |                                                                                                                                                                                                                                                                                                     | #489 |
| Cuba                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/cuba)       |       Y       | Nationality of case is provided in two letter country codes, so using pycountry package to parse these. The field 'posible_procedencia_contagio' is generally populated by two letter country codes. Case is assumed to have travelled from one of these countries in last 30 days if populated. Diagnostic centre and treatment hospital are both included in notes for now, could be geocoded in future. Currently no parsing of symptoms, as field is always left empty - worth rechecking this in future in case this field becomes populated. No disease outcome data is provided either.| #513 |
| Mexico                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/mexico)       |       N       | | #480 |
| Rio Grande do Sul, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/riograndedosul)       |       N       | | #490 |
| Sao Paolo, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/saopaolo)       |       N       |Some caveats: 1. There are no patient ID/case ID in the raw API so we aren't able to dedupe. 2. We can't link confirmed cases and confirmed deaths because of (1) so we're only importing confirmed cases and ignoring deaths. | #497 |
| USA                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/USA)       |       N       | | #1349 |
| Acre, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_acre)       |       N       || #494 |
| Ceara, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_ceara)       |       Y       || #491 |
| Espirito Santo, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_espirito_santo)       |       N       || #492 |
| Para, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_para)       |       Y       || #500 |
| Rio de Janeiro, Brazil                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/brazil_rio_de_janeiro)       |       N       |Only include cases which include a 'dt_evento' as confirmed date field. This loses ~400 cases out of 350k. Using residential municipality ('municipio_res') as case location, as its the only location field other than 'bairro' (neighborhood), which is missing in ~2/5 cases and cannot be easily geocoded with mapbox.| #501 |
| Canada                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/canada)       |       Y       || #485 |
| Czechia                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/czechia)       |       N       || #507 |
| Paraguay                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/paraguay)       |       Y       || #514 |
| South Africa                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/south_africa)       |       Y       |Please note that this data was last updated in May 2020. This parser only deals with the columns where there was any data at the time of writing. Several columns with potentially useful information (e.g. date_onset_symptoms) are unpopulated for all cases. Would be worth keeping an eye on the data to see whether (a) it starts getting updated again and (b) whether this will lead to any new information provided at which point the parser will need to be expanded to deal with this.| #487 |
| United States                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/USA)       |       N       || #1349 |
| Scotland                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/scotland)       |       N       |Scotland has datasets all presented in aggregated form. This parser currently uses the Age + Sex Daily positives: for each date, they provide the total number of Males or Females infected, within a particular age group. We want individual cases, so we want to do the following transformation:: Age: 15-19 | Sex: Female | TotalPositives: 5 -->  5 individual cases with Sex=Female and Age Range. This aggregation massively limits data we can use, so until we can find a way to complement with other datasets, we have no location data, no UUIDs, and no other fields of interest. We'll loop through each date, only selecting rows referring specifically to Males or Females and a particular age group (some rows show total across all ages/sexes). If age is 85plus then give age range 85-120, otherwise extract lower bound and upper bound of age. No need for convert_gender function, as string is provided in correct format| #1184 |
| Republic of Korea                    | [code](https://github.com/globaldothealth/list/tree/main/ingestion/functions/parsing/republic_of_korea)       |       Y       |Contains following columns: ID, dates of confirmation/release/death/exposure, birth year, sex, province, and in a subset of cases the infection number, contact number, and group of outbreak (e.g. a particular Church). Province field is not always a place name, sometimes just a note, eg 'filtered at airport'. We are only provided patient's birth_year, so we create a global variable current_year, and get age by: age = current_year - birth_year. This gives patients age by end of this year, so we provide a 1 year range for a patient's current age. A subset of cases contain information on which case IDs infected others, contact number and infection number. These are included, but seem inconsistent so should not be fully relied upon.| #512 |
