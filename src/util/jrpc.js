
// @flow
'use strict';

// curl --user blackpai:DESjuHw3A_KHCi77hCSdfLT6HNPgXglloPHodk9nAsQ= --data-binary '{"jsonrpc": "1.0", "id":"curltest", "method": "getblockcount", "params": [] }' -H 'content-type: text/plain;' http://127.0.0.1:28332/
const request = require('request');

import type {btcauth} from './types';
import type {btcjson} from './types';

const build = (method: string, params: Array<mixed>) => {
    const data = {
        jsonrpc: '1.0',
        id: 'curltest',
        method,
        params,
    }
    return data;
}


const postJsonPromise = (url: string, auth: btcauth, json: btcjson) : Promise<any>  => {
    return new Promise((resolve, reject) => {
        request.post({
            url,
            auth,
            json,
        }, (error, response, body) => {
            if (error) {
                reject(error);
                return;
            }
            if (response.statusCode >= 400) {
                reject({
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                })
                return;
            }
                        
            resolve(body);
        })
    })
}

module.exports = { build, postJsonPromise }

