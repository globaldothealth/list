# Authentication and authorization

## Authentication

Users are currently authenticated using passport.JS's Google OAuth strategy.

## Authorization

Users can be given roles by admins, admin itself being a role.

The different roles are:

- admin
- curator
- reader

A user can have no roles.

Here are the permissions granted to each roles:

- Admin
  - List users based on their roles
  - Assign/unassign role to users 
- Curator
  - CRUD cases and ingestion sources
- Reader
  - Read-only access to cases and sources

## Unit-testing

Our "unit-tests" are more like integration tests really because `supertest` takes in an express app and we usually pass it our main app as defined in `index.ts`.
That means the express HTTP handlers are protected with our authorization middleware and requests have to be properly authenticated.

To that end we expose a `/auth/register` handler that accepts POST requests with a user in its body and will create that user in mongo, then set the proper cookies in the request that can then be used to query the other HTTP handlers.

## Integration testing

Cypress request authentication works the same as for unit testing above, a call to `/auth/register` is made before a test is run so that a user is created and the request properly authenticated.

## Known issues

If you have an ongoing session but remove the Users collection, you can end up in a passport-lockdown where passport doesn't reset your session.

The current fix pending https://github.com/jaredhanson/passport/issues/776 is to manually delete your session cookie.