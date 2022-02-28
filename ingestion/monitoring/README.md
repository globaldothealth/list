# Error monitoring

The `errorLogsToSlack.py` script reads log messages from a given Cloudwatch stream
and posts any errors to Slack. It has three inputs, all passed via the environment:

 - `SLACK_WEBHOOK` is the webhook URL to post messages to Slack.
 - `INGESTION_LOG_GROUP` is the Cloudwatch log group name.
 - `INGESTION_LOG_STREAM` is the Cloudwatch log stream name.

Typically, all would be set up EventBridge in AWS when it's run in Batch.

## To set up for a new instance

1. see https://api.slack.com/messaging/webhooks for details on creating a Slack app and enabling web hooks.
2. change the Slack user IDs in the script to ones that represent users in your workspace (who should get notified on ingestion errors).
3. deploy to Batch

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

