# Development
`yarn install` to setup

`yarn start` to run

## Environment

`.env.example` demonstrates the environment variable that must be set.

### MySQL

A MySQL server must be running in order for the app to work.

#### Windows 10

The easiest was to get this running on Windows is to use Docker.

1. Install [VirtualBox](https://www.virtualbox.org/).
1. Install [Docker Toolbox](https://docs.docker.com/toolbox/toolbox_install_windows/).
  (Chocolatey command `choco install -y docker-toolbox -ia /COMPONENTS="desktopicon,modifypath,upgradevm,kitematic,dockercompose"`). Docker Toolbox is necessary to run Docker on Windows 10 Home, since Hyper Visor is locked behind upgraded versions of Windows 10.
1. Run Docker Quickstart terminal and Virtualbox to get everything setup (I don't know if this is necessary)
1. Setup a `mysql-server` instance using the instructions here: https://hub.docker.com/r/mysql/mysql-server/. Make sure to use `-p 3306:3306` to ensure the port is forwarded correctly. You may need to create a new user to allow remote connections to the server (see https://stackoverflow.com/a/1559992/1222411). Also, make sure to set the new user password with `mysql_native_password`: https://github.com/mysqljs/mysql/issues/2046#issuecomment-396039909
1. Create a new database https://dev.mysql.com/doc/refman/8.0/en/creating-database.html
1. Set the environment variables based on this.