[
    {
        "cpu": 256,
        "memory": 512,
        "environment": [
            {
                "name": "PORT",
                "value": "3000"
            },
            {
                "name": "DB_CONNECTION_STRING",
                "value": "${data_db_connection_string}"
            }
        ],
        "essential": true,
        "image": "${data_image}",
        "name": "data",
        "portMappings": [
            {
                "containerPort": 3000,
                "hostPort": 3000,
                "protocol": "tcp"
            }
        ],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "/ecs/epid-app",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "data"
            }
        }
    },
    {
        "cpu": 256,
        "memory": 512,
        "environment": [
            {
                "name": "PORT",
                "value": "3001"
            },
            {
                "name": "DB_CONNECTION_STRING",
                "value": "${curator_db_connection_string}"
            },
            {
                "name": "GOOGLE_OAUTH_CLIENT_ID",
                "value": "${google_oauth_client_id}"
            },
            {
                "name": "GOOGLE_OAUTH_CLIENT_SECRET",
                "value": "${google_oauth_client_secret}"
            },
            {
                "name": "SESSION_COOKIE_KEY",
                "value": "${session_cookie_key}"
            },
            {
                "name": "DATASERVER_URL",
                "value": "http://127.0.0.1:3000"
            }
        ],
        "essential": true,
        "image": "${curator_image}",
        "name": "curator",
        "portMappings": [
            {
                "containerPort": 3001,
                "hostPort": 3001,
                "protocol": "tcp"
            }
        ],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "/ecs/epid-app",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "curator"
            }
        }
    }
]