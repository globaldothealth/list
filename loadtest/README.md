# Load testing

This directory contains [locust](https://locust.io) load testing tasks to load test the Global.health APIs.

Set-up and initial load testing was tracked in [this github issue]().

## Initial setup

Install Python 3.8, locust and the necessary dependencies with:

```shell
pip3 install -r requirements.txt
```

Get access to serialized credentials stored in S3 or generate your own and put them in an S3 bucket that you can access, then set the required environment variables when running locust:

```shell
S3_BUCKET='epid-ingestion' S3_OBJECT='covid-19-map-277002-0943eeb6776b.json'
```

## Local load test

To load test a local instance, do:

```shell
python3 -m locust --locustfile locustfile.py --host http://localhost:3002 --users 10 --spawn-rate 1
```

Locally you can try using the [import scripts](/data-serving/scripts/data-pipeline/README.md) to import some data locally to make it more meaningful.

Note: When testing a local instance, make sure the user whose serialized credentials you are using has the curator and admin roles in the [local users administration page](http://localhost:3002/users).

### What to look for locally

Check the response time percentiles in the UI if they feel reasonable, the number of failures if any and overall memory usage of the docker containers using `docker stats`, the output should look something like:

```raw
CONTAINER ID        NAME                CPU %               MEM USAGE / LIMIT     MEM %               NET I/O             BLOCK I/O           PIDS
59381efc5cbd        dev_curatorui_1     5.99%               730.8MiB / 1.944GiB   36.70%              1.86MB / 176kB      0B / 0B             42
4b107a29e174        dev_curator_1       2.78%               92.41MiB / 1.944GiB   4.64%               732kB / 647kB       0B / 0B             36
3df7fdac25b2        dev_data_1          1.54%               66.79MiB / 1.944GiB   3.35%               534kB / 493kB       0B / 0B             36
3adfc5cf8fab        dev_mongo_1         198.09%             489.4MiB / 1.944GiB   24.58%              121kB / 580kB       0B / 0B             44
```

## Dev load test

To load test dev, do:

```shell
python3 -m locust --locustfile locustfile.py --host https://dev-curator.ghdsi.org --users 10 --spawn-rate 1
```

Follow the link to the locust UI and start the load test there, you can tune the number of users and spawn-rate from the UI or from the command line (command like only sets the defaults used in the UI).

### What to look for in dev

Check the response time percentiles in the UI if they feel reasonable, the number of failures if any and memory/cpu usage of pods using `kubectl top pods`.

A more visual way of looking at dev resource usage would be the [kubernetes dashboard](/aws/README.md#Kubernetes-dashboard)

## Prod load test

Please don't, load test locally and in dev but avoid hitting prod with crazy load as we do currently not have a way of segregating traffic and shedding excessive load traffic that could impact users.

## Known caveats

- These load tests talk to the API endpoint as they are not using a headless browser that could render Javascript and exercise the UI code directly, we don't expect the UI portion of the code to be the bottleneck though so just testing the API is good enough for now.
- Kubernetes horizontal auto-scaling is not enabled, it could but it would also make load-testing dependent on the current load of the cluster so it has to be taken into account if we ever enable it.
- Only a subset of readonly endpoints are tested, we could test mutating endpoints as well but most users shouldn't have mutate access so we're not worried about the load they would induce.
- Load tests talk to the curator service API, not to the data service API, this is because the curator service is the only endpoint exposed externally.
