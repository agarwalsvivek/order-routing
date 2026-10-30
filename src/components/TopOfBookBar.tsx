import { fmtPrice } from '../lib/pricing';
import type { TopOfBook } from '../types';

function Cell({ label, value, tone, sub }: { label: string; value: string; tone?: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="label">{label}</span>
      <span className={`text-xl tabular-nums ${tone ?? 'text-gray-100'}`}>{value}</span>
      {sub && <span className="text-[11px] text-gray-500">{sub}</span>}
    </div>
  );
}

export function TopOfBookBar({ symbol, tob }: { symbol: string; tob: TopOfBook | null }) {
  return (
    <div className="panel flex flex-wrap items-center gap-x-8 gap-y-2" aria-label="Top of book">
      <div className="flex flex-col">
        <span className="label">Symbol</span>
        <span className="text-xl font-semibold text-amber-400">{symbol}</span>
      </div>
      {tob ? (
        <>
          <Cell label="Bid" value={fmtPrice(tob.bid)} tone="text-emerald-400" sub={`${tob.bidSize} sh`} />
          <Cell label="Ask" value={fmtPrice(tob.ask)} tone="text-red-400" sub={`${tob.askSize} sh`} />
          <Cell label="Last" value={fmtPrice(tob.last)} />
          <Cell label="Spread" value={fmtPrice(tob.ask - tob.bid)} tone="text-gray-400" />
        </>
      ) : (
        <span className="text-gray-500">Waiting for market data…</span>
      )}
    </div>
  );
}
