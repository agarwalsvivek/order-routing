import { useState, type FormEvent } from "react";
import { CLIENTS, SYMBOLS } from "../mocks/data-feed";
import {
  MKT_STATE,
  fmtPrice,
  priceInstruction,
  validateQty,
  type PriceState,
} from "../lib/pricing";
import type { Side, TopOfBook } from "../types";
import { PriceInput } from "./PriceInput";

/** What the ticket hands to the app. The app owns id, status and the fill fields. */
export interface NewOrderDraft {
  client: string;
  symbol: string;
  side: Side;
  qty: number;
  /** limit in cents, or null for a MARKET order */
  limitPrice: number | null;
}

interface Props {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  tob: TopOfBook | null;
  onSubmit: (draft: NewOrderDraft) => void;
}

export function OrderTicket({ symbol, onSymbolChange, tob, onSubmit }: Props) {
  const [client, setClient] = useState<string>(CLIENTS[0]);
  const [side, setSide] = useState<Side>("BUY");
  const [qty, setQty] = useState("100");
  const [px, setPx] = useState<PriceState>(MKT_STATE); // default: a valid MKT order

  const ins = priceInstruction(px, side, tob);
  const qtyErrs = validateQty(qty);
  const ok = qtyErrs.length === 0 && ins.kind !== "INVALID";
  const tag =
    ins.kind === "LIMIT"
      ? fmtPrice(ins.price)
      : ins.kind === "MARKET"
        ? "MKT"
        : "…";

  function submit(e: FormEvent) {
    e.preventDefault();
    if (ins.kind === "INVALID" || !ok) return;
    onSubmit({
      client,
      symbol,
      side,
      qty: Number(qty),
      limitPrice: ins.kind === "LIMIT" ? ins.price : null,
    });
  }

  return (
    <form
      className="panel flex flex-col gap-3"
      onSubmit={submit}
      aria-label="New order"
    >
      <span className="label">New order</span>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="label">Client</span>
          <select value={client} onChange={(e) => setClient(e.target.value)}>
            {CLIENTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label">Symbol</span>
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="label">Side</span>
          <div
            className="grid grid-cols-2 overflow-hidden rounded border border-gray-700"
            role="radiogroup"
            aria-label="Side"
          >
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={side === s}
                onClick={() => setSide(s)}
                className={`py-1.5 text-xs font-semibold tracking-widest ${side === s ? (s === "BUY" ? "bg-emerald-600 text-white" : "bg-red-600 text-white") : "bg-gray-900 text-gray-400"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="label">Qty</span>
          <input
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="tabular-nums"
          />
        </label>
      </div>
      <div className="flex flex-col gap-1">
        <span className="label">Price</span>
        <PriceInput
          id="order-price"
          value={px}
          onChange={setPx}
          side={side}
          tob={tob}
        />
      </div>
      {qtyErrs.map((m) => (
        <p
          key={m}
          className="rounded border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-300"
        >
          {m}
        </p>
      ))}
      <button
        type="submit"
        disabled={!ok}
        className={`rounded py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-40 ${side === "BUY" ? "bg-emerald-600" : "bg-red-600"}`}
      >
        Send {side} {qty.trim()} {symbol} @ {tag}
      </button>
    </form>
  );
}
