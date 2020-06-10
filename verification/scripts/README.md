# Verification scripts

This directory contains various scripts to manage the verification part of the Global Health system.

## Bootstrapping admin roles

When the application is first used, logged-in users have no roles associated with them.
To bootstrap the admin process, you can assign a user with a given email the admin, reader and curator roles:

```shell
mongo "mongodb://user:pass@some-connection-string/somedb" \
  --eval 'var email="some-email@foo.bar"; var roles=["admin", "reader", "curator"];' \
  roles.js
```

And verify the roles have been applied:

```shell
mongo "mongodb://user:pass@some-connection-string/somedb" \
  --eval 'db.users.find({email: "some-email@foo.bar"})'
```

NOTE: For localhost (during dev) the DB connection string is "mongodb://localhost:27017/covid19" but for the atlas DB you have to use a proper connection string as the data service or curator services are doing on AWS.
You can go to the web atlas console and generate creds for you, they'll also show you the connection string to use those creds you just created.