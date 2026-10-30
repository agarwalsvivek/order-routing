// Timer-driven mock feeds. Simulated data only, not real prices.
import type { MarketDataFeed, Order, OrderFeed, TopOfBook } from '../types';

export const SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'JPM', 'TSLA'] as const;
export const CLIENTS = ['Fidelity', 'Vanguard', 'BlackRock', 'T. Rowe Price', 'Wellington'] as const;
export const VENUES = ['XNAS', 'XNYS', 'ARCX', 'BATS', 'IEXG'] as const;

const START_MID: Record<string, number> = { AAPL: 18552, MSFT: 42010, NVDA: 11840, JPM: 19875, TSLA: 24230 };
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: readonly T[]) => xs[rnd(0, xs.length - 1)];

// One shared random walk per symbol, so every subscriber sees the same book.
const mids = new Map<string, number>();
function nextTob(symbol: string): TopOfBook {
  const mid = Math.max(100, (mids.get(symbol) ?? START_MID[symbol] ?? 10000) + rnd(-3, 3));
  mids.set(symbol, mid);
  const spread = rnd(1, 3);
  const bid = mid - Math.floor(spread / 2);
  const ask = bid + spread;
  const r = Math.random();
  const last = r < 0.4 ? bid : r < 0.8 ? ask : Math.round((bid + ask) / 2);
  return { bid, ask, last, bidSize: rnd(1, 20) * 100, askSize: rnd(1, 20) * 100, ts: Date.now() };
}

type TobListener = (tob: TopOfBook) => void;

export function createMarketDataFeed(intervalMs = 700): MarketDataFeed {
  // symbol -> listener -> timer. Subscribing the same pair twice replaces the first timer.
  const timers = new Map<string, Map<TobListener, ReturnType<typeof setInterval>>>();
  const feed: MarketDataFeed = {
    subscribe(symbol, listener) {
      feed.unsubscribe(symbol, listener);
      listener(nextTob(symbol));
      const t = setInterval(() => listener(nextTob(symbol)), intervalMs);
      if (!timers.has(symbol)) timers.set(symbol, new Map());
      timers.get(symbol)!.set(listener, t);
      return () => feed.unsubscribe(symbol, listener);
    },
    unsubscribe(symbol, listener) {
      const bySymbol = timers.get(symbol);
      const t = bySymbol?.get(listener);
      if (t === undefined) return;
      clearInterval(t);
      bySymbol!.delete(listener);
      if (!bySymbol!.size) timers.delete(symbol);
    },
  };
  return feed;
}

const status = (o: Pick<Order, 'qty' | 'filledQty'>): Order['status'] =>
  o.filledQty >= o.qty ? 'FILLED' : o.filledQty > 0 ? 'PARTIAL' : 'WORKING';

function seedOrders(): Order[] {
  const now = Date.now();
  const o = (n: number, client: string, symbol: string, side: Order['side'], qty: number,
    limitPrice: number | null, filledQty: number, routedQty: number, st?: Order['status']): Order =>
    ({ id: `ORD-${String(n).padStart(5, '0')}`, client, symbol, side, qty, limitPrice, filledQty, routedQty,
       status: st ?? status({ qty, filledQty }), createdAt: now - n * 60_000 });
  return [
    o(1, 'Fidelity', 'AAPL', 'BUY', 1000, 18560, 200, 400),
    o(2, 'Vanguard', 'MSFT', 'SELL', 500, null, 0, 0, 'NEW'),
    o(3, 'BlackRock', 'NVDA', 'BUY', 2000, 11850, 2000, 0),
    o(4, 'T. Rowe Price', 'JPM', 'SELL', 300, 19890, 0, 0, 'CANCELLED'),
    o(5, 'Fidelity', 'TSLA', 'BUY', 150, null, 50, 0),
  ];
}

/**
 * Emits a snapshot on subscribe, then partial fills (filledQty and status are feed-owned)
 * and the occasional new order. routedQty is owned by the client, and the mock feed never touches it.
 */
export function createOrderFeed(): OrderFeed {
  return {
    subscribe(listener) {
      const book = seedOrders();
      let seq = 100;
      listener({ type: 'snapshot', orders: book.map((o) => ({ ...o })) });
      const fills = setInterval(() => {
        const open = book.filter((o) => o.status === 'WORKING' || o.status === 'PARTIAL');
        if (!open.length || Math.random() > 0.5) return;
        const o = pick(open);
        const cap = o.qty - o.routedQty;
        if (o.filledQty >= cap) return;
        o.filledQty = Math.min(cap, o.filledQty + Math.max(1, Math.round(o.qty * 0.1)));
        o.status = status(o);
        listener({ type: 'update', id: o.id, patch: { filledQty: o.filledQty, status: o.status } });
      }, 1500);
      const arrivals = setInterval(() => {
        if (book.length >= 14) return;
        const symbol = pick(SYMBOLS);
        const side = pick(['BUY', 'SELL'] as const);
        const mid = mids.get(symbol) ?? START_MID[symbol];
        const limit = Math.random() < 0.6;
        const order: Order = {
          id: `FEED-${String(++seq).padStart(5, '0')}`, client: pick(CLIENTS), symbol, side, qty: rnd(1, 20) * 100,
          limitPrice: limit ? mid + rnd(-5, 5) : null, filledQty: 0, routedQty: 0, status: 'NEW', createdAt: Date.now(),
        };
        book.push(order);
        listener({ type: 'new', order: { ...order } });
      }, 9000);
      return () => { clearInterval(fills); clearInterval(arrivals); };
    },
  };
}
