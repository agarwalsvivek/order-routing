import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import type { Order, OrderEvent, OrderFeed } from '../types';

type Action = OrderEvent | { type: 'add'; order: Order };

function reducer(orders: Order[], a: Action): Order[] {
  switch (a.type) {
    case 'snapshot': return a.orders;
    case 'new':
    case 'add': return orders.some((o) => o.id === a.order.id) ? orders : [...orders, a.order];
    case 'update': return orders.map((o) => (o.id === a.id ? { ...o, ...a.patch } : o));
  }
}

/** Orders from the feed plus client-side additions and patches, and the current selection. */
export function useOrderStream(feed: OrderFeed) {
  const [orders, dispatch] = useReducer(reducer, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => feed.subscribe(dispatch), [feed]);

  const select = useCallback((id: string | null) => setSelectedId(id), []);
  const addOrder = useCallback((order: Order) => dispatch({ type: 'add', order }), []);
  const patchOrder = useCallback((id: string, patch: Partial<Order>) => dispatch({ type: 'update', id, patch }), []);
  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  return { orders, selectedId, selectedOrder, select, addOrder, patchOrder };
}
