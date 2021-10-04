# Функционал

1. Проксирование HTTP запросов
2.  Проксирование HTTPS запросов
3.  Повторная отправка проксированных запросов
4.  Сканер уязвимости
* XSS - во все GET/POST параметры попробовать подставить по очереди `vulnerable'"><img src onerror=alert()>` В ответе искать эту же строчку, если нашлась, писать, что данный GET/POST


# веб-апи
## /requests – список запросов
## /requests/id – вывод 1 запроса
## /repeat/id – повторная отправка запроса
## /scan/id – сканирование запроса


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
