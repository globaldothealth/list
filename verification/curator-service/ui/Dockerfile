FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# RUN npm clean install
RUN npm ci

# Bundle app source
COPY . .

# Expose service on port 3002.
EXPOSE 3002

# Start service, will trigger a build.
# Environment variables must be passed, notably:
# - PORT
CMD [ "npm", "run-script", "start-noenv" ]