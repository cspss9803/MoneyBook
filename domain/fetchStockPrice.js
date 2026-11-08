const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function fetchYahooChart(yahooSymbol) {
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=10d&interval=1d`;

  for (const buildProxyUrl of CORS_PROXIES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(buildProxyUrl(targetUrl), { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];

      for (let i = timestamps.length - 1; i >= 0; i--) {
        const closePrice = closes[i];
        if (closePrice !== null && closePrice !== undefined && !Number.isNaN(Number(closePrice))) {
          const dt = new Date(timestamps[i] * 1000);
          const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
          return {
            yahooSymbol,
            price: Math.round(Number(closePrice) * 100) / 100,
            tradeDate: dateStr
          };
        }
      }
    } catch {
      // 單一 Proxy 失敗時自動嘗試下一組
    }
  }
  return null;
}

export async function fetchStockPrice(rawSymbol, cachedYahooSymbol = null) {
  const clean = String(rawSymbol).trim().toUpperCase();
  if (!clean) return null;

  const candidates = [];
  if (cachedYahooSymbol) {
    candidates.push(cachedYahooSymbol);
  }
  if (clean.endsWith('.TW') || clean.endsWith('.TWO') || /^[A-Z]+$/.test(clean)) {
    if (!candidates.includes(clean)) candidates.push(clean);
  } else {
    if (!candidates.includes(`${clean}.TW`)) candidates.push(`${clean}.TW`);
    if (!candidates.includes(`${clean}.TWO`)) candidates.push(`${clean}.TWO`);
  }

  for (const candidate of candidates) {
    const res = await fetchYahooChart(candidate);
    if (res) {
      return {
        symbol: clean,
        yahooSymbol: res.yahooSymbol,
        price: res.price,
        tradeDate: res.tradeDate
      };
    }
  }

  return null;
}