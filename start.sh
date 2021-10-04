#!/bin/sh

cat ./ca.crt >> /etc/ssl/certs/ca-certificates.crt
docker build -t proxy .
docker run -p 8080:8080 -p 8081:8081 proxy