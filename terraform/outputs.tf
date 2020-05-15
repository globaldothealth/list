# Output DNS of ALB to reach the app once deployed.
output "alb_hostname" {
  value = aws_alb.main.dns_name
}
