
// @flow

'use strict';


const ReqUtil = require('./util/btcreq');
const { connectPromise, findPromise, deletePromise, upsertPromise } = require('./mongo');


import type { txStruct, blockStruct } from "./util/types";

const req = new ReqUtil("http://127.0.0.1:18332", { user: "wangyi", pass: "wangyi" });



async function dumpTx(tx: txStruct, block: blockStruct) {
    
    let unFoundCount=0;
    let deleteCount=0;
    let insertCount=0;

    // delete the old utxo
    let j = 0;
    for (j = 0; j < tx.vin.length; j++) {

        
        
        
        if(tx.vin[j].txid)
        {
            // find vin in database
            let query = { txid: tx.vin[j].txid, vout: tx.vin[j].vout };
            
            let result = await deletePromise(dbo, query);
            
            // console.log(result);

            if(!result)
            {
                console.log("cannot find utxo in database");
                console.log({ txid: tx.vin[j].txid, vout: tx.vin[j].vout });
                unFoundCount++;
            }
            else
            {
                deleteCount++;
            }

            // break;
            // await sleep(1000);
        }

        
        
        // output += "{" + tx.vin[j].txid + "," + tx.vin[j].vout + "}";
    }

    

    // insert the new utxo

    for (j = 0; j < tx.vout.length; j++) {
        
        let filter = {
            txid: tx.txid, 
            vout: tx.vout[j].n, 
        }
        let upsert = { 
            txid: tx.txid, 
            vout: tx.vout[j].n, 
            voutCount: tx.vout.length,
            address: "non-standard",   
            scriptPubKey: tx.vout[j].scriptPubKey,
            value: tx.vout[j].value,
            blockHeight: block.height,
            locked: false,
            lockedId: ""
        };
                
        if(tx.vout[j].scriptPubKey.addresses && tx.vout[j].scriptPubKey.addresses.length>0)
        {
            upsert.address=tx.vout[j].scriptPubKey.addresses[0];
        }
        

        await upsertPromise(dbo, filter, upsert);
        // console.log(upsert);

        insertCount++;
        
    }

    // output += "]}";

    // console.log(output);

    return {deleteCount, insertCount, unFoundCount};
}

async function init() {
    console.log(1)
    await sleep(1000)
    console.log(2)
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}


let dbo;

async function initDb()
{
    let mongodb = await connectPromise();
    dbo = mongodb.db("mydb2");
}

// 
async function utxoDumpFromHeight(height: number) {

    if(!dbo)
        await initDb();
    
    let block = await req.getBlockByHeight(height);
    console.log(block.height);
    await sleep(1000);

    let blockcount = await req.getBlockCount();
    console.log(blockcount);
    await sleep(1000);

    let i = block.height;
    while (i <= blockcount ) {
        await utxoDumpByHeight(i);
        await sleep(1000);

        blockcount = await req.getBlockCount();
        console.log(blockcount);
        await sleep(1000);

        i++;

        // break;
    }

    // mongodb.close();

}

async function utxoDumpByHeight(height: number) {

    if(!dbo)
        await initDb();
    
    console.log("dump block "+height);
    
    let block = await req.getBlockByHeight(height);
    // console.log(block);

    let transactions: Array<txStruct> = block.tx;
    console.log(transactions.length);

    let totalInsertCount=0;
    let totalDeleteCount=0;
    let totalUnFoundCount=0;
    let i = 0;
    for (i = 0; i < transactions.length; i++) {
        console.log("dump transaction: "+ i);
        
        let { insertCount, deleteCount, unFoundCount } = await dumpTx(transactions[i], block);
        totalInsertCount+=insertCount;
        totalDeleteCount+=deleteCount;
        totalUnFoundCount+=unFoundCount;
    }

    console.log("deleted utxo:"+totalDeleteCount);
    console.log("inserted utxo:"+totalInsertCount);
    console.log("unfound utxo:"+totalUnFoundCount);
}



// 00000000000001bb2d6544248788607c156cefc1095bbaee7ddc36039093ebdb

// utxoFromHash("00000000000001bb2d6544248788607c156cefc1095bbaee7ddc36039093ebdb");
utxoDumpFromHeight(1516027);





