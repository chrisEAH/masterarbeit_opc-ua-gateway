#!/bin/bash

set -e

if [ "$ENV" = "TEST" ]
    then
    echo "running Unit Test"

else
    echo "running Production"
    npm start
fi