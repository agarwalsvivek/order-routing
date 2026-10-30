import type { Order, Side, TopOfBook } from '../types';

export const BENCHMARKS = ['MKT', 'BID', 'ASK', 'LAST', 'NEAR', 'FAR', 'MID'] as const;
export type Benchmark = (typeof BENCHMARKS)[number];

/** What the price box holds. An empty box and the MKT chip are the same state. */
export interface PriceState {
  bench: Benchmark | null;
  text: string;
}
export const MKT_STATE: PriceState = { bench: 'MKT', text: '' };

export type PriceInstruction =
  | { kind: 'MARKET' }
  | { kind: 'LIMIT'; price: number; source: Benchmark | null }
  | { kind: 'INVALID'; error: string };

export const fmtPrice = (cents: number) => (cents / 100).toFixed(2);

export function resolveBenchmark(b: Benchmark, side: Side, tob: TopOfBook | null): number | null {
  if (b === 'MKT' || !tob) return null;
  switch (b) {
    case 'BID': return tob.bid;
    case 'ASK': return tob.ask;
    case 'LAST': return tob.last;
    case 'NEAR': return side === 'BUY' ? tob.bid : tob.ask;
    case 'FAR': return side === 'BUY' ? tob.ask : tob.bid;
    case 'MID': return Math.round((tob.bid + tob.ask) / 2);
  }
}

export function parsePriceText(text: string): { empty: true } | { error: string } | { cents: number } {
  const t = text.trim();
  if (t === '') return { empty: true };
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return { error: 'Price must be a number like 185.52.' };
  if (/\.\d{3,}/.test(t)) return { error: 'Price takes at most 2 decimals.' };
  const cents = Math.round(Number(t) * 100);
  if (!(cents > 0)) return { error: 'Price must be greater than 0.' };
  return { cents };
}

/** Turns the price box state into what gets dispatched. */
export function priceInstruction(state: PriceState, side: Side, tob: TopOfBook | null): PriceInstruction {
  if (state.bench) {
    if (state.bench === 'MKT') return { kind: 'MARKET' };
    const price = resolveBenchmark(state.bench, side, tob);
    if (price === null) return { kind: 'INVALID', error: 'No market data yet for this symbol.' };
    return { kind: 'LIMIT', price, source: state.bench };
  }
  const p = parsePriceText(state.text);
  if ('empty' in p) return { kind: 'MARKET' };
  if ('error' in p) return { kind: 'INVALID', error: p.error };
  return { kind: 'LIMIT', price: p.cents, source: null };
}

/** Focus freezes a tracking benchmark at the level showing, so the number can be edited. */
export function freezeOnFocus(state: PriceState, side: Side, tob: TopOfBook | null): PriceState {
  if (state.bench && state.bench !== 'MKT') {
    const p = resolveBenchmark(state.bench, side, tob);
    if (p !== null) return { bench: null, text: fmtPrice(p) };
  }
  return state;
}

export function onTextEdit(text: string): PriceState {
  return { bench: text.trim() === '' ? 'MKT' : null, text };
}

/** leaves = qty - filledQty - routedQty (disjoint buckets) */
export const leavesOf = (o: Pick<Order, 'qty' | 'filledQty' | 'routedQty'>) => o.qty - o.filledQty - o.routedQty;

export function validateQty(str: string, leaves?: number): string[] {
  const s = str.trim();
  if (s === '') return ['Qty is required.'];
  if (!/^-?\d+(\.\d+)?$/.test(s)) return ['Qty must be a number.'];
  const n = Number(s);
  const f: string[] = [];
  if (!Number.isInteger(n)) f.push('Qty must be a whole number.');
  if (n <= 0) f.push('Qty must be greater than 0.');
  if (leaves !== undefined && n > leaves) f.push(`Qty ${s} exceeds leaves ${leaves}.`);
  return f;
}

/** Every failure, not just the first. */
export function validateRoute(order: Order, qtyStr: string, instr: PriceInstruction): string[] {
  const f: string[] = [];
  const leaves = leavesOf(order);
  if (order.status === 'FILLED' || order.status === 'CANCELLED') {
    f.push(`Parent is ${order.status} and cannot be routed.`);
  }
  for (const m of validateQty(qtyStr, leaves)) {
    f.push(m.includes('exceeds')
      ? `${m.replace(/\.$/, '')} (${order.qty} qty − ${order.filledQty} filled − ${order.routedQty} routed).`
      : m);
  }
  if (instr.kind === 'INVALID') {
    f.push(instr.error);
  } else if (order.limitPrice !== null) {
    const L = fmtPrice(order.limitPrice);
    if (instr.kind === 'MARKET') {
      f.push(`MKT child against a LIMIT parent (${L}) is rejected: a market order can trade through the parent limit.`);
    } else if (order.side === 'BUY' && instr.price > order.limitPrice) {
      f.push(`Child price ${fmtPrice(instr.price)} breaches the parent BUY limit ${L}: a BUY may pay ${L} or less.`);
    } else if (order.side === 'SELL' && instr.price < order.limitPrice) {
      f.push(`Child price ${fmtPrice(instr.price)} breaches the parent SELL limit ${L}: a SELL may receive ${L} or more.`);
    }
  }
  return f;
}
