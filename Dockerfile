FROM node:10-alpine
WORKDIR /home/nodejs/node/twangry
ADD . /home/nodejs/node/twangry
RUN npm i
RUN npm install --unsafe-perm
ENV NODE_ENV=production
EXPOSE 8080
CMD while [ 1 ]; do node twangry.js --port=$PORT; sleep 1; done
