// 使用動態時間戳記與多組穩定 Proxy，破除 CDN 舊快取
const PROXY_HANDLERS = [
  {
    // allorigins JSON 模式：永遠帶有 CORS Header，並可從 contents 解析原始 JSON
    buildUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&_=${Date.now()}`,
    parseResponse: async (res) => {
      const wrapper = await res.json();
      if (!wrapper?.contents) return null;
      return JSON.parse(wrapper.contents);
    }
  },
  {
    buildUrl: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    parseResponse: async (res) => res.json()
  },
  {
    buildUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&_=${Date.now()}`,
    parseResponse: async (res) => res.json()
  }
];

function formatUnixToDateStr(unixSec) {
  const dt = new Date(unixSec * 1000);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function fetchYahooChart(yahooSymbol) {
  // 以當前小時為單位產生 period1 與 period2，防止 Proxy 回傳前幾天的舊快取
  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = nowSec - 14 * 86400;
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${startSec}&period2=${nowSec}&interval=1d`;

  for (const proxy of PROXY_HANDLERS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(proxy.buildUrl(targetUrl), {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const data = await proxy.parseResponse(res);

      // 若 Yahoo 明確回傳找不到該代號 (如上市股票去查 .TWO)，直接結束不需換 Proxy 重試
      if (data?.chart?.error) {
        return { notFound: true };
      }

      const result = data?.chart?.result?.[0];
      if (!result) continue;

      let bestPrice = null;
      let bestDateStr = '';

      // 1. 檢查歷史 K 線陣列中的最後一筆有效收盤價
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      for (let i = timestamps.length - 1; i >= 0; i--) {
        const closePrice = closes[i];
        if (closePrice !== null && closePrice !== undefined && !Number.isNaN(Number(closePrice))) {
          bestPrice = Math.round(Number(closePrice) * 100) / 100;
          bestDateStr = formatUnixToDateStr(timestamps[i]);
          break;
        }
      }

      // 2. 檢查 meta.regularMarketPrice (解決 0050 等 ETF 收盤後陣列最後一格暫為 null 的問題)
      const metaPrice = result.meta?.regularMarketPrice;
      const metaTime = result.meta?.regularMarketTime;
      if (
        metaPrice !== null &&
        metaPrice !== undefined &&
        !Number.isNaN(Number(metaPrice)) &&
        metaTime
      ) {
        const metaDateStr = formatUnixToDateStr(metaTime);
        if (!bestDateStr || metaDateStr >= bestDateStr) {
          bestPrice = Math.round(Number(metaPrice) * 100) / 100;
          bestDateStr = metaDateStr;
        }
      }

      if (bestPrice !== null && bestDateStr) {
        return {
          yahooSymbol,
          price: bestPrice,
          tradeDate: bestDateStr
        };
      }
    } catch {
      // 當前 Proxy 超時或受限時，自動切換下一組 Proxy
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
  } else if (/^00\d+B$/.test(clean)) {
    // 債券型 ETF (如 00937B、00679B) 多數掛牌於上櫃 (.TWO)，優先查 .TWO
    if (!candidates.includes(`${clean}.TWO`)) candidates.push(`${clean}.TWO`);
    if (!candidates.includes(`${clean}.TW`)) candidates.push(`${clean}.TW`);
  } else {
    // 一般股票與 0050 等標準 ETF 優先查上市 (.TW)
    if (!candidates.includes(`${clean}.TW`)) candidates.push(`${clean}.TW`);
    if (!candidates.includes(`${clean}.TWO`)) candidates.push(`${clean}.TWO`);
  }

  for (const candidate of candidates) {
    const res = await fetchYahooChart(candidate);
    if (res && !res.notFound) {
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