# Docker file for data service.
# Follows multi-staged build where "dev" can be used for development
# and "prod" follows security best-practices and uses a trimmed down image.
FROM node:14.17.1 as dev

# Create app directory
WORKDIR /usr/src/app/data-serving/data-service

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY data-serving/data-service/package*.json ./

# Try to avoid cb not called error in CI
RUN npm cache clean --force
# RUN npm clean install
RUN npm ci

# Bundle app source
COPY data-serving/data-service/. .

# Bundle common files
COPY common/* ../../common/

# Build the app
RUN npm run build

# Expose service on port 3000.
EXPOSE 3000
# Expose v8 inspector on port 9229.
# If you start node with the --inspect option you'll be able to connnect by pointing Chromium to chrome://inspect
# EXPOSE 9229

# Specify a command for up to this step.
CMD [ "npm", "start" ]

# Multi-staged build, we don't need a full node image to run the app.
FROM node:14.17.1-alpine as prod

# No need to run as root.
USER node

# Run with node env set to production.
ENV NODE_ENV production

WORKDIR /usr/src/app/

# Copy compiled app from previous stage.
COPY --from=dev /usr/src/app/data-serving/data-service/node_modules ./node_modules
COPY --from=dev /usr/src/app/data-serving/data-service/api ./api
COPY --from=dev /usr/src/app/data-serving/data-service/dist ./dist

# Start service, do not use npm start instead invoke node directly
# to avoid wrapping the process uselessly and correctly catch SIGTERM and SIGINT.
CMD [ "node", "dist/server.js" ]