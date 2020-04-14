# Development
`yarn install` to setup

`yarn start` to run

## Environment

`.env.example` demonstrates the environment variable that must be set.

### MySQL

A MySQL server must be backed by a MySQL server (see `.env.example`). It's possible to setup a docker container locally and configure it to work. It's also possible to setup a MySQL server on your local dev box. However, for development purposes, I prefer to use a free service that does all of this for you. Here are a few options:

- [AWS RDS](https://aws.amazon.com/rds/free/) using the MySQL community free tier
- [RemoteMySQL](https://remotemysql.com/)