#!/bin/bash

# chmod u+x <filename>n

redis-server &
npm run watch &
npm run dev &