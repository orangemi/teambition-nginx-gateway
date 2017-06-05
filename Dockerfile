FROM node:6-alpine
MAINTAINER Orange Mi<orangemiwj@gmail.com>

RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY . /app
RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]