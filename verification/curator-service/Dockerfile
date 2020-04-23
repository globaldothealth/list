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

# Build the app
RUN npm run-script build

# Expose service on port 3000.
EXPOSE 3000

# Start service.
CMD [ "npm", "start" ]