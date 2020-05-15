# ALB Security Group, restricts access to the application.
resource "aws_security_group" "lb" {
  name        = "epid-load-balancer-security-group"
  description = "controls access to the ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol    = "tcp"
    from_port   = var.curator_port
    to_port     = var.curator_port
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Default AWS ALLOW ALL rule.
  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Traffic to the ECS cluster should only come from the ALB
resource "aws_security_group" "ecs_tasks" {
  name        = "epid-ecs-tasks-security-group"
  description = "allow inbound access from the ALB only"
  vpc_id      = aws_vpc.main.id

  ingress {
    protocol        = "tcp"
    from_port       = var.curator_port
    to_port         = var.curator_port
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1" # All.
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}
