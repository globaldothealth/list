# Dev docker file for curator UI.
FROM node:14.17.1

WORKDIR /usr/src/app/verification/curator-service/ui
# Install app dependencies
COPY verification/curator-service/ui/package*.json ./
# Avoid trying to connect to github over ssh as we don't have any keys
RUN git config --global url."https://github.com/".insteadOf git@github.com:
RUN git config --global url."https://".insteadOf ssh://
# Try to avoid cb not called error in CI
RUN npm cache clean --force
# RUN npm clean install
RUN npm ci
# Bundle app source
COPY verification/curator-service/ui/. .
# Bundle common files
COPY common/* ../../../common/
# Start the service.
CMD [ "npm", "start" ]