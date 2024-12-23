import { IAdapter } from 'src/interfaces/adapter.interface';
import * as ccxt from 'ccxt';

export class GateService implements IAdapter {
  private exchange: ccxt.gateio;
  private futuresExchange: ccxt.gateio;

  constructor() {
    const apiKey = process.env.GATE_ACCESS_KEY;
    const secretKey = process.env.GATE_SECRET_KEY;
    this.exchange = new ccxt.gateio({
      apiKey: apiKey,
      secret: secretKey,
    });
    this.futuresExchange = new ccxt.gateio({
      apiKey: apiKey,
      secret: secretKey,
      options: {
        defaultType: 'swap',
        defaultContractType: 'usdt-margined',
      },
    });
  }

  async check(asset: string): Promise<any> {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.exchange.fetchBalance();
      return {
        [formattedAsset.toLowerCase()]: response.free[formattedAsset] || 0,
      };
    } catch (error) {
      throw new Error(error);
    }
  }
  async checkFuture(asset?: string): Promise<any> | never {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.futuresExchange.fetchBalance();
      return {
        [formattedAsset.toLowerCase()]: response.free[formattedAsset] || 0,
      };
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  async buy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<any> {
    try {
      const ticker = await this.exchange.fetchTicker(asset + '/USDT');
      const currentPrice = ticker.last;

      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'buy',
        Number(amount),
        currentPrice,
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }

  async sell(asset: string): Promise<void | any> {
    const amountToSell = Object.values(await this.check(asset))[0];
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'sell',
        Number(amountToSell),
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }
  async calculateContractSize(amount: string, asset: string) {
    try {
      const marketFetchResponse = await this.futuresExchange.fetchMarkets({
        symbol: asset + '/USDT:USDT',
      });

      let market = marketFetchResponse.find(
        (element) => element.symbol === asset + '/USDT:USDT',
      );

      const decimal = Number(amount) / market.contractSize;
      const contracts = Number(decimal.toString().replace('.', '')) - 1;

      return contracts;
    } catch (error) {
      throw new Error(error);
    }
  }
  async futureBuy(amount: string, asset: string): Promise<void | any> {
    try {
      const contracts = await this.calculateContractSize(amount, asset);
      const response = await this.futuresExchange.createOrder(
        asset + '/USDT:USDT',
        'market',
        'buy',
        contracts,
      );
      return response;
    } catch (error) {
      console.error('Error in futureBuy:', error);
      throw error;
    }
  }
  async futureSell(asset: string): Promise<void | any> {
    try {
      const amountToSell = await this.futuresExchange.fetchPosition(
        asset + '/USDT:USDT',
      );
      const response = await this.futuresExchange.createOrder(
        asset + '/USDT:USDT',
        'market',
        'sell',
        amountToSell.contracts,
      );
      return response;
    } catch (error) {
      throw new Error(error);
    }
  }
  async transfer(
    asset: string,
    address: string,
    network: string,
  ): Promise<any> {
    try {
      const params: any = {
        network: network,
      };
      const balances = await this.exchange.fetchBalance();
      const availableAmount = balances.free[asset.toUpperCase()];
      return await this.exchange.withdraw(
        asset.toUpperCase(),
        availableAmount,
        address,
        params,
      );
    } catch (error) {
      throw new Error(error);
    }
  }
  async getNetworks(asset: string, isWithdraw: boolean) {
    try {
      const response = await this.exchange.fetchCurrencies();
      const networks = response[asset].networks || {};
      const fees = await this.exchange.fetchDepositWithdrawFees([asset]);
      const simplifiedFees = await fees[asset].networks;
      const sortedNetworks = Object.entries(networks)
        .map(([networkKey, networkInfo]: [string, any]) => ({
          network: networkKey,
          enabled: isWithdraw
            ? !networkInfo.info?.withdraw_disabled
            : !networkInfo.info?.deposit_disabled,
          fee: isWithdraw
            ? simplifiedFees[networkInfo.info.chain]?.withdraw?.fee || 100
            : 0,
        }))
        .sort((a, b) => {
          return parseFloat(a.fee) - parseFloat(b.fee);
        });

      return sortedNetworks;
    } catch (error) {
      throw error;
    }
  }

  async getDepositAddress(asset: string, network: string): Promise<any> {
    try {
      const params: any = {
        network: network,
      };
      try {
        const existingAddress = await this.exchange.fetchDepositAddress(
          asset,
          params,
        );
        if (existingAddress && existingAddress.address) {
          return existingAddress.address;
        }
        return await this.exchange.createDepositAddress(asset);
      } catch (fetchError) {
        const newAddress = await this.exchange.createDepositAddress(
          asset,
          params,
        );
        return newAddress.address;
      }
    } catch (error) {
      throw new Error(error);
    }
  }
  async checkReceivedAsset(asset: string) {
    const startBalance = await this.getInitialBalance(asset);
    const interval = setInterval(async () => {
      try {
        const currentBalance = await this.getInitialBalance(asset);
        if (currentBalance > startBalance) {
          clearInterval(interval);
        }
      } catch (error) {
        throw new Error(error);
      }
    }, 30000); // 30 seconds
    return { success: true };
  }
  async getInitialBalance(asset: string): Promise<number> {
    const balances = await this.exchange.fetchBalance();
    return balances.total[asset.toUpperCase()] || 0;
  }
  delay(ms: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getDepositMethods(asset: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
