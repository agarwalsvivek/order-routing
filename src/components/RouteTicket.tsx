import { useState, type FormEvent } from 'react';
import { VENUES } from '../mocks/data-feed';
import { fmtPrice, leavesOf, priceInstruction, validateRoute, type PriceState } from '../lib/pricing';
import type { Order, TopOfBook } from '../types';
import { PriceInput } from './PriceInput';

/** What the ticket hands to the app. The app owns the route id. */
export interface RouteDraft {
  parentId: string;
  venue: string;
  qty: number;
  /** child limit in cents, or null for a MKT child */
  price: number | null;
}

interface Props {
  order: Order | null;
  tob: TopOfBook | null;
  onRoute: (draft: RouteDraft) => void;
}

export function RouteTicket({ order, tob, onRoute }: Props) {
  if (!order) {
    return (
      <section className="panel" aria-label="Route ticket">
        <span className="label">Route ticket</span>
        <p className="mt-2 text-gray-500">Select an order in the blotter to route it.</p>
      </section>
    );
  }
  // keyed on the parent id so the form resets for every new parent
  return <RouteForm key={order.id} order={order} tob={tob} onRoute={onRoute} />;
}

function RouteForm({ order, tob, onRoute }: { order: Order; tob: TopOfBook | null; onRoute: (d: RouteDraft) => void }) {
  const leaves = leavesOf(order);
  const [venue, setVenue] = useState<string>(VENUES[0]);
  const [qty, setQty] = useState(leaves > 0 ? String(leaves) : '');
  const [px, setPx] = useState<PriceState>(() =>
    order.limitPrice === null ? { bench: 'MKT', text: '' } : { bench: null, text: fmtPrice(order.limitPrice) });
  const [rejected, setRejected] = useState(false);

  const ins = priceInstruction(px, order.side, tob);
  const fails = validateRoute(order, qty, ins); // every failure at once
  const tag = ins.kind === 'LIMIT' ? fmtPrice(ins.price) : ins.kind === 'MARKET' ? 'MKT' : '…';

  function submit(e: FormEvent) {
    e.preventDefault();
    if (fails.length || ins.kind === 'INVALID') { setRejected(true); return; }
    setRejected(false);
    onRoute({ parentId: order.id, venue, qty: Number(qty), price: ins.kind === 'LIMIT' ? ins.price : null });
  }

  return (
    <form className="panel flex flex-col gap-3" onSubmit={submit} aria-label="Route ticket">
      <div className="flex items-baseline justify-between"><span className="label">Route ticket</span><span className="text-[11px] text-gray-500">{order.id}</span></div>
      <p className="text-xs text-gray-400">
        <b className={order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{order.side}</b> {order.qty} {order.symbol} ·{' '}
        {order.limitPrice === null ? 'MARKET' : `LIMIT ${fmtPrice(order.limitPrice)}`} · {order.status}
        <br />leaves <b className="text-gray-100">{leaves}</b> = {order.qty} − {order.filledQty} filled − {order.routedQty} routed
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className="label">Venue</span>
          <select value={venue} onChange={(e) => setVenue(e.target.value)}>{VENUES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className="label">Qty</span>
          <input inputMode="numeric" value={qty} onChange={(e) => { setRejected(false); setQty(e.target.value); }} className="tabular-nums" /></label>
      </div>
      <div className="flex flex-col gap-1"><span className="label">Child price</span>
        <PriceInput id="route-price" label="Child price" value={px} onChange={(v) => { setRejected(false); setPx(v); }} side={order.side} tob={tob} /></div>
      {fails.length > 0 ? (
        <div role="alert">
          <p className="label mb-1 text-red-400">{fails.length} check{fails.length > 1 ? 's' : ''} failed</p>
          <ul className="flex flex-col gap-1">{fails.map((m) => <li key={m} className="rounded border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-300">{m}</li>)}</ul>
        </div>
      ) : <p className="rounded border border-emerald-500/60 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">All checks pass. Ready to route.</p>}
      <button type="submit" className="rounded bg-amber-600 py-2 text-xs font-semibold uppercase tracking-widest text-white">
        Route {qty.trim()} to {venue} @ {tag}
      </button>
      {rejected && <p className="text-xs text-red-400">Rejected. Nothing was sent.</p>}
    </form>
  );
}
