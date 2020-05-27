# Verification scripts

This directory contains various scripts to manage the verification part of the epid system.

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