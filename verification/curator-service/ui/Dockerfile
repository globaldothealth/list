# Dev docker file for curator UI.
FROM node:14

WORKDIR /usr/src/app/verification/curator-service/ui
# Install app dependencies
COPY verification/curator-service/ui/package*.json ./
# RUN npm clean install
RUN npm ci
# Bundle app source
COPY verification/curator-service/ui/. .
# Bundle common files
COPY common/* ../../../common/
# Start the service.
CMD [ "npm", "start" ]