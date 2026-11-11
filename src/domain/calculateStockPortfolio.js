export function inferTaxRateFromSymbol(symbol) {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) return 0.3;
  if (/^00\d+B$/.test(clean) || clean.endsWith('B')) return 0;
  if (clean.startsWith('00')) return 0.1;
  return 0.3;
}

export function calculateStockPortfolio(accountObj, stockTrades = [], stockPrices = []) {
  const accountId = accountObj?.id;
  const rawDiscount = Number(accountObj?.feeDiscount);
  const feeDiscount = !Number.isNaN(rawDiscount) && rawDiscount > 0 && rawDiscount <= 10 ? rawDiscount : 10;
  const discountMultiplier = feeDiscount / 10;
  const deductSellFee = Boolean(accountObj?.deductSellFeeInValue);

  const priceMap = new Map(stockPrices.map((p) => [p.symbol, p]));
  const trades = stockTrades
    .filter((t) => t.accountId === accountId)
    .sort((a, b) => (a.date !== b.date ? a.date.localeCompare(b.date) : (a.createdAt || 0) - (b.createdAt || 0)));

  const holdingsMap = new Map();

  for (const t of trades) {
    const sym = t.symbol;
    if (!holdingsMap.has(sym)) {
      holdingsMap.set(sym, {
        symbol: sym,
        lots: [],
        lastTradePrice: t.price,
        lastTaxRate: t.taxRate !== undefined && t.taxRate !== null ? Number(t.taxRate) : inferTaxRateFromSymbol(sym)
      });
    }
    const item = holdingsMap.get(sym);
    item.lastTradePrice = t.price;
    if (t.taxRate !== undefined && t.taxRate !== null) item.lastTaxRate = Number(t.taxRate);

    const principal = Math.floor(Math.round(t.shares * t.price * 100) / 100);
    const fee = Math.floor(Number(t.fee) || 0);

    if (t.type === 'buy') {
      const lotTaxRate = t.taxRate !== undefined && t.taxRate !== null ? Number(t.taxRate) : inferTaxRateFromSymbol(sym);
      item.lots.push({ shares: t.shares, cost: principal + fee, taxRate: lotTaxRate });
    } else if (t.type === 'sell') {
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

    let itemRawValue = 0, itemSellFee = 0, itemSellTax = 0, itemNetValue = 0, itemCost = 0;

    for (const lot of activeLots) {
      const lotRaw = Math.floor(Math.round(lot.shares * currentPrice * 100) / 100);
      itemRawValue += lotRaw;
      itemCost += lot.cost;

      if (deductSellFee && lotRaw > 0) {
        const rawFee = Math.floor(lotRaw * 0.001425 * discountMultiplier + 1e-9);
        const lotFee = Math.max(1, rawFee);
        const taxRate = lot.taxRate !== undefined && lot.taxRate !== null ? lot.taxRate : inferTaxRateFromSymbol(item.symbol);
        const lotTax = Math.floor(lotRaw * (taxRate / 100) + 1e-9);
        itemSellFee += lotFee;
        itemSellTax += lotTax;
        itemNetValue += Math.max(0, lotRaw - lotFee - lotTax);
      } else {
        itemNetValue += lotRaw;
      }
    }

    const unrealizedPnL = itemNetValue - itemCost;
    const returnRate = itemCost > 0 ? Math.round((unrealizedPnL / itemCost) * 1000) / 10 : 0;
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
  const totalReturnRate = totalCost > 0 ? Math.round((totalUnrealizedPnL / totalCost) * 1000) / 10 : 0;

  return { holdings, totalMarketValue, totalCost, totalUnrealizedPnL, totalReturnRate, feeDiscount, deductSellFee };
}
