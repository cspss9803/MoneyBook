export function calculateStockPortfolio(accountOrId, stockTrades, stockPrices) {
  const accountId = typeof accountOrId === 'object' ? accountOrId?.id : accountOrId;
  const rawDiscount = typeof accountOrId === 'object' ? Number(accountOrId?.feeDiscount) : 10;
  const feeDiscount = rawDiscount > 0 && rawDiscount <= 10 ? rawDiscount : 10;
  const discountMultiplier = feeDiscount / 10;
  const deductSellFee =
    typeof accountOrId === 'object' ? Boolean(accountOrId?.deductSellFeeInValue) : false;

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
    const principal = Math.floor(t.shares * t.price);
    const fee = Math.floor(Number(t.fee) || 0);

    if (t.type === 'buy') {
      item.shares += t.shares;
      item.totalCost += principal + fee;
    } else if (t.type === 'sell') {
      if (item.shares > 0) {
        const ratio = Math.min(1, t.shares / item.shares);
        item.totalCost = Math.max(0, Math.floor(item.totalCost * (1 - ratio)));
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

    const rawMarketValue = Math.floor(item.shares * currentPrice);
    const estimatedSellFee = deductSellFee
      ? Math.floor(rawMarketValue * 0.001425 * discountMultiplier)
      : 0;
    const marketValue = Math.max(0, rawMarketValue - estimatedSellFee);

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
      rawMarketValue,
      estimatedSellFee,
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
    totalReturnRate,
    feeDiscount,
    deductSellFee
  };
}