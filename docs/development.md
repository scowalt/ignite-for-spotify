# Development
`yarn install` to setup

`yarn start` to run

## Environment

`.env.example` demonstrates the environment variable that must be set.

### MySQL

This app uses a MySQL server to store its data. It's possible to setup a docker container locally and configure it to work. It's also possible to setup a MySQL server on your local dev box. However, for development purposes, I prefer to use a free service that does all of this for you. Here are a few options:

- [AWS RDS](https://aws.amazon.com/rds/free/) using the MySQL community free tier
- [RemoteMySQL](https://remotemysql.com/)

### Redis

[Redis](https://redis.io/) is used by [bull](https://optimalbits.github.io/bull/) to queue packages. Fortunately, Redis is simple to get up and running. On Windows, use [this chocolatey package](https://chocolatey.org/packages/redis-64) to install the server binaries, then run `redis-server`. If you want to avoid setting up anything locally, [redislabs](https://redislabs.com/redis-enterprise-cloud/pricing/) offers a free tier.