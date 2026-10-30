# Order Routing

Blotter, top of book, new order ticket, route ticket and route list on mock feeds (simulated data, not real prices).
`src/App.tsx` is left as provided: `handleSelect`, `handleCreate` and `handleRoute` are TODOs, so selecting, sending and routing do nothing until you implement them.

```bash
npm install
npm run dev
npm test        # pricing and routing rules (vitest)
npm run build
```

## Where things are
- `src/lib/pricing.ts` benchmark resolution, price box states, leaves, route validation (prices are integer cents)
- `src/mocks/data-feed.ts` `createOrderFeed`, `createMarketDataFeed`, `SYMBOLS`
- `src/hooks/` `useOrderStream` (orders, selection, `addOrder`, `patchOrder`) and `useMarketData`
- `src/components/` the five panels plus `PriceInput`

## Notes for the TODOs
- `useOrderStream().select(id)` takes an order id. `selectedOrder` follows live feed updates.
- The feed owns `filledQty` and `status`. The client owns `routedQty`, and the mock feed never changes it.
- `NewOrderDraft.limitPrice` and `RouteDraft.price` are cents, `null` meaning MARKET / MKT.
- The ticket symbol and the market data subscription share one `symbol` state in App.
