import type { ReactNode } from 'react'

type IconProps = { name: string; className?: string }

const paths: Record<string, ReactNode> = {
  spark: (
    <>
      <path d="M12 2.5c.6 4 2.5 5.9 6.5 6.5-4 .6-5.9 2.5-6.5 6.5C11.4 11.5 9.5 9.6 5.5 9 9.5 8.4 11.4 6.5 12 2.5Z" />
      <path d="M5 14.5c.3 2.3 1.5 3.5 3.8 3.8-2.3.3-3.5 1.5-3.8 3.7-.3-2.2-1.5-3.4-3.7-3.7 2.2-.3 3.4-1.5 3.7-3.8Z" />
    </>
  ),
  moon: <path d="M20.5 15.5A9 9 0 0 1 8.5 3.6a9 9 0 1 0 12 11.9Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  utensils: <path d="M7 3v7m-3-7v4a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 1 4 4 4 7h-4" />,
  car: (
    <>
      <path d="m5 17-2-1V9l2-1 2-4h10l2 4 2 1v7l-2 1" />
      <path d="M5 17v2h3v-2m8 0v2h3v-2M5 12h14M7 13h.01M17 13h.01" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l1 13H4L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6m-6 4h6m-6 4h4" />
    </>
  ),
  film: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 5v14m10-14v14M3 9h4m10 0h4M3 15h4m10 0h4" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8v4H8V6Zm0 8h.01m4 0h.01m4 0h.01M8 18h.01m4 0h.01m4 0h.01" />
    </>
  ),
  trendUp: <path d="m4 16 6-6 4 4 6-7m-5 0h5v5" />,
  wallet: (
    <>
      <path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" />
      <path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  forecast: (
    <>
      <path d="M4 19V5m0 14h17" />
      <path d="m7 15 4-5 3 3 6-7" />
      <path d="M16 6h4v4" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16m-10 4v6m4-6v6M9 3h6l1 4H8l1-4Zm-3 4 1 14h10l1-14" />
    </>
  ),
  save: (
    <>
      <path d="M5 3h12l2 2v16H5V3Z" />
      <path d="M8 3v6h8V3m-8 18v-7h8v7" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  sliders: (
    <>
      <path d="M4 6h8m4 0h4M4 12h3m4 0h9M4 18h10m4 0h2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
}

export function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
