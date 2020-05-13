# Production infrastructure

This directory contains the configuration files for the production infrastructure of the epid project.

## Docker compose

`docker-compose up --build` is the equivalent of `../dev/run_stack.sh` but will start the UI compiled and served by the curator service. It doesn't have any hot-reload functionality.

## Environment variables

Cf. `../dev/README.md` Environment variables section.

in addition, SESSION_COOKIE_KEY is also required for production sessions.

## Fargate ECS

TODO: Document.