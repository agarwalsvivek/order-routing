// All prices are integer cents. Format with fmtPrice() from lib/pricing.
export type Side = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'WORKING' | 'PARTIAL' | 'FILLED' | 'CANCELLED';

export interface Order {
  id: string;
  client: string;
  symbol: string;
  side: Side;
  qty: number;
  /** null = MARKET order, otherwise the limit in cents */
  limitPrice: number | null;
  /** feed-owned */
  filledQty: number;
  /** client-owned: quantity currently sent to venues and not yet filled */
  routedQty: number;
  /** feed-owned */
  status: OrderStatus;
  createdAt: number;
}

export interface TopOfBook {
  bid: number;
  ask: number;
  last: number;
  bidSize: number;
  askSize: number;
  ts: number;
}

export interface Route {
  id: string;
  parentId: string;
  venue: string;
  qty: number;
  /** null = MKT child */
  price: number | null;
  createdAt: number;
}

export type OrderEvent =
  | { type: 'snapshot'; orders: Order[] }
  | { type: 'new'; order: Order }
  | { type: 'update'; id: string; patch: Partial<Order> };

export interface OrderFeed {
  subscribe(listener: (event: OrderEvent) => void): () => void;
}

export interface MarketDataFeed {
  /** Returns a function equivalent to calling unsubscribe(symbol, listener). */
  subscribe(symbol: string, listener: (tob: TopOfBook) => void): () => void;
  /** Stops updates for this symbol/listener pair. No-op if it isn't subscribed. */
  unsubscribe(symbol: string, listener: (tob: TopOfBook) => void): void;
}
