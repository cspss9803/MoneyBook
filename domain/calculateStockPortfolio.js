import { store } from '../state/store.js';

export function inferTaxRateFromSymbol(symbol) {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) return 0.3;
  // 台股債券型 ETF 代號以 B 結尾 (如 00937B、00679B)，免徵證交稅 0%
  if (/^00\d+B$/.test(clean) || clean.endsWith('B')) return 0;
  // 一般台股 ETF 以 00 開頭 (如 0050、0056、00878)，證交稅為 0.1%
  if (clean.startsWith('00')) return 0.1;
  // 一般上市櫃個股，證交稅為 0.3%
  return 0.3;
}

export function calculateStockPortfolio(
  accountOrId,
  stockTrades = store.stockTrades,
  stockPrices = store.stockPrices
) {
  const accountId = typeof accountOrId === 'object' ? accountOrId?.id : accountOrId;
  const accountObj =
    store.accounts.find((a) => a.id === accountId) ||
    (typeof accountOrId === 'object' ? accountOrId : null);

  const rawDiscount = Number(accountObj?.feeDiscount);
  const feeDiscount =
    !Number.isNaN(rawDiscount) && rawDiscount > 0 && rawDiscount <= 10 ? rawDiscount : 10;
  const discountMultiplier = feeDiscount / 10;
  const deductSellFee = Boolean(accountObj?.deductSellFeeInValue);

  const priceMap = new Map(stockPrices.map((p) => [p.symbol, p]));
  const trades = stockTrades
    .filter((t) => t.accountId === accountId)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.createdAt || 0) - (b.createdAt || 0);
    });

  const holdingsMap = new Map();

  for (const t of trades) {
    const sym = t.symbol;
    if (!holdingsMap.has(sym)) {
      holdingsMap.set(sym, {
        symbol: sym,
        lots: [], // 逐筆記錄每一筆買入部位: { shares, cost, taxRate }
        lastTradePrice: t.price,
        lastTaxRate:
          t.taxRate !== undefined && t.taxRate !== null
            ? Number(t.taxRate)
            : inferTaxRateFromSymbol(sym)
      });
    }

    const item = holdingsMap.get(sym);
    item.lastTradePrice = t.price;
    if (t.taxRate !== undefined && t.taxRate !== null) {
      item.lastTaxRate = Number(t.taxRate);
    }

    const principal = Math.floor(Math.round(t.shares * t.price * 100) / 100);
    const fee = Math.floor(Number(t.fee) || 0);

    if (t.type === 'buy') {
      const lotTaxRate =
        t.taxRate !== undefined && t.taxRate !== null
          ? Number(t.taxRate)
          : inferTaxRateFromSymbol(sym);

      item.lots.push({
        shares: t.shares,
        cost: principal + fee,
        taxRate: lotTaxRate
      });
    } else if (t.type === 'sell') {
      // 賣出時依先進先出 (FIFO) 沖銷各筆買入部位的股數與成本
      let sharesToSell = t.shares;
      for (const lot of item.lots) {
        if (sharesToSell <= 0) break;
        if (lot.shares <= 0) continue;

        if (lot.shares <= sharesToSell) {
          sharesToSell -= lot.shares;
          lot.shares = 0;
          lot.cost = 0;
        } else {
          const remainRatio = (lot.shares - sharesToSell) / lot.shares;
          lot.cost = Math.max(0, Math.floor(lot.cost * remainRatio + 1e-9));
          lot.shares -= sharesToSell;
          sharesToSell = 0;
        }
      }
      item.lots = item.lots.filter((lot) => lot.shares > 0);
    }
  }

  let totalMarketValue = 0;
  let totalCost = 0;
  const holdings = [];

  for (const item of holdingsMap.values()) {
    const activeLots = item.lots.filter((l) => l.shares > 0);
    const totalShares = activeLots.reduce((sum, l) => sum + l.shares, 0);
    if (totalShares <= 0) continue;

    const cachedPriceObj = priceMap.get(item.symbol);
    const currentPrice = cachedPriceObj ? cachedPriceObj.price : item.lastTradePrice;
    const priceDate = cachedPriceObj ? cachedPriceObj.tradeDate : '成交價';

    let itemRawValue = 0;
    let itemSellFee = 0;
    let itemSellTax = 0;
    let itemNetValue = 0;
    let itemCost = 0;

    // 逐筆計算每一筆買入部位的現值、手續費(最低1元)與證交稅(無條件捨去)
    for (const lot of activeLots) {
      const lotRaw = Math.floor(Math.round(lot.shares * currentPrice * 100) / 100);
      itemRawValue += lotRaw;
      itemCost += lot.cost;

      if (deductSellFee && lotRaw > 0) {
        const rawFee = Math.floor(lotRaw * 0.001425 * discountMultiplier + 1e-9);
        const lotFee = Math.max(1, rawFee); // 單筆最低手續費 1 元

        const taxRate =
          lot.taxRate !== undefined && lot.taxRate !== null
            ? lot.taxRate
            : inferTaxRateFromSymbol(item.symbol);
        const lotTax = Math.floor(lotRaw * (taxRate / 100) + 1e-9); // 證交稅無條件捨去

        itemSellFee += lotFee;
        itemSellTax += lotTax;
        itemNetValue += Math.max(0, lotRaw - lotFee - lotTax);
      } else {
        itemNetValue += lotRaw;
      }
    }

    const unrealizedPnL = itemNetValue - itemCost;
    const returnRate =
      itemCost > 0 ? Math.round((unrealizedPnL / itemCost) * 1000) / 10 : 0;
    const avgCost = Math.round((itemCost / totalShares) * 100) / 100;

    totalMarketValue += itemNetValue;
    totalCost += itemCost;

    holdings.push({
      symbol: item.symbol,
      shares: totalShares,
      lotCount: activeLots.length,
      avgCost,
      totalCost: itemCost,
      currentPrice,
      priceDate,
      rawMarketValue: itemRawValue,
      estimatedSellFee: itemSellFee,
      estimatedSellTax: itemSellTax,
      marketValue: itemNetValue,
      unrealizedPnL,
      returnRate
    });
  }

  const totalUnrealizedPnL = totalMarketValue - totalCost;
  const totalReturnRate =
    totalCost > 0 ? Math.round((totalUnrealizedPnL / totalCost) * 1000) / 10 : 0;

  return {
    holdings,
    totalMarketValue,
    totalCost,
    totalUnrealizedPnL,
    totalReturnRate,
    feeDiscount,
    deductSellFee
  };
}