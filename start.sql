DROP DATABASE IF EXISTS proxy;
CREATE DATABASE proxy;

DROP TABLE IF EXISTS requests;
CREATE TABLE requests(
    id SERIAL,
    method varchar,
    host varchar,
    port int,
    path varchar,
    headers varchar,
    ssl bool,
    request varchar,
    response varchar,
    request_body varchar);