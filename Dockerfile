FROM node:12

ADD . /opt/build/node/
WORKDIR /opt/build/node/
RUN mkdir certificates keys cfgs
RUN chmod ugo+rwx ./certificates ./cfgs ./keys

RUN npm install
EXPOSE 8080
EXPOSE 8081

CMD npm run start & npm run api