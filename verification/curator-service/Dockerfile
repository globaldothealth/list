# This dockerfile builds the curator API service and its UI in a single container.
# The UI is served as a static resource from the curator API service express server.
# Security best practices are followed and a trimmed down image is used for production serving.
FROM node:14 as builder

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
RUN npm run build
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
# Set the public (but restricted to our domains) mapbox token.
# A more flexible solution to be able to run that image on other domains would
# be for the curator service to expose the tokens via an API but this is much
# simpler for now and again, this is public so fine to be checked-in an image.
ENV REACT_APP_PUBLIC_MAPBOX_TOKEN "pk.eyJ1IjoiaGVhbHRobWFwIiwiYSI6ImNrYzNjczdmczA3cTQyc3M1bHdndHVjZWsifQ.0qMMMDRA3p1VeBQvXKpfdQ"
RUN npm run build


# Multi-staged build, use a trimmed down version of node for prod.
FROM node:alpine as prod

# No need to run as root.
USER node

# Run with node env set to production.
ENV NODE_ENV production

# TODO: Remove this pending https://github.com/globaldothealth/list/issues/961.
# Run with node debug mode set to http, net, and tls.
ENV NODE_DEBUG http,net,tls

# Set up a working directory to run our app from.
WORKDIR /usr/src/app/

# Copy compiled app from previous stage.
COPY --from=builder /usr/src/app/verification/curator-service/api/node_modules ./node_modules
COPY --from=builder /usr/src/app/verification/curator-service/api/openapi ./openapi
COPY --from=builder /usr/src/app/verification/curator-service/api/dist ./dist
COPY --from=builder /usr/src/app/verification/curator-service/ui/build ./fe
# Set environment variable to serve static files from built UI.
ENV STATIC_DIR /usr/src/app/fe
ENV AFTER_LOGIN_REDIRECT_URL /

# Start service, do not use npm start instead invoke node directly
# to avoid wrapping the process uselessly and correctly catch SIGTERM and SIGINT.
CMD [ "node", "dist/server.js" ]