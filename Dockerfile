###################################
#Build stage
FROM ubuntu:18.04

# Create app directory
WORKDIR /usr/src/app

# Install Node.js 12.x
RUN apt update
RUN apt upgrade -y
RUN apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs
RUN apt -y install zip


# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]