import { describe, expect, it } from 'vitest';
import { freezeOnFocus, leavesOf, onTextEdit, priceInstruction, resolveBenchmark, validateRoute } from './pricing';
import type { Order, TopOfBook } from '../types';

const tob: TopOfBook = { bid: 18551, ask: 18554, last: 18552, bidSize: 100, askSize: 100, ts: 0 };
const parent = (o: Partial<Order> = {}): Order => ({
  id: 'P', client: 'c', symbol: 'AAPL', side: 'BUY', qty: 1000, limitPrice: 18560,
  filledQty: 200, routedQty: 400, status: 'PARTIAL', createdAt: 0, ...o,
});
const lim = (price: number) => ({ kind: 'LIMIT' as const, price, source: null });

describe('benchmarks', () => {
  it('resolve per side', () => {
    expect(resolveBenchmark('NEAR', 'BUY', tob)).toBe(18551);
    expect(resolveBenchmark('NEAR', 'SELL', tob)).toBe(18554);
    expect(resolveBenchmark('FAR', 'BUY', tob)).toBe(18554);
    expect(resolveBenchmark('FAR', 'SELL', tob)).toBe(18551);
    expect(resolveBenchmark('MID', 'BUY', tob)).toBe(18553);
    for (const s of ['BUY', 'SELL'] as const) {
      expect(resolveBenchmark('BID', s, tob)).toBe(18551);
      expect(resolveBenchmark('ASK', s, tob)).toBe(18554);
      expect(resolveBenchmark('LAST', s, tob)).toBe(18552);
    }
  });
});

describe('price box', () => {
  it('empty box and MKT are the same instruction', () => {
    expect(priceInstruction({ bench: 'MKT', text: '' }, 'BUY', tob)).toEqual({ kind: 'MARKET' });
    expect(priceInstruction({ bench: null, text: '  ' }, 'BUY', tob)).toEqual({ kind: 'MARKET' });
    expect(onTextEdit('')).toEqual({ bench: 'MKT', text: '' });
  });
  it('typed numbers and bad input', () => {
    expect(priceInstruction({ bench: null, text: '185.5' }, 'BUY', tob)).toEqual({ kind: 'LIMIT', price: 18550, source: null });
    for (const t of ['abc', '1.234', '0', '-1', '1e3']) {
      expect(priceInstruction({ bench: null, text: t }, 'BUY', tob).kind).toBe('INVALID');
    }
  });
  it('focus freezes a tracking benchmark, and leaves MKT alone', () => {
    expect(freezeOnFocus({ bench: 'ASK', text: '' }, 'BUY', tob)).toEqual({ bench: null, text: '185.54' });
    const mkt = { bench: 'MKT' as const, text: '' };
    expect(freezeOnFocus(mkt, 'BUY', tob)).toBe(mkt);
  });
});

describe('routing', () => {
  it('leaves = qty - filled - routed', () => expect(leavesOf(parent())).toBe(400));
  it('BUY: equal or better ok, worse rejected', () => {
    expect(validateRoute(parent(), '400', lim(18560))).toEqual([]);
    expect(validateRoute(parent(), '400', lim(18500))).toEqual([]);
    expect(validateRoute(parent(), '400', lim(18561))).toHaveLength(1);
  });
  it('SELL: equal or better ok, worse rejected', () => {
    const s = parent({ side: 'SELL', limitPrice: 19890 });
    expect(validateRoute(s, '10', lim(19890))).toEqual([]);
    expect(validateRoute(s, '10', lim(19950))).toEqual([]);
    expect(validateRoute(s, '10', lim(19800))).toHaveLength(1);
  });
  it('MKT child vs LIMIT parent is rejected; MARKET parent allows anything', () => {
    expect(validateRoute(parent(), '10', { kind: 'MARKET' })).toHaveLength(1);
    const m = parent({ limitPrice: null });
    expect(validateRoute(m, '10', { kind: 'MARKET' })).toEqual([]);
    expect(validateRoute(m, '10', lim(99999))).toEqual([]);
  });
  it('qty must be a whole number > 0 and <= leaves', () => {
    expect(validateRoute(parent(), '401', lim(18560))).toHaveLength(1);
    expect(validateRoute(parent(), '-3', lim(18560))).toHaveLength(1);
    expect(validateRoute(parent(), '', lim(18560))).toHaveLength(1);
  });
  it('reports every failure at once', () => {
    expect(validateRoute(parent(), '500.5', lim(18700))).toHaveLength(3);
  });
  it('FILLED and CANCELLED parents cannot be routed', () => {
    expect(validateRoute(parent({ status: 'FILLED', filledQty: 1000, routedQty: 0 }), '5', lim(18560))).toHaveLength(2);
    expect(validateRoute(parent({ status: 'CANCELLED' }), '5', lim(18560))).toHaveLength(1);
  });
});
