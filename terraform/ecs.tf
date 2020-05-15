# Define a single ECS custer.
resource "aws_ecs_cluster" "main" {
  name = "epid-cluster"
}

# Define a data from a template file as best-practice to be able to substitute sensitive vars.
data "template_file" "epid_task" {
  template = file("./templates/task-definitions.json.tpl")

  vars = {
    curator_db_connection_string = var.curator_db_connection_string
    data_db_connection_string    = var.data_db_connection_string
    google_oauth_client_id       = var.google_oauth_client_id
    google_oauth_client_secret   = var.google_oauth_client_secret
    session_cookie_key           = var.session_cookie_key
    curator_image                = var.curator_image
    data_image                   = var.data_image
  }
}

# Single task definition for our "app".
resource "aws_ecs_task_definition" "app" {
  family = "epid-app-task"
  # Execution role is required to have permissions to use the awslog drivers.
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  container_definitions    = data.template_file.epid_task.rendered
}

# Our main ecs service in the cluster.
# Right now, each task in this service contains both the data and curator containers.
# If we want to scale them separately we should move them to their own service.
# For now it makes networking between those tasks simpler while load isn't an issue.
resource "aws_ecs_service" "main" {
  name            = "epid-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  # Put the tasks in the private subnet.
  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks.id]
    subnets          = aws_subnet.private.*.id
    assign_public_ip = true
  }

  # Load balancer should be able to talk to the curator service for health checks.
  load_balancer {
    target_group_arn = aws_alb_target_group.app.id
    container_name   = "curator"
    container_port   = var.curator_port
  }

  # Dependencies necessary as per official docs to avoid service stuck in DRAINING state.
  # Cf. https://www.terraform.io/docs/providers/aws/r/ecs_service.html
  depends_on = [aws_alb_listener.front_end, aws_iam_role_policy_attachment.ecs_task_execution_role]
}
