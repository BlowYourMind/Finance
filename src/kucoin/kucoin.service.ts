import { HttpService } from '@nestjs/axios';
import { BalanceInfo } from 'src/dto/balance.dto';
import { IAdapter } from 'src/interfaces/adapter.interface';
import * as ccxt from 'ccxt';

export class KucoinService implements IAdapter {
  private exchange: ccxt.kucoin;
  private futuresExchange: ccxt.kucoinfutures;

  constructor(private readonly httpService: HttpService) {
    const apiKey = process.env.KUCOIN_API_KEY;
    const secretKey = process.env.KUCOIN_SECRET;
    const passphrase = process.env.KUCOIN_PASSPHRASE;
    this.exchange = new ccxt.kucoin({
      apiKey: apiKey,
      secret: secretKey,
      password: passphrase,
      options: {
        defaultType: 'spot',
      },
    });
    this.futuresExchange = new ccxt.kucoinfutures({
      apiKey: apiKey,
      secret: secretKey,
      password: passphrase,
      options: {
        defaultType: 'future',
      },
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
      const response = await this.exchange.fetchBalance({
        type: 'trade',
      });
      return { [formattedAsset.toLowerCase()]: response.free[formattedAsset] };
    } catch (error) {
      throw new Error(error);
    }
  }
  async checkFuture(asset?: string): Promise<any> | never {
    try {
      const formattedAsset = asset.toUpperCase();
      const response = await this.futuresExchange.fetchBalance({
        type: 'main',
      });
      return { [formattedAsset.toLowerCase()]: response.free[formattedAsset] };
    } catch (error) {
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
    console.log('Selling', asset);
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
  }
  async transfer(asset: string, address: string): Promise<any> {
    try {
      const bestNetwork = await this.getBestNetwork(asset);
      const params: any = {
        network: bestNetwork.networkInfo.id,
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
        '0x9d58abddb0b70bfca5a1cd69cffa04fb9e0d4475',
        params,
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  async getBestNetwork(asset: string): Promise<any> {
    const currencies = await this.exchange.fetchCurrencies();
    const currencyInfo = currencies[asset.toUpperCase()];
    const networks = currencyInfo.networks;
    const availableNetworks = Object.entries(networks)
      .filter(([_, info]) => {
        return (
          info.limits &&
          info.limits.deposit &&
          info.limits.deposit.min !== undefined
        );
      })
      .map(([network, info]) => ({
        network,
        fee: info.fee,
        networkInfo: info,
        depositMinSize: info.limits.deposit.min,
      }));
    return availableNetworks.sort((a, b) => a.fee - b.fee)[1] || 'ETH';
  }

  async getDepositAddress(asset: string): Promise<any> {
    try {
      const bestNetwork = await this.getBestNetwork(asset);
      const params: any = {
        network: bestNetwork.networkInfo.id,
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
        console.log('Current balance:', currentBalance);

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
