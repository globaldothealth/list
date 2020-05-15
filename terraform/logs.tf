# Containers logs will be sent to CloudWatch thanks to the awslogs driver
# used in the task configuration file. Set up CloudWatch log group and stream here.
resource "aws_cloudwatch_log_group" "epid_log_group" {
  # Seems like it's a convention to start with /ecs for log groups in ECS.
  name              = "/ecs/epid-app"
  retention_in_days = 30

  # Tag our logs for easier search.
  tags = {
    Name = "epid-log-group"
  }
}

resource "aws_cloudwatch_log_stream" "epid_log_stream" {
  name           = "epid-log-stream"
  log_group_name = aws_cloudwatch_log_group.epid_log_group.name
}
