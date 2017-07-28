FROM node:boron

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app
COPY package-lock.json /app
RUN npm install

# Bundle app source
COPY . /app

EXPOSE 5000

CMD node app.js