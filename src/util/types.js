// @flow

'use strict';

export type btcauth = 
{
    user: string, 
    pass: string
};

export type blockStruct =
{
    hash: string,
    height: number,
    tx: Array<txStruct>
};

export type txStruct =
{
    txid: string,
    vin: Array<vinStruct>,
    vout: Array<voutStruct>
};

export type vinStruct = 
{
    txid: string,
    vout: number
};

export type voutStruct = 
{
    value: number,
    n: number,
    scriptPubKey: scriptPubKeyStruct
};

export type scriptPubKeyStruct = 
{
    addresses?: Array<string>,
    type: string
};

export type btcjson = 
{
    jsonrpc: string,
    id: string,
    method: string,
    params: Array<mixed>
};




