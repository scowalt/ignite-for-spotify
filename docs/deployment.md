# Deployment

## Setting up the dokku instance
These instructions are not complete. They provide general guidence and a reference.

1. Create an app with `dokku apps:create $NAME`
2. [By default, dokku will use port 5000 for Procfile apps.](https://github.com/dokku/dokku/blob/master/docs/networking/port-management.md) Set the `PORT` environment variable with `dokku config:set $NAME PORT=5000`
3. [Register an application with the Spotify API.](https://developer.spotify.com/dashboard/applications) Use that information to set the `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` variables. Make sure the application is configured with the proper redirect / callback URL
4. Configure the domain for the app: `dokku domains:add $NAME foo.bar.com`
5. Add SSL certs for the domain: `dokku certs:add $NAME < certs.tar`
6. Set domain environment variable: `dokku config:set $NAME BASE_URL=https://foo.bar.com`
7. Set `IGNITION_COOKIE_KEY` and `IGNITION_COOKIE_VALUE` (for now this is secret sauce).
8. Set any other environment variables that aren't explicitly mentioned elsewhere here.
9. Link a redis server instance to the app to get `REDIS_URL` set: `dokku redis:create $REDISSERVICENAME` followed by `dokku redis:link $REDISSERVICENAME $NAME`
10. Link a MySQL server instance to the app to get `DATABASE_URL` set: `dokku mysql:create $MYSQLSERVICENAME` followed by `dokku mysql:link $MMYSQLSERVICENAME $NAME`
11. Start the instance
12. Login with the master account
13. Set the `SPOTIFY_ACCOUNT_ACCESS_TOKEN` and `SPOTIFY_ACCOUNT_REFRESH_TOKEN` variables.