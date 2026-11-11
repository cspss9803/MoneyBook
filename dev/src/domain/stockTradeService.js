import { STORES } from '../config/constants.js';
import { addRecord } from '../db/addRecord.js';
import { deleteRecord } from '../db/deleteRecord.js';
import { addTradingDays } from './addTradingDays.js';
import { inferTaxRateFromSymbol } from './calculateStockPortfolio.js';
import { formatCurrency } from './formatCurrency.js';

export function calculateAutoFeeAndTax({ shares, price, feeDiscount, taxRate, tradeType }) {
  const sharesNum = Math.max(0, Math.floor(Number(shares) || 0));
  const priceNum = Math.max(0, Number(price) || 0);
  const principal = Math.floor(Math.round(sharesNum * priceNum * 100) / 100);

  const discNum = Number(feeDiscount);
  const validDisc = !Number.isNaN(discNum) && discNum > 0 && discNum <= 10 ? discNum : 10;
  const rawFee = Math.floor(principal * 0.001425 * (validDisc / 10) + 1e-9);
  const autoFee = principal > 0 ? Math.max(1, rawFee) : 0;

  const rateNum = Math.max(0, Number(taxRate) || 0);
  const autoTax =
    tradeType === 'sell' && principal > 0 ? Math.floor(principal * (rateNum / 100) + 1e-9) : 0;

  return {
    principal,
    fee: sharesNum > 0 && priceNum > 0 ? autoFee : '',
    tax: sharesNum > 0 && priceNum > 0 ? autoTax : 0
  };
}

export async function createStockTradeWithSettlement({ account, portfolio, form }) {
  const isBuy = form.tradeType === 'buy';
  const symbol = form.symbol.trim().toUpperCase();
  const shares = Math.max(1, Math.floor(Number(form.shares) || 0));
  const price = Math.round((Number(form.price) || 0) * 100) / 100;
  const fee = Math.max(0, Math.floor(Number(form.fee) || 0));
  const tax = isBuy ? 0 : Math.max(0, Math.floor(Number(form.tax) || 0));

  if (!account.settlementAccountId) {
    throw new Error('請先點擊上方鉛筆圖示綁定一個交割銀行帳戶');
  }
  if (!isBuy) {
    const held = portfolio.holdings.find((h) => h.symbol === symbol)?.shares || 0;
    if (shares > held) throw new Error(`庫存股數不足（目前持有 ${symbol} 共 ${held} 股）`);
  }

  const parsedTaxRate = isBuy
    ? inferTaxRateFromSymbol(symbol)
    : form.taxRate !== '' && !Number.isNaN(Number(form.taxRate))
      ? Math.max(0, Number(form.taxRate))
      : inferTaxRateFromSymbol(symbol);

  const principal = Math.max(1, Math.floor(Math.round(shares * price * 100) / 100));
  const settlementDate = addTradingDays(form.date, 2);
  const slashDate = form.date.replace(/-/g, '/');
  const nowTs = Date.now();
  const linkedTxIds = [];

  const baseTx = {
    date: settlementDate,
    accountId: account.settlementAccountId,
    toAccountId: null,
    otherAmount: 0,
    excludeFromStats: true
  };

  const principalTxId = `tx_st_${nowTs}_1`;
  linkedTxIds.push(principalTxId);
  await addRecord(STORES.TRANSACTIONS, {
    ...baseTx,
    id: principalTxId,
    type: isBuy ? 'expense' : 'income',
    amount: principal,
    myAmount: principal,
    name: `${slashDate} ${isBuy ? '買入' : '賣出'} ${shares} 股 ${symbol}`,
    categoryId: isBuy ? 'cat_sys_stock_buy' : 'cat_sys_stock_sell',
    note: `${isBuy ? '買入' : '賣出'}金額 ${formatCurrency(principal)} (成交價 ${price})`,
    createdAt: nowTs
  });

  if (fee > 0) {
    const feeTxId = `tx_st_${nowTs}_2`;
    linkedTxIds.push(feeTxId);
    await addRecord(STORES.TRANSACTIONS, {
      ...baseTx,
      id: feeTxId,
      type: 'expense',
      amount: fee,
      myAmount: fee,
      name: `${slashDate} ${isBuy ? '買入' : '賣出'} ${symbol} 手續費`,
      categoryId: 'cat_sys_stock_fee',
      note: `${shares} 股手續費`,
      createdAt: nowTs + 1
    });
  }

  if (tax > 0) {
    const taxTxId = `tx_st_${nowTs}_3`;
    linkedTxIds.push(taxTxId);
    await addRecord(STORES.TRANSACTIONS, {
      ...baseTx,
      id: taxTxId,
      type: 'expense',
      amount: tax,
      myAmount: tax,
      name: `${slashDate} 賣出 ${symbol} 證交稅`,
      categoryId: 'cat_sys_stock_tax',
      note: `${shares} 股證交稅 (稅率 ${parsedTaxRate}%)`,
      createdAt: nowTs + 2
    });
  }

  await addRecord(STORES.STOCK_TRADES, {
    id: `st_${nowTs}`,
    accountId: account.id,
    type: form.tradeType,
    date: form.date,
    settlementDate,
    symbol,
    shares,
    price,
    feeDiscount: Number(form.feeDiscount) || 10,
    taxRate: parsedTaxRate,
    fee,
    tax,
    linkedTxIds,
    createdAt: nowTs
  });

  return symbol;
}

export async function removeStockTradeWithSettlement(trade) {
  if (Array.isArray(trade.linkedTxIds)) {
    for (const txId of trade.linkedTxIds) {
      await deleteRecord(STORES.TRANSACTIONS, txId);
    }
  }
  await deleteRecord(STORES.STOCK_TRADES, trade.id);
}
