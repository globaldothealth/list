FROM python:3.8-buster

RUN apt-get update -y
RUN apt-get install -y python3-pip

# create the deployment area
RUN mkdir -p /usr/src/app/geocoding/location-service
WORKDIR /usr/src/app/geocoding/location-service

# install dependencies
COPY requirements.txt .
RUN python3 -mpip install -r requirements.txt

# deploy the app source
COPY . .

# expose the Flask app port
EXPOSE 8080
# Run!

CMD ["python3", "-m", "src.app.main"]
