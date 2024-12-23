import { HttpService } from '@nestjs/axios';
import { BalanceInfo } from 'src/dto/balance.dto';
import { IAdapter } from 'src/interfaces/adapter.interface';
import * as ccxt from 'ccxt';

export class PoloniexService implements IAdapter {
  private exchange: ccxt.poloniex;
  private futuresExchange: ccxt.poloniexfutures;

  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.POLONIEX_API_KEY;
    const secretKey = process.env.POLONIEX_SECRET_KEY;
    this.exchange = new ccxt.poloniex({
      apiKey: apiKey,
      secret: secretKey,
    });
    this.futuresExchange = new ccxt.poloniexfutures({
      apiKey: apiKey,
      secret: secretKey,
    });
    this.exchange.options = {
      ...this.exchange.options,
      adjustForTimeDifference: true,
    };
    this.futuresExchange.options = {
      ...this.futuresExchange.options,
      adjustForTimeDifference: true,
    };
  }

  async check(asset: string): Promise<any> {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.exchange.fetchBalance();
      return { [formattedAsset.toLowerCase()]: response.free[formattedAsset] };
    } catch (error) {
      throw new Error(error);
    }
  }
  async checkFuture(asset?: string): Promise<any> | never {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.futuresExchange.fetchBalance();
      console.log(response);
      return { [formattedAsset.toLowerCase()]: response.free[formattedAsset] };
    } catch (error) {
        console.log(error)
      throw new Error(error);
    }
  }
  async buy(
    amount: string,
    asset: string,
    approxStableValue: string,
  ): Promise<any> {
    try {
      const response = await this.exchange.createOrder(
        asset + '/USDT',
        'market',
        'buy',
        Number(amount),
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fullOrder = await this.exchange.fetchOrder(
        response.id,
        asset + '/USDT',
      );
      return fullOrder;
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
      await new Promise((resolve) => setTimeout(resolve, 500));
      const fullOrder = await this.exchange.fetchOrder(
        response.id,
        asset + '/USDT',
      );
      return fullOrder;
    } catch (error) {
      throw new Error(error);
    }
  }
  async calculateContractSize(amount: string, asset: string) {
    try {
      let contractSize = 1;

      const marketFetchResponse = await this.futuresExchange.fetchMarkets({
        symbol: asset + 'USDTM',
      });

      marketFetchResponse.forEach((element) => {
        if (element.info.symbol === asset + 'USDTM') {
          contractSize = element.contractSize;
        }
      });
      const amountNum = parseFloat(amount);
      const contracts = Math.ceil(amountNum / contractSize);
      return contracts;
    } catch (error) {
      throw new Error(error);
    }
  }
  async futureBuy(amount: string, asset: string): Promise<void | any> {
    try {
      const contracts = await this.calculateContractSize(amount, asset);

      if (contracts < 1) {
        throw new Error('Amount too small. Minimum is 1 contract (0.1 ETH)');
      }
      const response = await this.futuresExchange.createOrder(
        asset + 'USDTM',
        'market',
        'buy',
        contracts,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fullOrder = await this.futuresExchange.fetchOrder(
        response.id,
        asset + 'USDTM',
      );
      return fullOrder;
    } catch (error) {
      throw new Error(error);
    }
  }

  async futureSell(asset: string): Promise<void | any> {
    try {
      const amountToSell = await this.futuresExchange.fetchPosition(
        asset + 'USDTM',
      );
      const response = await this.futuresExchange.createOrder(
        asset + 'USDTM',
        'market',
        'sell',
        amountToSell.contracts,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fullOrder = await this.futuresExchange.fetchOrder(
        response.id,
        asset + 'USDTM',
      );
      return fullOrder;
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
      await this.exchange.transfer(
        asset.toUpperCase(),
        availableAmount,
        'trade',
        'main',
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      const networks = response[asset]?.networks || {};
      const sortedNetworks = Object.entries(networks)
        .map(([networkKey, networkInfo]: [string, any]) => ({
          network: networkInfo.info.chainName,
          enabled: isWithdraw
            ? networkInfo.info.isWithdrawEnabled
            : networkInfo.info.isDepositEnabled,
          withdrawalMinFee:
            networkInfo.info.withdrawalMinFee?.toString() || '0',
        }))
        .sort((a, b) => {
          return (
            parseFloat(a.withdrawalMinFee) - parseFloat(b.withdrawalMinFee)
          );
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
  // не очень понятно как сравнивать нетворки которые использует биржа,
  // например на бинансе для депозита нет trc20 а на kucoin есть и является самым дешевым способом
  delay(ms: number): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getDepositMethods(asset: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
