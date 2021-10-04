#!/bin/sh

openssl req -x509 -nodes -new -sha256 -days 300 -newkey rsa:2048 -keyout ca.key -out ca.pem -subj "/C=US/CN=d_klsv_ROOT"
openssl x509 -outform pem -in ca.pem -out ca.crt
