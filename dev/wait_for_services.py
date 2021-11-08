from time import sleep

import docker


WAIT_TIME = 5
WAIT_RETRIES = 42


def wait_for_ingestion_setup():
	docker_client = docker.from_env()
	print("Waiting for ingestion setup to finish")
	counter = 0
	while counter < WAIT_RETRIES:
		containers = docker_client.containers.list(
			filters = {
				"exited": 0,
				"name": "setup-ingestion_1"
			}
		)
		if containers:
			print("Ingestion setup finished")
			return
		counter += 1
		print("Waiting for ingestion setup to finish")
		sleep(WAIT_TIME)
	raise Exception(f"Ingestion setup did not finish in {WAIT_TIME * WAIT_RETRIES} seconds")


if __name__ == "__main__":
	wait_for_ingestion_setup()
