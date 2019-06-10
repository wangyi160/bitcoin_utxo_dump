#!/bin/bash
for filename in csv/out*.csv; do
    echo "mongoimport -d mydb -c btcutxo --type json --file $filename --jsonArray"
done