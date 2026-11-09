function getStartDateStr(daysAgo = 15) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchStockPrice(rawSymbol) {
  // 移除可能殘留的 .TW 或 .TWO 後綴，FinMind 統一使用純代號 (如 1712、0050、00937B)
  const cleanSymbol = String(rawSymbol || '')
    .trim()
    .toUpperCase()
    .replace(/\.TWO?$/, '');

  if (!cleanSymbol) return null;

  const startDate = getStartDateStr(15);
  const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${encodeURIComponent(cleanSymbol)}&start_date=${startDate}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;

    const json = await res.json();
    if (json.msg !== 'success' || !Array.isArray(json.data) || json.data.length === 0) {
      return null;
    }

    // 從最後一筆往前找最近一個有效收盤價
    for (let i = json.data.length - 1; i >= 0; i--) {
      const row = json.data[i];
      const closePrice = Number(row.close);
      if (row.close !== null && row.close !== undefined && !Number.isNaN(closePrice) && closePrice > 0) {
        return {
          symbol: cleanSymbol,
          price: Math.round(closePrice * 100) / 100,
          tradeDate: row.date
        };
      }
    }
  } catch (err) {
    console.warn(`查詢 ${cleanSymbol} 收盤價失敗:`, err);
  }

  return null;
}