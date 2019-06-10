
// @flow

'use strict';

const jrpc = require('./jrpc');
const log4js = require('log4js');
const logger = log4js.getLogger();


import type {btcauth} from './types';
import type {blockStruct} from './types';
import type {txStruct} from './types';
import type {vinStruct} from './types';
import type {voutStruct} from './types';
import type {scriptPubKeyStruct} from './types';



class ReqUtil {
    
    url: string;
    auth: btcauth;
    status: { useable: boolean, updatedAt: number };
    logger: log4js.Logger;
    
    constructor(url: string, auth: btcauth ) {
        
        this.url = url;
        this.auth = auth;
        this.status = {
            useable: true,
            updatedAt: Date.now(),
        }
        this.logger = logger
    }

    async checkIsAlive() {
        try {
            const n = await this.getBlockCount()
            this.logger.debug(`Node ${this.url} live`, n)
            this.status = { useable: true, updatedAt: Date.now() }
            return n
        } catch (e) {
            this.logger.warn(`Node ${this.url} not live and reconnect`)
            this.status = { useable: false, updatedAt: Date.now() }
        }
        return false
    }

    /*
     * 获取块高
     */
    async getBlockCount() {
        const jsonA = jrpc.build('getblockcount', []);
        

        const data = await jrpc.postJsonPromise(this.url, this.auth, jsonA);
        
        let ret: number = (data.result: number);
        return ret;
                
    }

    async getBlockByHeight(height: number) {
        const jsonA = jrpc.build('getblockhash', [height]);
        const hashData = await jrpc.postJsonPromise(this.url, this.auth, jsonA);
        
        
        // let jsonB = jrpc.build('getblock', [hashData.result, false]); //hex
        const jsonB = jrpc.build('getblock', [hashData.result, 2]); // hex
        const txData = await jrpc.postJsonPromise(this.url, this.auth, jsonB);

        
        // return txData.result;
        let ret: blockStruct = txData.result;

        return ret;
      
    }

    async getBlockByHash(hash: string) {
        // let jsonB = jrpc.build('getblock', [hashData.result, false]); //hex
        const jsonB = jrpc.build('getblock', [hash, 2]); // hex
        const txData = await jrpc.postJsonPromise(this.url, this.auth, jsonB);
        
        // return txData.result;
        let ret: blockStruct = txData.result;

        return ret;
        
    }

    // getTransactions(1350840)
    /*
     * 通过txid获取一个交易信息
     * @param txid
     * @returns {Promise<"inspector".Runtime.RemoteObject | "inspector".Runtime.PropertyDescriptor[] | "inspector".Debugger.SearchMatch[] | "inspector".Profiler.ScriptCoverage[] | * | result>}
     */
    async getRawTransaction(txid: string, format: number = 1) {

        // let jsonA = jrpc.build('getrawtransaction', [txid, 1]);
        const jsonA = jrpc.build('getrawtransaction', [txid, format]);
        const transData = await jrpc.postJsonPromise(this.url, this.auth, jsonA);

        let ret: txStruct = transData.result;
        return ret;
    }

    
    async decoderawtransaction(hex: string) {
        const jsonA = jrpc.build('decoderawtransaction', [hex]);
        const transData = await jrpc.postJsonPromise(this.url, this.auth, jsonA);
        return transData.result;
    }

    
}


module.exports = ReqUtil
