# local
`bash ./gen_ca.sh`

`sudo cat ./ca.crt >> /etc/ssl/certs/ca-certificates.crt`

`mkdir certificates keys cfgs && sudo chmod ugo+rwx ./certificates ./cfgs ./keys`

`sudo su postgres -c "psql -f start.sql"`

PROXY: `npm start` (:8080)

PROXY: `npm run api` (:8081)


# docker

`bash ./gen_ca.sh`

`sudo ./start.sh`