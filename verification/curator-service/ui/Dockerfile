# Dev docker file for curator UI.
FROM node:14

WORKDIR /usr/src/app/verification/curator-service/ui
# Install app dependencies
COPY verification/curator-service/ui/package*.json ./
# RUN npm clean install
RUN npm ci
# Install Amplify CLi
RUN npm install -g @aws-amplify/cli --unsafe-perm=true
# Bundle app source
COPY verification/curator-service/ui/. .
# RUN amplify checkout
RUN amplify env checkout develop
# Bundle common files
COPY common/* ../../../common/
# Start the service.
CMD [ "npm", "start" ]