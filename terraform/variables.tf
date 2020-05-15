variable "region" {
  description = "aws region to use"
  default     = "us-east-1"
}

variable "dataservice_image" {
  description = "Docker image for the data service"
  default     = "attwad/epiddata"
}

variable "curatorservice_image" {
  description = "Docker image for the curator service"
  default     = "attwad/epidcurator"
}

variable "az_count_per_region" {
  description = "Number of availability zones to cover per region"
  default     = 2
}

variable "curator_port" {
  description = "Port exposed by the curator service docker image"
  default     = 3001
}

variable "data_port" {
  description = "Port exposed by the data service docker image"
  default     = 3000
}

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  default     = "512"
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  default     = "1024"
}

variable "ecs_task_execution_role_name" {
  description = "ECS task execution role name"
  default     = "epidEcsTaskExecutionRole"
}

variable "curator_db_connection_string" {
  description = "Connection string to mongo for the curator service"
}

variable "data_db_connection_string" {
  description = "Connection string to mongo for the data service"
}

variable "data_image" {
  description = "Docker image for the data service"
  default     = "docker.io/attwad/epiddata"
}

variable "curator_image" {
  description = "Docker image for the curator service"
  default     = "docker.io/attwad/epidcurator"
}

variable "session_cookie_key" {
  description = "Session cookie encryption key"
}


variable "google_oauth_client_secret" {
  description = "Google oauth client secret"
}

variable "google_oauth_client_id" {
  description = "Google oauth client ID"
}
