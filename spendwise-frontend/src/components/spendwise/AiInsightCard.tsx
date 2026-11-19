import { categories, currency, type CategoryKey } from './types'
import { Icon } from './Icon'

export interface LiveAiInsights {
  summary: string
  score: number
  status: string
  anomalies: string[]
}

export function AiInsightCard({
  loading,
  dailyAmounts,
  projected,
  budget,
  categoryAverages,
  aiInsights,
}: {
  loading: boolean
  dailyAmounts: Record<CategoryKey, number>
  projected: number
  budget: number
  categoryAverages: Record<CategoryKey, number>
  aiInsights?: LiveAiInsights | null
}) {
  const total = Object.values(dailyAmounts).reduce((sum, amount) => sum + amount, 0)
  const ranked = [...categories].sort((a, b) => dailyAmounts[b.id] - dailyAmounts[a.id])
  const top = ranked[0]
  const topDelta = categoryAverages[top.id]
    ? Math.round(
        ((dailyAmounts[top.id] - categoryAverages[top.id]) / categoryAverages[top.id]) * 100,
      )
    : 0
  const overBy = projected - budget
  const ratio = budget ? projected / budget : 0
  const fallbackScore = Math.max(
    28,
    Math.min(98, Math.round(100 - Math.max(0, ratio - 0.75) * 75 - (total > 6000 ? 8 : 0))),
  )

  const score = aiInsights?.score ?? fallbackScore
  const status =
    aiInsights?.status ??
    (score >= 80 ? 'On track' : score >= 65 ? 'Needs attention' : 'High burn rate')

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#ccd4ff] bg-[#f3f5ff] p-5 shadow-[0_2px_12px_rgba(74,94,184,0.05)] dark:border-[#6375cc]/40 dark:bg-[#171e35]">
      <div className="pointer-events-none absolute -top-16 -right-16 size-52 rounded-full bg-[#9bacff]/15 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#667ae8] text-white shadow-[0_6px_16px_rgba(102,122,232,0.25)]">
            <Icon name="spark" className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold">SpendWise AI Analysis</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.09em] text-[#6374d1] dark:bg-white/10 dark:text-[#aeb9fa]">
                {aiInsights ? 'Gemini Live' : 'Live'}
              </span>
            </div>
            {loading ? (
              <div className="mt-4 space-y-3" aria-label="Calculating analysis">
                <div className="h-3 w-11/12 animate-pulse rounded-full bg-[#dce1f8] dark:bg-white/10" />
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-[#dce1f8] dark:bg-white/10" />
                <div className="mt-5 h-2.5 w-7/12 animate-pulse rounded-full bg-[#e0e4f7] dark:bg-white/10" />
                <div className="h-2.5 w-8/12 animate-pulse rounded-full bg-[#e0e4f7] dark:bg-white/10" />
              </div>
            ) : aiInsights ? (
              <>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#48536b] dark:text-[#c2cbe0]">
                  {aiInsights.summary}
                </p>
                <ul className="mt-4 grid gap-2 text-xs font-semibold text-[#59657b] dark:text-[#b6c0d6] sm:grid-cols-2">
                  {aiInsights.anomalies.map((item, idx) => (
                    <li
                      key={idx}
                      className={`flex items-center gap-2 ${idx === 2 ? 'sm:col-span-2' : ''}`}
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#eef1ff] text-[#667ae8] dark:bg-white/10">
                        <Icon name={idx === 0 ? 'trendUp' : idx === 1 ? 'info' : 'check'} className="size-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#48536b] dark:text-[#c2cbe0]">
                  At your current burn rate, you’re projected to{' '}
                  {overBy > 0 ? 'exceed' : 'finish within'} your monthly budget{' '}
                  {overBy > 0 ? (
                    <>
                      by <strong className="text-[#d5604a]">{currency.format(overBy)}</strong>
                    </>
                  ) : (
                    <>
                      with{' '}
                      <strong className="text-[#27966d]">
                        {currency.format(Math.abs(overBy))}
                      </strong>{' '}
                      to spare
                    </>
                  )}
                  .
                </p>
                <ul className="mt-4 grid gap-2 text-xs font-semibold text-[#59657b] dark:text-[#b6c0d6] sm:grid-cols-2">
                  <li className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#ffe9e4] text-[#da634a] dark:bg-[#643a34]">
                      <Icon name="trendUp" className="size-3" />
                    </span>
                    {top.name} is {Math.abs(topDelta)}% {topDelta >= 0 ? 'higher' : 'lower'} than
                    its daily average.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#fff2cd] text-[#b88618] dark:bg-[#5c4c28]">
                      <Icon name="info" className="size-3" />
                    </span>
                    {ranked[1].name} is your second-largest spend at{' '}
                    {currency.format(dailyAmounts[ranked[1].id])}.
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
        {!loading && (
          <div className="flex shrink-0 items-center border-t border-[#d9def5] pt-4 md:w-40 md:border-t-0 md:border-l md:pt-0 md:pl-5 dark:border-white/10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8b95ac]">
                Today’s score
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-extrabold tracking-[-0.05em]">{score}</span>
                <span className="mb-1 text-xs font-bold text-[#8b95a8]">/ 100</span>
              </div>
              <p
                className={`mt-1 text-[11px] font-bold ${score >= 80 ? 'text-[#27966d]' : 'text-[#d16049]'}`}
              >
                {status}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
