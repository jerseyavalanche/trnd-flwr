export function MarketFeedStrip() {
  return (
    <div className="border-b border-grid-border bg-surface">
      <div className="mx-auto flex max-w-[1100px] gap-5 overflow-x-auto px-4 py-2 feed-scroll">
        <div className="ticker flex shrink-0 items-center gap-2 text-[11px]">
          <span className="text-muted-fg">MARKET_STRIP</span>
          <span className="text-primary-fg">UNWIRED</span>
          <span className="text-muted-fg">No real market feed configured.</span>
        </div>
      </div>
    </div>
  )
}
