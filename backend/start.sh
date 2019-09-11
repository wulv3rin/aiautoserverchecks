#!/bin/bash
export MongoDbHost=localhost
export MongoDbSid=aiAutoServerCheck
export DEBUG=app:*
cd /opt/ai/aiautoserverchecks/backend/
node main.js > ./backend.log
