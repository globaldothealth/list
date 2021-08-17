# Authentication and authorization

## Authentication

Users are currently authenticated using [passport.js's Google OAuth strategy](http://www.passportjs.org/packages/passport-google-oauth20/).

To authenticate from the command line, you can use [curl(1)](https://manpages.debian.org/stable/curl/curl.1.en.html).
You'll need the session cookie after logging in, which is described in
the [geocoding](geocoding/location-service/README.md) documentation. Then:

```bash
curl --data '{"format": "csv", "query": "country:Antarctica"}' \
  -H "Content-Type: application/json" \
  -b 'connect.sid=<session cookie>' \
  https://data.covid-19.global.health/api/cases/downloadAsync
```
for example, to send the cases in Antarctica via email using the
`downloadAsync` endpoint. You should replace the content type
according to the type requested by the endpoint.

You can also use the `dev/run_session.py` script as a jumping off point; just copy/paste the contents into a new file and modify it to do what you want.

## Authorization

Users can be given roles by admins, admin itself being a role.

The different roles are:

- admin
- curator

A user can have no roles.

Here are the permissions granted to each roles:

- Admin
  - List users based on their roles
  - Assign/unassign role to users
- Curator
  - CRUD cases and ingestion sources

By default all logged-in users have read-only access to the linelist data and sources used to populate it.

## Unit-testing

Our "unit-tests" are more like integration tests really because `supertest` takes in an express app and we usually pass it our main app as defined in `index.ts`.
That means the express HTTP handlers are protected with our authorization middleware and requests have to be properly authenticated.

To that end we expose a `/auth/register` handler that accepts POST requests with a user in its body and will create that user in mongo, then set the proper cookies in the request that can then be used to query the other HTTP handlers.

## Integration testing

Cypress request authentication works the same as for unit testing above, a call to `/auth/register` is made before a test is run so that a user is created and the request properly authenticated.

## Known issues

If you have an ongoing session but remove the Users collection, you can end up in a passport-lockdown where passport doesn't reset your session.

The current fix pending https://github.com/jaredhanson/passport/issues/776 is to manually delete your session cookie.

Some users seem to have trouble login with multi-account sessions (multiple google accounts logged-in at the same time in the same browser profile), we have yet to find a fix for that issue other than only keeping one account at the same time in the same browser profile.
