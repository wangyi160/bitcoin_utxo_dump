
// @flow

'use strict';

const level = require('level');
// const fastcsv = require('fast-csv');  
const fs = require('fs');  


const { deobfuscate, reverseHex, decodeRecordKey, decodeRecordValue } = require('./decode');

// replace your chainstate path here.
const db = level('E:/bitcoinj/data/testnet3/chainstate2', { keyEncoding: 'hex', valueEncoding: 'hex' });

let obfKey: string;
let latestBlockHash: string;

// let cs;
// let ws;

let count=0;
let fileNo=0;
let writeData=[];

function readLeveldb()
{
    
    const rr = db.createReadStream({ });


    rr.on('data', onData);
    rr.on('error', function (err) {
        console.log('Oh my!', err)
    });
    rr.on('close', function () {
        console.log('Stream closed');
        
        fs.writeFile("csv/out"+(fileNo)+".csv", JSON.stringify(writeData), callback);
        
    });
    rr.on('end', function () {
        console.log('Stream ended')

        console.log("obfKey:"+obfKey);
        console.log("lastest block hash:"+latestBlockHash);

    });
}

function callback(err)
{

}

function onData(data)
{
    try {
    
                    
        if (data.key == '0e006f62667573636174655f6b6579') 
        {
            obfKey = data.value.substring(2);
            console.log("obfuscate_key", data)
        } 
        else if(data.key == '42')
        {
            latestBlockHash = reverseHex( deobfuscate(data.value, obfKey) ) ;
            console.log("B", data)
        }
        else {
            // console.log("record", data)
            let { num, txid } = decodeRecordKey(data.key);
            let { address, scriptType, amount, height, isCoinBase } = decodeRecordValue(data.value, obfKey, true);

            
                
            // write to a new csv file every 100000 entries

            let update = {txid: txid, vout: num, voutCount: -1, address: address, value: amount/100000000, 
                scriptPubKey: { type: scriptType, addresses: [address] }, 
                blockHeight: height, locked: false, lockedId: ""};
            
            if(count % 100000 ==0)
            {
                fileNo = count/100000;
                
                // fs.close();

                // if(cs)
                //     cs.end();

                // cs = fastcsv.createWriteStream({headers: true});
                // ws = fs.createWriteStream("csv/out"+fileNo+".csv"); 
                // cs.pipe(ws);


                if(fileNo>0)
                {
                    fs.writeFile("csv/out"+(fileNo-1)+".csv", JSON.stringify(writeData), callback);
                }

                writeData=[];
                writeData.push(update);
            }
            else
            {
                            
                // cs.write(update);
                
                writeData.push(update);
            }

            count++;
            // }
            
        }
    }
    catch(e)
    {
        console.log(e.message);
    }
}

// write to multiple csv files
readLeveldb();

