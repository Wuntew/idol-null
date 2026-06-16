export default function DemoModeBanner() {
  return (
    <div className="panel p-amber demo-banner" style={{ gridColumn: '1 / -1', padding: 8 }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="c-amber text-[12px] tracking-wide">OFFLINE PREVIEW</div>
          <div className="c-dim text-[10px]">
            Local demo data is loaded because Supabase environment variables are not configured.
          </div>
        </div>
        <span className="tag c-amber">read-only</span>
      </div>
    </div>
  )
}
