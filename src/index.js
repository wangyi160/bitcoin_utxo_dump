
// @flow

'use strict';

const level = require('level');
const fastcsv = require('fast-csv');  
const fs = require('fs');  


const { deobfuscate, reverseHex, decodeRecordKey, decodeRecordValue } = require('./decode');

// replace your chainstate path here.
const db = level('<chainstate path>', { keyEncoding: 'hex', valueEncoding: 'hex' });

let obfKey: string;
let latestBlockHash: string;

let cs;
let ws;

let count=0;

function readLeveldb()
{
    
    const rr = db.createReadStream({ limit: 190000 });


    rr.on('data', onData);
    rr.on('error', function (err) {
        console.log('Oh my!', err)
    });
    rr.on('close', function () {
        console.log('Stream closed');
        
        
        cs.end();
    });
    rr.on('end', function () {
        console.log('Stream ended')

        console.log("obfKey:"+obfKey);
        console.log("lastest block hash:"+latestBlockHash);

    });
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

            if(address == "unknown")
            {
                console.log(txid+","+num+","+address+","+scriptType+","+amount+","+ height+","+isCoinBase);       
            }
            else
            {
                // console.log(txid+","+num+","+address+","+scriptType+","+amount+","+ height+","+isCoinBase); 
                
                // write to a new csv file every 100000 entries
                if(count % 100000 ==0)
                {
                    let fileNo = count/100000;
                    
                    if(cs)
                        cs.end();

                    cs = fastcsv.createWriteStream({headers: true});
                    ws = fs.createWriteStream("csv/out"+fileNo+".csv"); 
                    cs.pipe(ws);
                                    
                    console.log("processed: "+ count);
                }

                let update = {txid: txid, num: num, address: address, scriptType: scriptType, 
                    amount: amount, height: height, isCoinBase: isCoinBase};
                
                cs.write(update);
                count++;
            }
            
        }
    }
    catch(e)
    {
        console.log(e.message);
    }
}

// write to multiple csv files
readLeveldb();

