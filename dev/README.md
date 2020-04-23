# Development setup

This directory contains the docker compose file to run an isolated environment of the full stack during development.

## Docker

You can run each service individually using `docker` or plug them together using `docker-compose`.

### Mongo

Official docs: https://hub.docker.com/_/mongo

To run `mongod` locally, expose its default port (27017), connected to a default `test` database, run:

```
docker run --rm --name mongod -p 27017:27017 mongo
```

To run a `mongo` shell in that container and play with the DB:

```
docker exec -it mongod mongo
```

### Data service

From the `data-service` directory where the `Dockerfile` is located, run:

```
docker build . -t epid/dataservice
```

then run it with:

```
docker run --network=host epid/dataservice
```

### Curator service

From the `curator-service` directory where the `Dockerfile` is located, run:

```
docker build . -t epid/curatorservice
```

then run it with:

```
docker run --network=host epid/curatorservice
```

This will connect to the default mongo db exposed by the docker container if run as explained in the _Mongo_ section above.

### All services composed

From this folder run:

```
docker-compose up
```

Services will be accessible and connected to each other.

## IDE setup

If you're using VSCode, `.vscode/settings.json` contains useful default settings for working with Typescript and NodeJS.