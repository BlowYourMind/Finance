export enum OkexUrls {
  CURRENCIES = '/api/v5/asset/currencies',
  TRANSFER = '/api/v5/asset/transfer',
  DEPOSIT_ADDRESS = '/api/v5/asset/deposit-address',
  INSTRUMENTS = '/api/v5/public/instruments',
  ORDER = '/api/v5/trade/order',
  BALANCE = '/api/v5/asset/balances',
  TRADE_BALANCE = '/api/v5/account/balance',
  WITHDRAW = '/api/v5/asset/withdrawal',
  SET_LEVERAGE = '/api/v5/account/set-leverage',
}

export enum BinanceUrls {
  GET_CONFIG = '/sapi/v1/capital/config/getall',
  GET_BALANCE = '/api/v3/account',
  ORDER = '/api/v3/order',
  FUTURE_ORDER = '/fapi/v1/order',
  BALANCE = '/api/v3/account',
  GET_ASSET = '/sapi/v3/asset/getUserAsset',
  FUTURE_BALANCE = '/fapi/v2/balance',
  FUTURE_POSITION = '/fapi/v2/positionRisk',
  FUTURE_TRASFER = '/sapi/v1/futures/transfer',
  TRANSFER = '/sapi/v1/asset/transfer',
  CAPITAL_CONFIG = '/sapi/v1/capital/config/getall',
  WITHDRAW = '/sapi/v1/capital/withdraw/apply',
  DEPOSIT_ADDRESS = '/sapi/v1/capital/deposit/address',
  DEPOSIT_METHODS = '/sapi/v1/capital/deposit/getall',
}
