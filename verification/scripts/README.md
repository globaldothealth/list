# Verification scripts

This directory contains various scripts to manage the verification part of the Global.health system.

## Bootstrapping admin roles

When the application is first used, logged-in users have no roles associated with them.
To bootstrap the admin process, you can assign a user with a given email the admin and curator roles:

```shell
mongo "mongodb://user:pass@some-connection-string/somedb" \
  --eval 'var email="some-email@foo.bar"; var roles=["admin", "curator"];' \
  roles.js
```

And verify the roles have been applied:

```shell
mongo "mongodb://user:pass@some-connection-string/somedb" \
  --eval 'db.users.find({email: "some-email@foo.bar"})'
```

NOTE: For localhost (during dev) the DB connection string is "mongodb://localhost:27017/covid19" but for the atlas DB you have to use a proper connection string as the data service or curator services are doing on AWS.
You can go to the web atlas console and generate creds for you, they'll also show you the connection string to use those creds you just created.

# country_codes_map

This script is used to generate a list of the ISO-3166-2 alpha-2 country codes stored in the platform, along with the names recognised for each country. This augments the data dictionary by showing the countries that a user can expect to see, but also documenting those names that _aren't_ present (at time of writing, the country 'VA' is recognised as "Holy See" but not as "Vatican", for example).

Any user with an API key can run this script:

```shell
export GDOTH_API_BASEURL=<URL of the curator-service API, e.g. https://data-covid-19.global.health>
export GDOTH_API_KEY=<API key>
poetry run python3 country_codes_map.py
```
