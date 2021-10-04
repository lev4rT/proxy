#!/bin/sh

openssl req -new -nodes -newkey rsa:2048 -keyout "keys/$1.key" -out "keys/$1.csr" -subj "/C=US/ST=$1"
openssl x509 -req -sha256 -days 300 -in "keys/$1.csr" -CA ca.pem -CAkey ca.key -CAcreateserial -extfile "cfgs/$1.ext" -out "certificates/$1.crt"