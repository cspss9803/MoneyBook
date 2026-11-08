export function calculateStockPortfolio(accountId, stockTrades, stockPrices) {
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
        shares: 0,
        totalCost: 0,
        lastTradePrice: t.price
      });
    }

    const item = holdingsMap.get(sym);
    item.lastTradePrice = t.price;
    const principal = Math.round(t.shares * t.price);
    const fee = Math.round(Number(t.fee) || 0);

    if (t.type === 'buy') {
      item.shares += t.shares;
      item.totalCost += principal + fee;
    } else if (t.type === 'sell') {
      if (item.shares > 0) {
        const ratio = Math.min(1, t.shares / item.shares);
        item.totalCost = Math.max(0, Math.round(item.totalCost * (1 - ratio)));
        item.shares = Math.max(0, item.shares - t.shares);
      }
    }
  }

  let totalMarketValue = 0;
  let totalCost = 0;
  const holdings = [];

  for (const item of holdingsMap.values()) {
    if (item.shares <= 0) continue;

    const cachedPriceObj = priceMap.get(item.symbol);
    const currentPrice = cachedPriceObj ? cachedPriceObj.price : item.lastTradePrice;
    const priceDate = cachedPriceObj ? cachedPriceObj.tradeDate : '成交價';

    const marketValue = Math.round(item.shares * currentPrice);
    const unrealizedPnL = marketValue - item.totalCost;
    const returnRate =
      item.totalCost > 0 ? Math.round((unrealizedPnL / item.totalCost) * 1000) / 10 : 0;
    const avgCost = Math.round((item.totalCost / item.shares) * 100) / 100;

    totalMarketValue += marketValue;
    totalCost += item.totalCost;

    holdings.push({
      symbol: item.symbol,
      shares: item.shares,
      avgCost,
      totalCost: item.totalCost,
      currentPrice,
      priceDate,
      marketValue,
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
    totalReturnRate
  };
}