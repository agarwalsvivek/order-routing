import {
  BENCHMARKS, fmtPrice, freezeOnFocus, onTextEdit, priceInstruction, resolveBenchmark,
  type PriceState,
} from '../lib/pricing';
import type { Side, TopOfBook } from '../types';

interface Props {
  id: string;
  label?: string;
  value: PriceState;
  onChange: (next: PriceState) => void;
  side: Side;
  tob: TopOfBook | null;
}

/** Price box + benchmark chips. A benchmark re-resolves on every tick until the box is focused. */
export function PriceInput({ id, label = 'Price', value, onChange, side, tob }: Props) {
  const ins = priceInstruction(value, side, tob);
  const tracking = value.bench !== null && value.bench !== 'MKT';
  const shown = value.bench === null ? value.text : value.bench === 'MKT' ? '' : ins.kind === 'LIMIT' ? fmtPrice(ins.price) : '';
  const level = value.bench === 'NEAR' ? (side === 'BUY' ? 'bid' : 'ask') : value.bench === 'FAR' ? (side === 'BUY' ? 'ask' : 'bid') : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1" role="group" aria-label={`${label} benchmark`}>
        {BENCHMARKS.map((b) => {
          const px = resolveBenchmark(b, side, tob);
          return (
            <button key={b} type="button" aria-pressed={value.bench === b}
              onClick={() => onChange({ bench: b, text: '' })}
              className={`flex flex-col items-center rounded border py-1 text-[11px] font-semibold tracking-wider ${
                value.bench === b ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'}`}>
              {b}
              <span className="h-3 text-[10px] font-normal text-gray-500">{px === null ? '' : fmtPrice(px)}</span>
            </button>
          );
        })}
      </div>
      <div className="relative">
        <input id={id} aria-label={label} inputMode="decimal" placeholder="MKT" autoComplete="off"
          className={`w-full tabular-nums ${tracking ? 'border-amber-400' : ''}`} value={shown}
          // Freeze on focus, not on first keystroke: a number that moves under the cursor can't be edited.
          onFocus={() => { const n = freezeOnFocus(value, side, tob); if (n !== value) onChange(n); }}
          onChange={(e) => onChange(onTextEdit(e.target.value))} />
        {tracking && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold tracking-widest text-amber-400">LIVE · {value.bench}</span>}
      </div>
      <p className={`min-h-4 text-[11px] ${ins.kind === 'INVALID' ? 'text-red-400' : 'text-gray-500'}`}>
        {ins.kind === 'MARKET' && <>Dispatches as <b className="text-gray-200">MARKET</b></>}
        {ins.kind === 'INVALID' && ins.error}
        {ins.kind === 'LIMIT' && <>Dispatches as <b className="text-gray-200">LIMIT {fmtPrice(ins.price)}</b>{tracking && ` · ${value.bench}${level ? ` (${level})` : ''} re-prices every tick`}</>}
      </p>
    </div>
  );
}
