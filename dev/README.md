# Development setup

This directory contains the docker compose file to run an isolated environment of the full stack during development.

## Prerequisite

**Important** running the full stack correctly requires having access to a few secrets: you should have a .env file at the top of your repository (where you run the `docker-compose` command) that looks like this:

```
GOOGLE_OAUTH_CLIENT_ID=<oauth client id to enable OAuth>
GOOGLE_OAUTH_CLIENT_SECRET=<oauth client secret>
```

## Environment variables

All services require specific environment variables to be set when running.

Specific .env files in each service directory are used when you run `npm run dev` from the service directory directly.

If you run the docker-compose script described below to run the whole stack, environment variables should be passed in the docker-compose.dev.yml environment overrides or in the docker-compose .env file itself in this directory. No service-specific .env files are included in the docker compose build as we shouldn't put secrets into docker images.

## Docker

During development, you can run each service individually using `docker` or plug them together using `docker-compose`.

`docker-compose` is also used by Github actions to make sure services are working well together all the time.

### All services composed with hot reload

Just run `./dev/run_stack.sh` from anywhere.

Services will be accessible and connected to each other.

### Running services individually

#### Mongo

Official docs: https://hub.docker.com/_/mongo

To run `mongod` locally, expose its default port (27017), connected to a default `test` database, run:

```
docker run --rm --name mongod -p 27017:27017 mongo
```

Note: data is persisted in the DB between runs unless you specify the --rm flag.

To run a `mongo` shell in that container and play with the DB:

```
docker exec -it mongod mongo
```

You can also just run `mongo` from your workstation if you have it installed.

##### How to clear cases data?

By default docker wil persist the container data unless you rm it, to remove data in the db first run a mongo shell as explained above then:

```
use covid19
db.cases.remove({})
```

## IDE setup

If you're using VSCode, `.vscode/settings.json` contains useful default settings for working with Typescript and NodeJS.

## Database setup

To start with a premade development database for the dataserver to use, run `setup_db.sh`. The
script will connect to your locally-running MongoDB instance, (re)create the necessary environment,
apply the schema, and insert some sample data.
