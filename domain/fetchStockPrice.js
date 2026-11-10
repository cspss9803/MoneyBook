const GAS_API_URL =
  'https://script.google.com/macros/s/AKfycbwJROQshNiOIhVj4_JjcAzUuIMTsp8KdaDmdWYUgXo7b_r3Kyjh5iDRbvthBOWWjDhtRw/exec';

export async function fetchStockPrices(symbols) {
  if (!Array.isArray(symbols) || symbols.length === 0) return [];

  // 清洗代號並轉為大寫、去除後綴
  const cleanSymbols = symbols
    .map((s) => String(s || '').trim().toUpperCase().replace(/\.TWO?$/, ''))
    .filter(Boolean);

  if (cleanSymbols.length === 0) return [];

  const reqUrl = `${GAS_API_URL}?symbols=${encodeURIComponent(cleanSymbols.join(','))}&_=${Date.now()}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(reqUrl, {
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const json = await res.json();
    // 預期 GAS 回傳格式：{ results: [ { symbol, price, tradeDate }, ... ] }
    if (json && Array.isArray(json.results)) {
      return json.results.map((r) => ({
        symbol: r.symbol,
        price: Math.round(Number(r.price) * 100) / 100,
        tradeDate: r.tradeDate
      })).filter((r) => !Number.isNaN(r.price) && r.price > 0);
    }
  } catch (err) {
    console.warn('批次查詢股票收盤價失敗:', err);
  }

  return [];
}