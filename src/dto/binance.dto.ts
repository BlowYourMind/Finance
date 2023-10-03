// make an interface from the above data
interface BinanceFutureResponseData {
    orderId: number;
    symbol: string;
    status: string;
    clientOrderId: string;
    price: string;
    avgPrice: string;
    origQty: string;
    executedQty: string;
    cumQty: string;
    cumQuote: string;
    timeInForce: string;
    type: string;
    reduceOnly: boolean;
    closePosition: boolean;
    side: string;
    positionSide: string;
    stopPrice: string;
    workingType: string;
    priceProtect: boolean;
    origType: string;
    updateTime: number;
}
interface BinanceRsponseData {
    symbol: string;
    orderId: number;
    orderListId: number;
    clientOrderId: string;
    transactTime: number;
    price: string;
    origQty: string;
    executedQty: string;
    cummulativeQuoteQty: string;
    status: string;
    timeInForce: string;
    type: string;
    side: string;
    workingTime: number;
    fills: Fill[];
    selfTradePreventionMode: string;
}
// make a Fill interface from data above
interface Fill {
    price: string;
    qty: string;
    commission: string;
    commissionAsset: string;
    tradeId: number;
}

export enum BinanceTransferTypes {
    MAIN_UMFUTURE = 'MAIN_UMFUTURE',
    MAIN_CMFUTURE = 'MAIN_CMFUTURE',
    MAIN_MARGIN = 'MAIN_MARGIN',
    UMFUTURE_MAIN = 'UMFUTURE_MAIN',
    UMFUTURE_MARGIN = 'UMFUTURE_MARGIN',
    CMFUTURE_MAIN = 'CMFUTURE_MAIN',
    CMFUTURE_MARGIN = 'CMFUTURE_MARGIN',
    MARGIN_MAIN = 'MARGIN_MAIN',
    MARGIN_UMFUTURE = 'MARGIN_UMFUTURE',
    MARGIN_CMFUTURE = 'MARGIN_CMFUTURE',
    ISOLATEDMARGIN_MARGIN = 'ISOLATEDMARGIN_MARGIN',
    MARGIN_ISOLATEDMARGIN = 'MARGIN_ISOLATEDMARGIN',
    ISOLATEDMARGIN_ISOLATEDMARGIN = 'ISOLATEDMARGIN_ISOLATEDMARGIN',
    MAIN_FUNDING = 'MAIN_FUNDING',
    FUNDING_MAIN = 'FUNDING_MAIN',
    FUNDING_UMFUTURE = 'FUNDING_UMFUTURE',
    UMFUTURE_FUNDING = 'UMFUTURE_FUNDING',
    MARGIN_FUNDING = 'MARGIN_FUNDING',
    FUNDING_MARGIN = 'FUNDING_MARGIN',
    FUNDING_CMFUTURE = 'FUNDING_CMFUTURE',
    CMFUTURE_FUNDING = 'CMFUTURE_FUNDING',
    MAIN_OPTION = 'MAIN_OPTION',
    OPTION_MAIN = 'OPTION_MAIN',
    UMFUTURE_OPTION = 'UMFUTURE_OPTION',
    OPTION_UMFUTURE = 'OPTION_UMFUTURE',
    MARGIN_OPTION = 'MARGIN_OPTION',
    OPTION_MARGIN = 'OPTION_MARGIN',
    FUNDING_OPTION = 'FUNDING_OPTION',
    OPTION_FUNDING = 'OPTION_FUNDING',
    MAIN_PORTFOLIO_MARGIN = 'MAIN_PORTFOLIO_MARGIN',
    PORTFOLIO_MARGIN_MAIN = 'PORTFOLIO_MARGIN_MAIN',
    MAIN_ISOLATED_MARGIN = 'MAIN_ISOLATED_MARGIN',
    ISOLATED_MARGIN_MAIN = 'ISOLATED_MARGIN_MAIN',
}
export interface BinanceMoveParameters {
    amount: string,
    asset: string,
    type: BinanceTransferTypes
}

export interface BinanceFutureActionParams {
  symbol: string;
  side: "BUY" | "SELL";
  positionSide: "LONG" | "SHORT";
  type: "MARKET" | "LIMIT";
  quantity: string;
}

