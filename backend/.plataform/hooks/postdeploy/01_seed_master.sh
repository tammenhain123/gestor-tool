#!/bin/bash

echo "Running MASTER seed..."

cd /var/app/current

npm run seed:master:prod

echo "Seed finished."