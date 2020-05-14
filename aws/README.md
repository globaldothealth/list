# Production infrastructure

This directory contains the configuration files for the production infrastructure of the epid project.

## One-time setup

Download the aws and ecs-cli tools from Amazon.

Configure the aws CLI, specify `us-east-1` as the default region and enter your _Access keys_ generated from the [web console](https://console.aws.amazon.com/iam/home?region=us-east-1#/security_credentials).

```shell
aws configure
```

Configure ecs-cli to work on our cluster:

```shell
ecs-cli configure --cluster epid-dev --default-launch-type FARGATE --region us-east-1
```

Create the cluster:

```shell
ecs-cli up
```

You now have a cluster with some default networking enabled and without any tasks in it.

Notice the two lines in the output of the previous command indicating the subnets that were created, put those in the `ecs-params.yml` file in this directory.

You need to get the _security group_ that was created and put it in the `ecs-params.yml` file as well, to do this issue this command:

```shell
aws ec2 describe-security-groups --filters Name=vpc-id,Values=<vpc from previous command output>
```

Once your `ecs-params.yml` file is complete, you can move on to the next section.

## ECS operations.

Bring up the tasks in the cluster:

```shell
ecs-cli compose --project-name data service up --ecs-profile epid-dev
```

You can then check the status of the cluster and do most operations from the [web console](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters/epid-dev/services).

Or you can use the shell, for example to see running tasks:

```shell
ecs-cli compose --project-name epid-dev service ps --cluster-config epid-dev --ecs-profile epid-dev
```

Note: by default a public IP is made available to reach the cluster but the default firewall blocks all incoming traffic. You can change those rules in the [network ACL web console](chttps://us-east-1.console.aws.amazon.com/vpc/home?region=us-east-1#acls:sort=networkAclId).