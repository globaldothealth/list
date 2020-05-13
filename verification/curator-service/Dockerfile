# This dockerfile builds the curator API service and its UI in a single container.
# The UI is served as a static resource from the curator API service express server.
FROM node:12

# Build the curator service.
WORKDIR /usr/src/app/verification/curator-service/api
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY verification/curator-service/api/package*.json ./
# RUN npm clean install
RUN npm ci
# Bundle app source
COPY verification/curator-service/api/. .
# Bundle common files
COPY common/* ../../../common/
# Build the app
RUN npm run-script build
# Expose service on port 3001.
EXPOSE 3001

# Build the UI
WORKDIR /usr/src/app/verification/curator-service/ui
# Install app dependencies
COPY verification/curator-service/ui/package*.json ./
# RUN npm clean install
RUN npm ci
# Bundle app source
COPY verification/curator-service/ui/. .
# Build the app.
ENV REACT_APP_LOGIN_URL /auth/google
RUN npm run-script build

# Go back to curator service
WORKDIR /usr/src/app/verification/curator-service/api
# Set environment variable to serve static files from built UI.
ENV STATIC_DIR /usr/src/app/verification/curator-service/ui/build
# Start service.
CMD [ "npm", "start" ]