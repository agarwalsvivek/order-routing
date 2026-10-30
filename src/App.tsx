import { useMemo, useRef, useState } from "react";
import { OrderBlotter } from "./components/OrderBlotter";
import { OrderTicket } from "./components/OrderTicket";
import { RouteList } from "./components/RouteList";
import { RouteTicket } from "./components/RouteTicket";
import { TopOfBookBar } from "./components/TopOfBookBar";
import { useMarketData } from "./hooks/use-market-data";
import { useOrderStream } from "./hooks/use-order-stream";
import {
  SYMBOLS,
  createMarketDataFeed,
  createOrderFeed,
} from "./mocks/data-feed";
import type { MarketDataFeed, Order, OrderFeed, Route } from "./types";
import type { NewOrderDraft } from "./components/OrderTicket";
import type { RouteDraft } from "./components/RouteTicket";

interface AppProps {
  /** Injectable for tests. Defaults to the live timer-driven feeds. */
  orderFeed?: OrderFeed;
  marketDataFeed?: MarketDataFeed;
}

export function App({ orderFeed, marketDataFeed }: AppProps = {}) {
  const orders$ = useMemo(() => orderFeed ?? createOrderFeed(), [orderFeed]);
  const md$ = useMemo(
    () => marketDataFeed ?? createMarketDataFeed(),
    [marketDataFeed],
  );

  const { orders, selectedId, selectedOrder, select, addOrder, patchOrder } =
    useOrderStream(orders$);

  const [symbol, setSymbol] = useState<string>(SYMBOLS[0]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const sequence = useRef(1);

  const tob = useMarketData(md$, symbol);

  // TODO: select the order AND move the market data subscription to it.
  function handleSelect(order: Order) {}

  // TODO: mint an id ("MAN-00001"), fill in the feed-owned fields, add it.
  function handleCreate(draft: NewOrderDraft) {
    console.log("handleCreate", draft);
  }

  // TODO: record the route ("RTE-00001") and bump the parent's routedQty.
  function handleRoute(draft: RouteDraft) {}

  return (
    <div className="flex h-screen flex-col gap-3 p-3">
      <header className="flex items-baseline gap-3">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-gray-300">
          Order Routing
        </h1>
        <span className="text-xs text-gray-600">
          {orders.length} orders · {routes.length} routes
        </span>
      </header>

      <TopOfBookBar symbol={symbol} tob={tob} />

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3">
        <div className="col-span-2 flex min-h-0 flex-col">
          <OrderBlotter
            orders={orders}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-auto">
          <OrderTicket
            symbol={symbol}
            onSymbolChange={setSymbol}
            tob={tob}
            onSubmit={handleCreate}
          />
          <RouteTicket order={selectedOrder} tob={tob} onRoute={handleRoute} />
          <RouteList routes={routes} />
        </div>
      </div>
    </div>
  );
}
