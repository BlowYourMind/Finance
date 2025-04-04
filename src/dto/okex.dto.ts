export interface OkexResponse {
    code: string,
    data: OkexOrder[],
    msg: string
}

export interface OkexOrder {
    clOrdId: string,
    ordId: string,
    sCode: string,
    sMsg: string,
    tag: string
}

export enum OkexWallets {
    FUNDING = '6',
    TRADING = '18',
    FUTURES = '4',
}

export interface OkexOrderInfo {
    accFillSz: string,
    algoClOrdId: string,
    algoId: string,
    avgPx: string,
    cTime: string,
    cancelSource: string,
    cancelSourceReason: string,
    category: string,
    ccy: string,
    clOrdId: string,
    fee: string,
    feeCcy: string,
    slTriggerPx: string,
    slTriggerPxType: string,
    source: string,
    state: string,
    sz: string,
    tag: string,
    tdMode: string,
    tgtCcy: string,
    tpOrdPx: string,
    tpTriggerPx: string,
    tpTriggerPxType: string,
    tradeId: string,
    uTime: string
}

export interface OkexInstrument {
    instType: string,
    instId: string,
    uly: string,
    category: string,
    baseCcy: string,
    quoteCcy: string,
    settleCcy: string,
    ctVal: string,
    ctMult: string,
    ctValCcy: string,
    optType: string,
    stk: string,
    listTime: string,
    expTime: string,
    lever: string,
    tickSz: string,
    lotSz: string,
    minSz: string,
    ctType: string,
    alias: string,
    state: string
}