import { Icon } from './Icon'

export function KpiCard({
  label,
  value,
  detail,
  icon,
  trend,
  progress,
}: {
  label: string
  value: string
  detail: string
  icon: string
  trend?: string
  progress?: number
}) {
  return (
    <article className="rounded-2xl border border-[#e1e5ea] bg-white p-4 shadow-[0_2px_12px_rgba(26,35,55,0.04)] dark:border-white/10 dark:bg-[#131a26]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8a94a5]">
            {label}
          </p>
          <p className="mt-2 truncate text-[24px] font-extrabold tracking-[-0.04em]">{value}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0f2f7] text-[#5d687c] dark:bg-white/[0.07] dark:text-[#b6c0d5]">
          <Icon name={icon} className="size-[17px]" />
        </span>
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f3] dark:bg-white/10">
          <div
            className={`h-full rounded-full ${progress > 100 ? 'bg-[#ef765d]' : 'bg-[#6579e8]'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      <div
        className={`${progress !== undefined ? 'mt-2' : 'mt-3'} flex items-center justify-between gap-2`}
      >
        <span className="truncate text-xs font-semibold text-[#8a93a4]">{detail}</span>
        {trend && (
          <span className="shrink-0 rounded-md bg-[#fff0ed] px-1.5 py-1 text-[10px] font-extrabold text-[#d35e47] dark:bg-[#582f2a]/50 dark:text-[#ff9e8a]">
            {trend}
          </span>
        )}
      </div>
    </article>
  )
}
