# Data monitoring

Data monitoring scripts, currently there's a script to alert daily about
changes in data.

The only configuration needed is setting `SLACK_WEBHOOK_METRICS_URL` to the
incoming webhooks URL ([docs](https://api.slack.com/messaging/webhooks)) after
creating a new app ([see current apps](https://api.slack.com/apps)) if required
in the workspace.

If `SLACK_WEBHOOK_METRICS_URL` is not set, the script will run and print to CI,
but will not be able to notify. The script triggers a CI failure when the
number of cases has dropped, so that should always be visible.

