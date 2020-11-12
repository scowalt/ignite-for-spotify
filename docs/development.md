# Development
`yarn install` to setup

`yarn start` to run

## Environment

`.env.example` demonstrates the environment variable that must be set.

### MySQL

This app uses a MySQL server to store its data. It's possible to setup a docker container locally and configure it to work. It's also possible to setup a MySQL server on your local dev box. However, for development purposes, I prefer to use a free service that does all of this for you. There are good [free DBaaS options listed here](https://github.com/ripienaar/free-for-dev#dbaas).

#### Docker server

- Install `docker-desktop` and `docker-cli`
- `docker pull mysql/mysql-server`
- `docker run --name=mysql1 -d mysql/mysql-server -p 6603:3306`
- `docker logs mysql1` to find the password
- `docker exec -it mysql1 mysql -uroot -p`, enter the password
- `mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY '[newpassword]';`
- `mysql> CREATE USER 'myuser'@'localhost' IDENTIFIED BY 'mypass';`
- `mysql> CREATE USER 'myuser'@'%' IDENTIFIED BY 'mypass';`
- `mysql> GRANT ALL ON *.* TO 'myuser'@'localhost';`
- `mysql> GRANT ALL ON *.* TO 'myuser'@'%';`
- `mysql> quit`

### Redis

[Redis](https://redis.io/) is used by [bull](https://optimalbits.github.io/bull/) to queue packages. Fortunately, Redis is simple to get up and running. On Windows, use [this chocolatey package](https://chocolatey.org/packages/redis-64) to install the server binaries, then run `redis-server`. If you want to avoid setting up anything locally, [redislabs](https://redislabs.com/redis-enterprise-cloud/pricing/) offers a free tier.

#### Docker server

- Install `docker-desktop` and `docker-cli`
- `docker pull redis`
- `docker run --name=redis1 -p 6379:6379 -d redis redis-server`
