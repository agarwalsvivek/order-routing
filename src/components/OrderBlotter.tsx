import type { KeyboardEvent } from 'react';
import { fmtPrice, leavesOf } from '../lib/pricing';
import type { Order } from '../types';

interface Props {
  orders: Order[];
  selectedId: string | null;
  onSelect: (order: Order) => void;
}

const STATUS_TONE: Record<Order['status'], string> = {
  NEW: 'text-gray-400', WORKING: 'text-amber-400', PARTIAL: 'text-amber-400', FILLED: 'text-emerald-400', CANCELLED: 'text-gray-500 line-through',
};

export function OrderBlotter({ orders, selectedId, onSelect }: Props) {
  const rows = [...orders].reverse(); // newest first
  const onKey = (e: KeyboardEvent<HTMLTableRowElement>, o: Order, i: number) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(o); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
      if (next) { (e.currentTarget.parentElement?.children[rows.indexOf(next)] as HTMLElement | undefined)?.focus(); onSelect(next); }
    }
  };
  return (
    <section className="panel flex min-h-0 flex-1 flex-col p-0" aria-label="Order blotter">
      <div className="border-b border-gray-800 px-3 py-2"><span className="label">Blotter</span></div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full whitespace-nowrap text-left tabular-nums">
          <thead className="sticky top-0 bg-gray-900 text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              {['ID', 'Client', 'Symbol', 'Side', 'Qty', 'Limit', 'Filled', 'Routed', 'Leaves', 'Status'].map((h, i) => (
                <th key={h} className={`px-3 py-1.5 font-semibold ${i >= 4 && i <= 8 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id} tabIndex={0} aria-selected={o.id === selectedId} onClick={() => onSelect(o)} onKeyDown={(e) => onKey(e, o, i)}
                className={`cursor-pointer border-t border-gray-800 hover:bg-gray-800/60 ${o.id === selectedId ? 'bg-amber-400/10 outline outline-1 -outline-offset-1 outline-amber-400/60' : ''}`}>
                <td className="px-3 py-1.5">{o.id}</td>
                <td className="px-3 py-1.5">{o.client}</td>
                <td className="px-3 py-1.5">{o.symbol}</td>
                <td className={`px-3 py-1.5 font-semibold ${o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{o.side}</td>
                <td className="px-3 py-1.5 text-right">{o.qty}</td>
                <td className="px-3 py-1.5 text-right">{o.limitPrice === null ? 'MKT' : fmtPrice(o.limitPrice)}</td>
                <td className="px-3 py-1.5 text-right">{o.filledQty}</td>
                <td className="px-3 py-1.5 text-right">{o.routedQty}</td>
                <td className="px-3 py-1.5 text-right">{leavesOf(o)}</td>
                <td className={`px-3 py-1.5 text-[11px] font-semibold ${STATUS_TONE[o.status]}`}>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
