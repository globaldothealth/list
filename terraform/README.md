# Terraform setup for AWS

Terraform allows specifying AWS infrastructure as code.
This directory contains the production infrastructure definitions.

## Overview

The current infrastructure provides N+1 availability of a 3-tier architecture.

It follows the pattern of a [Publicly Exposed Service with Private Networking](https://github.com/awslabs/aws-cloudformation-templates/tree/master/aws/services/ECS#publicly-exposed-service-with-private-networking), expanding the concept for better availability and got heavily inspired from this [Medium article](https://medium.com/@bradford_hamilton/deploying-containers-on-amazons-ecs-using-fargate-and-terraform-part-2-2e6f6a3a957f) and [this cloud formation template](https://github.com/awslabs/aws-cloudformation-templates/blob/master/aws/services/ECS/FargateLaunchType/services/private-subnet-public-service.yml) to bootstrap the code.

### Network

A single Virtual Private Cloud is used.

All Fargate tasks are running in a private subnet.
Containers within each task can communicate together with the loopback interface. There is not support for cross-task communication yet.

TODO: Describe per-task communication once we start scaling data service and curator service independently.

The tasks get access to internet to download the docker images via a NAT Gateway that sits in the public subnet, talking to an _internet gateway_.

Traffic from the internet comes from the _internet gateway_ into an _Application Load Balancer_ sitting in the public subnet that redirects HTTP traffic on port 80 to the curator's container port 3001 where the UI is currently served. Redirection happens only if the health checks on curator's `/` are successful.

The _Application Load Balancer_'s hostname is a terraform _output_ and as such is printed upon successful `terraform apply` commands which allows access to the deployed cluster.

### Security

Two security groups are used.

- A security group for the ALB that is used to restrict access to the cluster (currently blocked from everywhere until we add authorization).

- A security group for the ECS tasks that ensure that traffic to the tasks only comes from the ALB.

### Secrets

You should have a `secrets.tfvars` file in this directory containing all the undefined variables necessary to apply the configuration, you need to pass this file as an argument to `apply`:

```
terraform apply -var-file=secrets.tfvars
```

TODO: Check if we can use AWS Secrets Manager instead of a local file.

## Setup

1. Install terraform.
2. run terraform init in this directory

## Work on infrastructure as a team

TODO: Share [remote state](https://www.terraform.io/docs/state/remote.html) by defining a [backend](https://www.terraform.io/docs/backends/index.html).

https://blog.gruntwork.io/how-to-manage-terraform-state-28f5697e68fa