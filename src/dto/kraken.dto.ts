export interface OkexBuyResponse {
    error: [];
    result: OkexResult;
}

export interface OkexResult {
    txid: string[];
    descr: OkexResultDescr;
}

export interface OkexResultDescr {
    order: string;
}

export interface OkexOrderInfoResponse {
    error: [];
    result: OkexOrderInfo;
}

interface OkexOrderInfo {
    [key: string]: OkexOrderInfoData;
}

interface OkexOrderInfoData {
    refid: null;
    userref: number;
    status: string;
    opentm: number;
    starttm: number;
    expiretm: number;
    descr: OkexOrderInfoDescr;
    vol: string;
    vol_exec: string;
    cost: string;
    fee: string;
    price: string;
    stopprice: string;
    limitprice: string;
    misc: string;
    oflags: string;
    reason: null;
    closetm: number;
}

interface OkexOrderInfoDescr {
    pair: string;
    type: string;
    ordertype: string;
    price: string;
    price2: string;
    leverage: string;
    order: string;
    close: string;
}

interface OkexFutureOrderResponse {
    result: string;
    sendStatus: OkexFutureOrderSendStatus;
    serverTime: string;
}

interface OkexFutureOrderSendStatus {
    order_id: string;
    status: string;
    receivedTime: string;
    orderEvents: OkexFutureOrderEvent[];
}

interface OkexFutureOrderEvent {
    event: string;
    time: string;
    price: string;
    quantity: string;
}

export enum KrakenWallets {
    FUTURES = 'Futures Wallet',
    SPOT = 'Spot Wallet',
    MARGIN = 'Margin Wallet',
}

export interface KrakenActionResponse {
    txid: string;
    result: {
        refid: null;
        userref: number;
        status: string;
        opentm: number;
        starttm: number;
        expiretm: number;
        descr: {
            order: string;
        };
        vol: string;
        vol_exec: string;
        cost: string;
        fee: string;
        price: string;
        stopprice: string;
        limitprice: string;
        misc: string;
        oflags: string;
        reason: null;
        closetm: number;
    }


}