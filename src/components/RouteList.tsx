import { fmtPrice } from '../lib/pricing';
import type { Route } from '../types';

export function RouteList({ routes }: { routes: Route[] }) {
  return (
    <section className="panel" aria-label="Routes">
      <span className="label">Routes</span>
      {routes.length === 0 ? (
        <p className="mt-2 text-gray-500">No routes sent yet.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left tabular-nums text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-gray-500">
              <tr><th className="pr-3">ID</th><th className="pr-3">Parent</th><th className="pr-3">Venue</th><th className="pr-3 text-right">Qty</th><th className="text-right">Price</th></tr>
            </thead>
            <tbody>
              {[...routes].reverse().map((r) => (
                <tr key={r.id} className="border-t border-gray-800">
                  <td className="py-1 pr-3">{r.id}</td><td className="pr-3">{r.parentId}</td><td className="pr-3">{r.venue}</td>
                  <td className="pr-3 text-right">{r.qty}</td><td className="text-right">{r.price === null ? 'MKT' : fmtPrice(r.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
