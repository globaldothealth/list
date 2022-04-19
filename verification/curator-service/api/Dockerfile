# Dev docker file for curator service.
FROM node:16.14.2

# set the version (this should be set from outside)
ARG CURATOR_VERSION
ENV CURATOR_VERSION=${CURATOR_VERSION:-unset}
# Build the curator service.
WORKDIR /usr/src/app/verification/curator-service/api
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY verification/curator-service/api/package*.json ./
# Try to avoid cb not called error in CI
RUN npm cache clean --force
# RUN npm clean install
RUN npm ci
# Bundle app source
COPY verification/curator-service/api/. .
# Bundle common files
COPY common/* ../../../common/
# Build the app
RUN npm run build
# Expose service on port 3001.
EXPOSE 3001
# Start the service.
CMD [ "npm", "start" ]