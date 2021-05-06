#!/bin/sh

poetry install
poetry update
ENABLE_FAKE_GEOCODER=YES poetry run pytest
