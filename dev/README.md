# Development setup

This directory contains the docker compose file to run an isolated environment of the full stack during development.

## Docker

During development, you can run each service individually using `docker` or plug them together using `docker-compose`.

`docker-compose` is also used by Github actions to make sure services are working well together all the time.

### All services composed with hot reload

Just run `./dev/run_stack.sh` from anywhere or from this folder run:

```
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

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

#### Data service

From the `data-service` directory where the `Dockerfile` is located, run:

```
docker build . -t epid/dataservice
```

then run it with:

```
docker run --network=host epid/dataservice
```

#### Curator service

From the `curator-service` directory where the `Dockerfile` is located, run:

```
docker build . -t epid/curatorservice
```

then run it with:

```
docker run --network=host epid/curatorservice
```

This will connect to the default mongo db exposed by the docker container if run as explained in the _Mongo_ section above.

## IDE setup

If you're using VSCode, `.vscode/settings.json` contains useful default settings for working with Typescript and NodeJS.

## Database setup

To start with a premade development database for the dataserver to use, run `setup_db.sh`. The
script will connect to your locally-running MongoDB instance, (re)create the necessary environment,
apply the schema, and insert some sample data.