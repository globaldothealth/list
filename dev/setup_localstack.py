from os import environ
from time import sleep

import boto3
import requests


LOCALSTACK_URL = environ.get("AWS_ENDPOINT", "http://localstack:4566")
BATCH_READY = '"batch": "running"'

IAM_PROFILE_NAME = "ecsInstanceRole"
IAM_PROFILE_ARN = "".join(["arn:aws:iam::000000000000:instance-profile/", "ecsInstanceRole"])
BATCH_SERVICE_ROLE_NAME = "foo"
ECS_INSTANCE_ROLE_NAME = "ecsInstanceRole"
IAM_ROLE_POLICY_DOCUMENT = "file://./iam_role.json"
EC2_SECURITY_GROUP_DESCRIPTION = "bar"
EC2_SECURITY_GROUP_NAME = "sg-1234abcd"
BATCH_COMPUTE_ENVIRONMENT_NAME = "M4Spot"
BATCH_COMPUTE_ENVIRONMENT_ARN = "".join(["arn:aws:batch:us-east-1:000000000000:compute-environment/", BATCH_COMPUTE_ENVIRONMENT_NAME])
BATCH_COMPUTE_ENVIRONMENT_TYPE = "MANAGED"

BATCH_COMPUTE_RESOURCES = {
    "type": "EC2",
    "minvCpus": 1,
    "maxvCpus": 10,
    "instanceTypes": [
        "m4.large",
    ],
    "imageId": "string",
    "subnets": [],
    "securityGroupIds": [],
    "instanceRole": IAM_PROFILE_ARN,
    "ec2Configuration": [
        {
            "imageType": "string",
            "imageIdOverride": "string"
        },
    ]
}

BATCH_JOB_QUEUE_NAME = environ.get("BATCH_QUEUE_NAME", "ingestion-queue")
BATCH_COMPUTE_ENVIRONMENT_ORDER = [{
    "order": 1,
    "computeEnvironment": BATCH_COMPUTE_ENVIRONMENT_ARN
}]

DATA_BUCKET_NAME = environ.get("DATA_BUCKET_NAME", "covid-19-data-export")
DOWNLOAD_BUCKET_NAME = environ.get("DOWNLOAD_BUCKET_NAME", "covid19-filtered-downloads")
SES_EMAIL_ADDRESS = environ.get("SES_EMAIL_ADDRESS", "info@global.health")

class LocalstackWrangler(object):

    def __init__(self):
        self.iam_client = boto3.client("iam", endpoint_url=LOCALSTACK_URL)
        self.ec2_client = boto3.client("ec2", endpoint_url=LOCALSTACK_URL)
        self.s3_client = boto3.client("s3", endpoint_url=LOCALSTACK_URL)
        self.ses_client = boto3.client("ses", endpoint_url=LOCALSTACK_URL)
        self.batch_client = boto3.client("batch", endpoint_url=LOCALSTACK_URL)

    def create_iam_role(self, role_name):
        print(f"Creating IAM role {role_name} for Batch")
        self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=IAM_ROLE_POLICY_DOCUMENT 
        )
        print("Done creating role")

    def create_iam_profile(self, profile_name):
        print(f"Creating IAM profile {profile_name} for ECS instance")
        self.iam_client.create_instance_profile(
            InstanceProfileName=profile_name
        )
        print("Done creating profile")

    def get_iam_role_arn(self, role_name):
        print(f"Getting ARN for IAM role {role_name}")
        response = self.iam_client.get_role(
            RoleName=role_name
        )
        role_info = response.get("Role", {})
        arn = role_info.get("Arn", "")
        print(f"Got ARN {arn}")
        return arn

    def create_security_group(self, group_name):
        print(f"Creating security group {group_name}")
        self.ec2_client.create_security_group(
            Description=EC2_SECURITY_GROUP_DESCRIPTION,
            GroupName=group_name
        )
        print("Created security group")

    def get_security_group_id(self):
        print("Getting security group ID")
        response = self.ec2_client.describe_security_groups()
        security_groups = response.get("SecurityGroups", [""])
        group_id = security_groups[0].get("GroupId", "")
        print(f"Got group ID {group_id}")
        return group_id

    def create_subnet(self):
        print("Creating VPC and subnet")
        response = self.ec2_client.create_vpc(
            CidrBlock="10.0.0.0/16"
        )
        vpc_info = response.get("Vpc", {})
        vpc_id = vpc_info.get("VpcId", {})
        self.ec2_client.create_subnet(
            CidrBlock="10.0.2.0/24",
            VpcId=vpc_id
        )
        print("Created VPC and subnet")

    def get_subnet_id(self):
        print("Getting subnet ID")
        response = self.ec2_client.describe_subnets()
        subnets = response.get("Subnets", [{}])
        subnet_id = subnets[0].get("SubnetId", "")
        print(f"Got subnet ID {subnet_id}")
        return subnet_id

    def create_compute_environment(self, security_group_id, batch_service_role_arn, subnet_id):
        print(f"Creating compute environment for security group {security_group_id}")
        BATCH_COMPUTE_RESOURCES["securityGroupIds"].append(security_group_id)
        BATCH_COMPUTE_RESOURCES["subnets"].append(subnet_id)
        self.batch_client.create_compute_environment(
            computeEnvironmentName=BATCH_COMPUTE_ENVIRONMENT_NAME,
            type=BATCH_COMPUTE_ENVIRONMENT_TYPE,
            computeResources=BATCH_COMPUTE_RESOURCES,
            serviceRole=batch_service_role_arn
        )
        print("Created security group")

    def create_batch_job_queue(self, queue_name):
        print(f"Creating job queue {queue_name}")
        self.batch_client.create_job_queue(
            jobQueueName=queue_name,
            priority=1,
            state="ENABLED",
            computeEnvironmentOrder=BATCH_COMPUTE_ENVIRONMENT_ORDER
        )
        print("Created job queue")

    def create_s3_bucket(self, bucket_name):
        print(f"Creating bucket {bucket_name}")
        self.s3_client.create_bucket(
            Bucket=bucket_name
        )
        print("Created bucket")

    def setup_ses(self, email_address):
        print(f"Verifying email address {email_address}")
        self.ses_client.verify_email_identity(
            EmailAddress=email_address
        )
        print("Verified email address")


def wait_for_localstack():
    healthcheck_url = "".join([LOCALSTACK_URL, "/health"])
    counter = 0
    while counter < 42:
        try:
            response = requests.get(healthcheck_url)
            if BATCH_READY in response.text:
                return
        except requests.exceptions.ConnectionError:
            pass
        counter += 1
        print("Waiting for localstack")
        sleep(5)
    raise Exception("Localstack not available")


if __name__ == "__main__":
    print("Setting up localstack resources")
    wait_for_localstack()
    lw = LocalstackWrangler()
    lw.create_iam_role(BATCH_SERVICE_ROLE_NAME)
    lw.create_iam_profile(IAM_PROFILE_NAME)
    lw.create_security_group(EC2_SECURITY_GROUP_NAME)
    security_group_id = lw.get_security_group_id()
    batch_service_role_arn = lw.get_iam_role_arn(BATCH_SERVICE_ROLE_NAME)
    ecs_instance_role_arn = None
    lw.create_subnet()
    subnet_id = lw.get_subnet_id()
    lw.create_compute_environment(security_group_id, batch_service_role_arn, subnet_id)
    lw.create_batch_job_queue(BATCH_JOB_QUEUE_NAME)
    lw.setup_ses(SES_EMAIL_ADDRESS)
    lw.create_s3_bucket(DATA_BUCKET_NAME)
    lw.create_s3_bucket(DOWNLOAD_BUCKET_NAME)
    print("Done setting up localstack resources")
