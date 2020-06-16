# Ingestion functions

## Overview

This directory contains AWS [Lambda functions](https://aws.amazon.com/lambda/)
used in the Global Health ingestion system.

The objective of the ingestion system is to facilitate a semi-automated
workflow accomplishing the retrieval of epidemiological source data, the
parsing thereof to the standard Global Health data format, and the persisting
of both raw content and parsed case records for use by the Global Health
community. For more information on Global Health, refer to the [top-level README](https://github.com/open-covid-data/healthmap-gdo-temp/blob/master/README.md).

The structure of ingestion is roughly as shown below:

![System diagram](./assets/system.svg)

At a high-level:

1. **Actuation** is done by an AWS CloudWatch Events Scheduled Rule (one for
each source). The scheduled rule is defined, alongside the remainder of source
configuration, via the Global Health [curator UI](../../verification/curator-service/ui/)
sources page.
2. **Retrieval** is performed by a single [global retrieval function](./retrieval/retrieval.py),
which downloads (b) and persists (c) data in accordance with the source
configuration, retrieved from the [curator API](../../verification/curator-service/api/)
(a).
3. **Parsing** is performed by custom, per-source [parsing functions](./parsing/).
These are actuated directly by the global retrieval function (2d) (if specified
in the source configuration), and accomplish the conversion of raw source
content (3a) to the Global Health format. Converted data is written to the
central [data service](../../data-serving/data-service/) (for now, proxied via
the curator API, which offers an exposed, authenticated endpoint) (3b). While
there's no metadata currently written from parsing functions, the option is
available (3c).

## Development

### tl;dr

Ingestion functions are managed, developed, and deployed using the AWS
Serverless Application Model
([SAM](https://aws.amazon.com/serverless/sam/)). Functions are written in
Python and executed on a version 3.6 runtime. See set up instructions and
common commands, below.

### One-time setup

#### Prerequisites

1. Have valid AWS credentials configured in accordance with
[these instructions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started-set-up-credentials.html).
1. Have Python 3.6 installed on your machine. To check what versions you have
installed, and to see which versions correspond to the `python` and `python3`
commands, run the following:

```shell
ls -l /usr/bin/python*
```

#### Setup

1. Install the AWS SAM CLI, following
[these instructions](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
1. For each function you're planning to work with, be sure you have required
modules install, e.g. via:

```shell
python3.6 -m pip install -r requirements.txt
```

*NB:* Be sure you're using Python 3.6, which corresponds to the runtime of
the Lambda functions as configured in the [SAM template](./template.yaml). See
prerequisites, to check this.