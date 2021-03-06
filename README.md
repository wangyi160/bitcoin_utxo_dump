
How it works

Offline mode:
The official bitcoin client (https://github.com/bitcoin/bitcoin) store utxo information in data/testnet3/chainstate (for testnet) or data/mainnet/chainstate (for mainnet). This chainstate folder contains leveldb files, bitcoin_utxo_dump read and parse data from leveldb and write the result into multiple json files (100000 entries every file). Use mongoimport to import data files into mongodb.

Online mode:
After the offline dump(about 30 minutes), we nearly have 99% utxo in database. We can fetch data from bitcoind rpc service and parse in real time to make latest utxos.

------------------------------------------------------------------------------------------------------

How to use it

It use flow (https://flow.org/) as the type checker for nodejs as it is a good habbit to write js program with typed style. Although it may not be necessary for this small project, but I follow the good pratice. 
Note: node version should only be 8.x in order to use level lib.

0. stop bitcoind

because leveldb cannot be accessed by multiple clients, so you have to stop bitcoid to read chainstate. Yes, it just make a utxo dump for a snapshot of the blockchain. But it provides a quick and good foundation if you need real time utxo information later by processing through bitcoind rpc service.

1. yarn install

install the node modules needed for the project

2. make directory csv

csv folder contains the generated csv files (out*.csv)

3. make directory lib

lib folder contains the js files for running

4. modify the chainstate path in src/index.js

replace your chainstate path here in line 14

    const db = level('{chainstate path}', { keyEncoding: 'hex', valueEncoding: 'hex' });

5. yarn run flow

check the type annotation in src/* files

6. yarn run build

generate runnable js files in lib folder

7. node lib/index.js

start read data from leveldb in chainstate folder, generate json files in csv folder, it takes a while to finish. For testnet, there are about 22000000 entries at this time ( 2019.06.04 ), which will generate 200+ json files. 

record latest block hash and get latest block height.

8. import data into mongodb (windows only)

modify dbimport.bat, replace db name and collection name in line 4  

    mongoimport /d {db} /c {collection} /type json /file csv\%%G /jsonArray 

9. node lib/btcindex.js

modify the block height in line 190

------------------------------------------------------------------------------------------------------

Acknowledgement

This project's offline dump tool is basically a nodejs reimplementation from https://github.com/in3rsha/bitcoin-utxo-dump. 







