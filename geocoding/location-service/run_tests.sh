#!/bin/sh

ENV=`mktemp -d`
python3 -mvenv "${ENV}"
. "${ENV}/bin/activate"
pip install -r requirements.txt
ENABLE_FAKE_GEOCODER=YES pytest
deactivate
rm -rf "${ENV}"
