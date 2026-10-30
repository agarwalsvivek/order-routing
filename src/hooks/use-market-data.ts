import { useEffect, useState } from "react";
import type { MarketDataFeed, TopOfBook } from "../types";

/** Live top of book for one symbol. Resubscribes when the symbol changes. */
export function useMarketData(
  feed: MarketDataFeed,
  symbol: string,
): TopOfBook | null {
  // TODO
  return null;
}
