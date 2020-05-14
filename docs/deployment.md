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
11. Create a GA app and set `GA_TRACKING_ID`
12. Start the instance
13. Login with the master account
14. Set the `SPOTIFY_ACCOUNT_ACCESS_TOKEN` and `SPOTIFY_ACCOUNT_REFRESH_TOKEN` variables.

### Optional: configure automated database backups

1. Setup an AWS S3 bucket (no public access)
2. Setup an IAM user, with permissions to access the bucket. [Amazon documents the minimal permissions required for a single bucket,](https://aws.amazon.com/premiumsupport/knowledge-center/s3-console-access-certain-bucket/) but I'll repeat those here:
```
{
   "Version":"2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Action":[
            "s3:ListBucket"
         ],
         "Resource":"arn:aws:s3:::awsexamplebucket"
      },
      {
         "Effect":"Allow",
         "Action":[
            "s3:PutObject",
            "s3:GetObject"
         ],
         "Resource":"arn:aws:s3:::awsexamplebucket/*"
      }
   ]
}
```
3. Use `dokku mysql:backup-auth $SERVICE AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY` to attach credentials to the database server
4. Use `dokku mysql:backup $SERVICE $BUCKET_NAME` to test settings.
5. Schedule regular backups, for example `dokku mysql:backup-schedule $SERVICE "0 3 * * *" $BUCKET_NAME` backs up every day at 3 am

#### Restoring from a created backup

Extract the backup. The `export` file can be imported using `dokku mysql:import` or an external tool like DBeaver.