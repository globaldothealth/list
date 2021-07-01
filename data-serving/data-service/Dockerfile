# Docker file for data service.
# Follows multi-staged build where "dev" can be used for development
# and "prod" follows security best-practices and uses a trimmed down image.
FROM node:14 as dev

# Create app directory
WORKDIR /usr/src/app/data-serving/data-service

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY data-serving/data-service/package*.json ./

# Run with node env set to production.
# This also tells yarn not to install dev dependencies
ENV NODE_ENV production

# clean install
RUN npm i -g yarn
RUN yarn install

# Bundle app source
COPY data-serving/data-service/. .

# Bundle common files
COPY common/* ../../common/

# Build the app
RUN yarn run build

# Expose service on port 3000.
EXPOSE 3000
# Expose v8 inspector on port 9229.
# If you start node with the --inspect option you'll be able to connnect by pointing Chromium to chrome://inspect
# EXPOSE 9229

# Specify a command for up to this step.
CMD [ "yarn", "run", "start" ]

# Multi-staged build, we don't need a full node image to run the app.
FROM node:12-alpine as prod

# No need to run as root.
USER node

WORKDIR /usr/src/app/

# Copy compiled app from previous stage.
COPY --from=dev /usr/src/app/data-serving/data-service/node_modules ./node_modules
COPY --from=dev /usr/src/app/data-serving/data-service/api ./api
COPY --from=dev /usr/src/app/data-serving/data-service/dist ./dist

# Start service, do not use npm start instead invoke node directly
# to avoid wrapping the process uselessly and correctly catch SIGTERM and SIGINT.
CMD [ "node", "dist/server.js" ]