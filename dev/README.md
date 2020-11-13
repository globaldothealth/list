# Development setup

This directory contains scripts to set up, run, and test the full stack during development, including:

- `run_stack.sh`: A script to run the dev docker compose file that runs an isolated environment of the full stack.
- `setup-db.sh`: A script to that connects to your locally-running MongoDB instance and (re-)creates the database and
  collection, applies the schema, and inserts some sample data.
- `test_all.sh`: A script to run all of the tests from the sub-packages.

What, exactly, is this stack that we're running and/or testing? All of the components of this repo working together: a
curator UI server that talks to a curator API server that talks to a data server. More concretely, a user can log into
the curator UI to manage case report data sources and view or update case data, with more functionality coming soon.

## Getting up and running

### Prerequisites

#### Software

- [Homebrew](https://docs.brew.sh/Installation): To facilitate installing the below.
- [MongoDB](https://docs.mongodb.com/manual/administration/install-community/): Make sure, after install, you can run
  both the `mongo` and `mongoimport` CLIs. (They may need to be added to your path.) If you're using homebrew, [`brew install mongodb/brew/mongodb-database-tools`](https://stackoverflow.com/a/62973387/6105673) to get `mongoimport`.
- [Docker](https://docs.docker.com/get-docker/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

#### Secrets

**Important:** running the full stack correctly requires having access to a few secrets: you should create a `.env` file
in `${REPOSITORY_ROOT}/dev` that looks like this:

```text
AWS_ACCESS_KEY_ID=<AWS access key ID>
AWS_SECRET_ACCESS_KEY=<AWS secret access key to authenticate AWS API calls>
EMAIL_USER_ADDRESS=<Email address of the account used to send notification emails>
EMAIL_USER_PASSWORD=<Password for the above email address>
GOOGLE_OAUTH_CLIENT_ID=<oauth client id to enable OAuth>
GOOGLE_OAUTH_CLIENT_SECRET=<oauth client secret>
MAPBOX_TOKEN=<Mapbox API token>
REACT_APP_PUBLIC_MAPBOX_TOKEN=<Different Mapbox API token>
```

These values are stored in a dedicated secret manager. To request AWS credentials, or for access to
other secret values, contact one of:

- Christopher.Remmel@childrens.harvard.edu
- Gaurav.Tuli@childrens.harvard.edu
- Spencer.Marks@childrens.harvard.edu

Note that for local development, it's fine to use your own values for these
secrets if you have them. For instance, if you have a developer Mapbox API
token, or if you'd like to use a different GMail account for mailing notifications, or different OAuth client values.

#### Permissions

Give your user all the permissions to access the portal and make CRUD updates.

```shell
./dev/make_superuser.sh $YOUR_GOOGLE_EMAIL
```

Note that **the user must be logged-in into the portal before you can issue this command**.

**Windows users**

If you're running the dev stack in [MinGW](http://mingw.org) you will get errors from mongo about "not a tty". Prefix your commands with `winpty` (except shell scripts, which must be prefixed with `winpty bash`, like `winpty bash ./dev/make_superuser.sh $YOUR_GOOGLE_EMAIL`), or run the commands from Windows `cmd.exe`.

If you get this error:

```shell
$ ./dev/make_superuser.sh $YOUR_GOOGLE_EMAIL
~/Projects/globaldothealth/list ~/Projects/globaldothealth/list
MongoDB shell version v4.4.0
connecting to: mongodb://127.0.0.1:27017/covid19?compressors=disabled&gssapiServiceName=mongodb
Implicit session: session { "id" : UUID("cdafb190-2d3f-4d80-a862-7cd4d7a0c0be") }
MongoDB server version: 4.4.0
{"t":{"$date":"2020-10-07T08:43:26.202Z"},"s":"E",  "c":"-",        "id":22779,   "ctx":"main","msg":"file [{filename}] doesn't exist","attr":{"filename":"/verification/scripts/roles.js"}}
failed to load: /verification/scripts/roles.js
exiting with code -3
```

here is how to update a user in mongo directly:

```mongo
db.users.updateOne({email: "your-google-email"}, {$set: {roles: ['admin', 'curator']}})
```

If _that_ shows you this response:

```mongo
{ "acknowledged" : true, "matchedCount" : 0, "modifiedCount" : 0 }
```

or the script shows you this error:

```shell
$YOUR_GOOGLE_EMAIL is not in the DB
```

it's because you didn't log in to the portal _before_ running `make_superuser.sh`.

### Let's run this thing!

Once you've done all of the prereqs above, go ahead and:

1. Run `./dev/run_stack.sh`
1. Run `./dev/setup_db.sh` to set up the collection and load up some toy data
1. Navigate to `localhost:3002`
1. Experience success

## Understanding the setup

### Environment variables

All services require specific environment variables to be set when running.

Specific `.env` files in each service directory are used when you run `npm run dev` from the service directory directly.

If you run the docker-compose script described below to run the whole stack, environment variables should be passed in
the docker-compose.dev.yml environment overrides or in the docker-compose `.env` file itself in this directory. No
service-specific `.env` files are included in the docker compose build as we shouldn't put secrets into docker images.

### Docker

During development, you can run each service individually using `docker` or plug them together using `docker-compose`.

`docker-compose` is also used by Github actions to make sure services are working well together all the time.

### All services composed with hot reload

Just run `./dev/run_stack.sh` from anywhere.

Services will be accessible and connected to each other.

### Running services individually

#### Mongo

Official docs: https://hub.docker.com/_/mongo

To run `mongod` locally, expose its default port (27017), connected to a default `test` database, run:

```shell
docker run --rm --name mongod -p 27017:27017 mongo
```

Note: data is persisted in the DB between runs unless you specify the --rm flag.

To run a `mongo` shell in that container and play with the DB:

```shell
docker exec -it mongod mongo
```

You can also just run `mongo` from your workstation if you have it installed.

##### How to clear cases data?

By default docker wil persist the container data unless you rm it, to remove data in the db first run a mongo shell as
explained above then:

```js
use covid19
db.cases.remove({})
```

## IDE setup

If you're using VSCode, `.vscode/settings.json` contains useful default settings for working with Typescript and NodeJS.

## Update of dependencies

You can update all node dependencies for the services to their latest minor version by running the `dev/update_deps.sh` script.
