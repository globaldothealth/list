# Set up CloudWatch group and log stream and retain logs for 30 days
resource "aws_cloudwatch_log_group" "epid_log_group" {
  name              = "/ecs/epid-app"
  retention_in_days = 30

  tags = {
    Name = "epid-log-group"
  }
}

resource "aws_cloudwatch_log_stream" "epid_log_stream" {
  name           = "epid-log-stream"
  log_group_name = aws_cloudwatch_log_group.epid_log_group.name
}
