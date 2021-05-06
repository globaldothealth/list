FROM python:3.8-buster

RUN apt-get update -y
RUN apt-get install -y python3-pip

# create a user

RUN useradd -ms /bin/bash flask

# create the deployment area
RUN mkdir -p /usr/src/app/geocoding/location-service
RUN chown flask:flask /usr/src/app/geocoding/location-service
WORKDIR /usr/src/app/geocoding/location-service
USER flask

# install dependencies
RUN pip install poetry
COPY geocoding/location-service/pyproject.toml .
COPY geocoding/location-service/poetry.lock .
RUN /home/flask/.local/bin/poetry install

# deploy the app source
COPY geocoding/location-service/. .

# expose the Flask app port
EXPOSE 8080
# Run!

CMD ["/home/flask/.local/bin/poetry", "run", "python3", "-m", "src.app.main"]
