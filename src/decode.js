
// @flow

'use strict';

var bigi = require("bigi");
// const assert = require('assert');
// const crypto = require('crypto');
const bcrypto = require('bitcoinjs-lib').crypto;
const bs58check = require('bs58check');
const bech32 = require('bech32');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');


// var v = "1e5d97c7b490b3fb2b0c5f5e76490393b9d68cd093e20aab7eb70457b7a66f86";
// var k = "c5b60457b7a66f86";

// var decode = v.xor(k);

function reverseHex(str: string)
{
    let ret="";

    for(var i=str.length-1; i>=0; i-=2)
    {
        ret+=str[i-1]+str[i];
    }

    return ret;
}


function deobfuscate(raw: string, obfKey: string): string
{
    let key="";

    let i = 0;
    let j = 0;
    while(i<raw.length)
    {
        key += obfKey[j];
        i++;
        j++;
        
        if(j>=obfKey.length)
            j=0;
    }

    // console.log(key);
    
    var v = bigi.fromHex(raw);
    var k = bigi.fromHex(key);

    var decode = v.xor(k);
    
    return decode.toHex();

}

// console.log(deobfuscate(v,k));


// console.log(decode.toHex());
// console.log(reverseHex(decode.toHex()));

// var recordKey='4300000136ea56f3b0ee8fbb13059cbd4521ba38074fd9832a86f4335cd7d2267c00';
// console.log(reverseHex(recordKey));

function decodeRecordKey(key: string)
{
    let C = key.substring(0,2);
    if(C != "43")
    {
        throw new Error(C + 'seems invalid record key');
    }

    let txidLe = key.substring(2, 66);
    let txid = reverseHex(txidLe);

    let index = key.substring(66);
    let { ret: num, raw } = varint128Read(index);
    
    // console.log("vout:"+vout);
    // console.log("txid:"+txid);

    return { num, txid };
}

function varint128Read(value: string)
{
    let ret=0;
    let i=0;

    while(i<value.length )
    {
        
        let y = parseInt(value[i]+value[i+1], 16);
        let msg = (y & 128) >> 7;
      
        ret = ( (ret<<7) | (y&127) ) + msg;
        
        i += 2;
        // console.log(ret); 
        
        if(msg==0)
            break;
    }

    let raw = value.substring(i);

    return { ret, raw };
}

/** 
 * @param {number} x 
 */
function decompressAmount(x)
{
    
    if (x==0)
    {
        // console.log("nvalue is zero");
        return 0;
    }
    
    x--;
    // // x = 10*(9*n + d - 1) + e

    let e = x % 10;
    x = Math.floor(x/10);
    
    // uint64_t n = 0;
    let n = 0;

    if (e < 9) {
        //     // x = 9*n + d - 1
        let d = (x % 9) + 1;
        x = Math.floor(x/9);
       
        //     // x = n
        n = x*10 + d;       
    } else {
        n = x+1;
    }
    while (e>0) {
        n *= 10;
        e--;
    }

    // console.log(n);
    return n;
}

function p2pkhAddress(hash: Buffer, testnet: boolean)
{
    
    const payload = Buffer.allocUnsafe(21);

    let pubKeyHash;
    if(testnet)
        pubKeyHash = 0x6f;
    else
        pubKeyHash = 0x00;

    payload.writeUInt8(pubKeyHash, 0);
    hash.copy(payload, 1);
    return bs58check.encode(payload);    
    
}

function p2shAddress(hash: Buffer, testnet: boolean)
{
    
    const payload = Buffer.allocUnsafe(21);

    let scriptHash;
    if(testnet)
        scriptHash = 0xc4;
    else
        scriptHash = 0x05;

    payload.writeUInt8(scriptHash, 0);
    hash.copy(payload, 1);
    return bs58check.encode(payload);    
    
}

function p2wpkhAddress(hash: Buffer, testnet: boolean)
{
    hash = hash.slice(2, 22);

    const words = bech32.toWords(hash);
    words.unshift(0x00);

    let bech32Code;
    if(testnet)
        bech32Code = 'tb';
    else
        bech32Code = 'bc';

    return bech32.encode(bech32Code, words); 
    
}

function p2wshAddress(hash: Buffer, testnet: boolean)
{
    hash = hash.slice(2);

    const words = bech32.toWords(hash);
    words.unshift(0x00);

    let bech32Code;
    if(testnet)
        bech32Code = 'tb';
    else
        bech32Code = 'bc';

    return bech32.encode(bech32Code, words); 
    
}

function p2pkAddress(pubkey: Buffer, testnet: boolean)
{
    const hash = bcrypto.hash160(pubkey);
    return p2pkhAddress(hash, testnet); 
}



function decodeRecordValue(value: string, obfKey: string, testnet: boolean = false)
{
    let raw = deobfuscate(value, obfKey);
    // console.log(raw);

    // step 1, get height, coinbase
    let { ret: code, raw: raw2 } = varint128Read(raw);
    
    let height = Math.floor(code / 2);
    let isCoinBase = code % 2;
    // console.log("block height:"+height);
    // if(isCoinBase)
    //     console.log("is coinbase");
    // else
    //     console.log("is not coinbase");

    // step 2, get amount 
    let { ret: nValue, raw: raw3 } = varint128Read(raw2);
    let amount = decompressAmount(nValue);
    // console.log("nValue:"+nValue);
    // console.log("amount:"+amount);
    
    // step 3, get nSize
    let{ ret: nSize, raw: raw4 } = varint128Read(raw3);
    // console.log("nSize:"+nSize);
    // console.log(raw4);

    let script = raw4;
    // 2,3,4,5
    if(nSize >1 && nSize < 6)
    {
        // one byte backword
        script = raw3;
    }

    let scriptBuffer = Buffer.from(script, "hex");
    let address = "unknown" ;
    let scriptType ="unknown";
    
    // P2PKH, 使用ripmend160+base58
    if(nSize == 0)
    {
        address = p2pkhAddress(scriptBuffer, testnet);
        scriptType="p2pkh";

    }
    
    // P2SH, 使用ripmend160+base58
    else if( nSize ==1 )
    {
        address = p2shAddress(scriptBuffer, testnet);
        scriptType="p2sh";

    }
    
    // P2PK, 使用ripmend160+base58
    else if( nSize>1 && nSize<6)
    {
        scriptType = "p2pk";
        //let pubkey = scriptBuffer.slice(1);

        // compressed pubkey
        if(nSize==2 || nSize==3)
        {
            address = p2pkAddress(scriptBuffer, testnet);
        }
        // uncompressed pubkey
        else
        {
            let prefix = nSize -2; // 0x02 or 0x03
            let pubkeyX = scriptBuffer.slice(1); // 32 bytes

            let pubkeyC = Buffer.concat([Buffer.from([prefix]), pubkeyX]);
            // console.log(pubkeyC);

            let pubkeyU = ec.keyFromPublic(pubkeyC, 'hex').getPublic(false, 'hex');
            
            let pubKeyUBuffer = Buffer.from(pubkeyU, 'hex');
            // console.log(pubKeyUBuffer);
            
            address = p2pkAddress(pubKeyUBuffer, testnet);
        }

    }
    
    else
    {
        // P2MS, 不生成地址
        if(scriptBuffer.length>0 && scriptBuffer[scriptBuffer.length-1] == 174)
        {
            scriptType = "p2ms";
        }

        // P2WPKH, 使用bech32
        else if(nSize ==28 && scriptBuffer[0] == 0 && scriptBuffer[1]==20)
        {
            
            address = p2wpkhAddress(scriptBuffer, testnet);
            scriptType = "p2wpkh";
            
        }

        // P2WSH, 使用bech32
        else if(nSize ==40 && scriptBuffer[0] == 0 && scriptBuffer[1]==32)
        {
            
            address = p2wshAddress(scriptBuffer, testnet);
            scriptType = "p2wsh";
        
        }
    }

    // if(scriptType == "p2pk")
    // {
    //     console.log("script type:"+scriptType);
    //     console.log("address:"+address);
    // }

    return { address, scriptType, amount, height, isCoinBase };
    

}


/** 
 * @param {string} x 
 */
function varint(x)
{
    let ret=0;
    for(var i=0; i<x.length; i+=2)
    {
        
        let y = parseInt(x[i]+x[i+1], 16);
        let msg = (y & 128) >> 7;
      
        ret = ( (ret<<7) | (y&127) ) + msg;
 
        // console.log(ret);  
    }

    return ret;
}

// let nValue = varint("32");
// console.log(nValue);



// var nValue2=bigi.valueOf("10");
// console.log(nValue2.toRadix(10));



module.exports = { deobfuscate, reverseHex, decodeRecordKey, decodeRecordValue };

// DecompressAmount(nValue);

