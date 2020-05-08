FROM node:12

# Create app directory
WORKDIR /usr/src/app/verification/curator-service/api

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY verification/curator-service/api/package*.json ./

# RUN npm clean install
RUN npm ci

# Bundle app source
COPY verification/curator-service/api/. .

# Build the app
RUN npm run-script build

# Expose service on port 3001.
EXPOSE 3001

# Start service.
CMD [ "npm", "start" ]