#!/bin/sh
echo Set up or update workflow fast
cd /project
echo Building workflow project
mvn install -DskipTests
echo Shutdown Tomcat for safer deploy
$TOMCAT_HOME/bin/shutdown.sh
echo Copy WAR to webapps dir
WAR_SRC=/project/wf-dniprorada/target/wf-dniprorada.war
TOMCAT_WEBAPPS_DIR=$TOMCAT_HOME/webapps
cp $WAR_SRC $TOMCAT_WEBAPPS_DIR
echo Start Tomcat
$TOMCAT_HOME/bin/startup.sh

