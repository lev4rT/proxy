FROM ubuntu:20.04 AS release

MAINTAINER Denis Kolosov

# Make the "en_US.UTF-8" locale so postgres will be utf-8 enabled by default
RUN apt -y update && apt install -y locales gnupg2
RUN locale-gen en_US.UTF-8
RUN update-locale LANG=en_US.UTF-8

#
# Install postgresql
#
ENV PGVER 12
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update -y && apt-get install -y postgresql postgresql-contrib nodejs npm

# Run the rest of the commands as the ``postgres`` user created by the ``postgres-$PGVER`` package when it was ``apt-get installed``
USER postgres

# Create a PostgreSQL role named ``docker`` with ``docker`` as the password and
# then create a database `docker` owned by the ``docker`` role.
RUN /etc/init.d/postgresql start &&\
    psql --command "CREATE USER postgres WITH SUPERUSER PASSWORD 'admin';" &&\
    createdb -O postgres postgres &&\
    /etc/init.d/postgresql stop


# Adjust PostgreSQL configuration so that remote connections to the
# database are possible.
RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/$PGVER/main/pg_hba.conf

# And add ``listen_addresses`` to ``/etc/postgresql/$PGVER/main/postgresql.conf``
RUN echo "listen_addresses='*'" >> /etc/postgresql/$PGVER/main/postgresql.conf

# Expose the PostgreSQL port
EXPOSE 5432

# Add VOLUMEs to allow backup of config, logs and databases
VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

# Back to the root user
USER root

# Объявлем порт сервера
EXPOSE 8080

ENV PGPASSWORD docker
CMD service postgresql start &&  psql -h localhost -d docker -U docker -p 5432 -a -q -f ./start.sql

FROM node:12

#NODE-prep
ADD . /opt/build/node/
WORKDIR /opt/build/node/
RUN mkdir certificates keys cfgs
RUN chmod ugo+rwx ./certificates ./cfgs ./keys
#RUN openssl req -x509 -nodes -new -sha256 -days 300 -newkey rsa:2048 -keyout ca.key -out ca.pem -subj "/C=US/CN=d_klsv_ROOT"
#RUN openssl x509 -outform pem -in ca.pem -out ca.crt
#RUN cat ca.crt >> /etc/ssl/certs/ca-certificates.crt


RUN npm install
EXPOSE 8080
EXPOSE 8081

CMD npm run start & npm run api