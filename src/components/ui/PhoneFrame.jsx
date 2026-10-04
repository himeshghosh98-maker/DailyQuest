import { useEffect, useState } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery'
import { SHOW_PHONE_FRAME } from '../../constants'

/**
 * Phone size in CSS pixels. Content inside is laid out at exactly this size;
 * the whole device is then scaled with CSS `zoom`, which re-rasterizes text
 * at the final size so it stays perfectly sharp (unlike transform: scale).
 */
const DEVICE_W = 390
const DEVICE_H = 844

/** Body height budget (stage padding + breathing room) around the device. */
const STAGE_PAD = 48

/**
 * Wraps the app in a realistic phone mockup on wide screens; renders the app
 * full-screen on real phones / narrow windows (< 768px).
 *
 * The device scales to ~90% of the window height via `--phone-scale`
 * (consumed by `.phone-scale` in index.css as CSS `zoom`, with a
 * transform:scale fallback for engines without zoom support).
 *
 * Everything inside the phone screen is contained: `position: relative` +
 * `overflow: hidden` on the screen element make it the containing block for
 * absolutely-positioned overlays (modals, toasts, confetti) that were
 * `position: fixed` in full-screen mode. The CSS rule
 * `.phone-screen .app-fixed { position: absolute; }` retargets those
 * overlays to the phone screen.
 */
export default function PhoneFrame({ children }) {
  const isWide = useMediaQuery('(min-width: 768px)')
  const framed = SHOW_PHONE_FRAME && isWide

  // Live clock for the fake status bar.
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    if (!framed) return
    const t = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(t)
  }, [framed])

  // Track window height so the device always fills ~90% of it.
  const [winH, setWinH] = useState(() => window.innerHeight)
  useEffect(() => {
    if (!framed) return
    const onResize = () => setWinH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [framed])

  if (!framed) return <>{children}</>

  const time = now
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    .replace(/\s?[AP]M/i, '')

  // ~90% of the available window height, clamped so it never upscales blurry.
  const scale = Math.min((winH - STAGE_PAD) / DEVICE_H, 1)

  return (
    <div
      className="phone-stage relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#e9dfd6] via-[#f3ece5] to-[#dcc9b8] p-6"
      style={{ ['--phone-scale']: scale }}
    >
      {/* Soft warm glow behind the device */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="animate-glow h-[60%] w-[520px] rounded-full bg-tangerine/15 blur-3xl"
          style={{ width: 520 * scale, height: 560 * scale }}
        />
      </div>

      <div
        className="phone-scale relative"
        style={{ width: DEVICE_W, height: DEVICE_H }}
      >
        {/* Side buttons (graphite, volume + power) */}
        <div className="absolute -left-[3px] top-[130px] h-14 w-[3px] rounded-l-md bg-graphite-btn" />
        <div className="absolute -left-[3px] top-[196px] h-14 w-[3px] rounded-l-md bg-graphite-btn" />
        <div className="absolute -left-[3px] top-[262px] h-20 w-[3px] rounded-l-md bg-graphite-btn" />
        <div className="absolute -right-[3px] top-[210px] h-24 w-[3px] rounded-r-md bg-graphite-btn" />

        {/* Body: graphite bezel with premium highlights */}
        <div
          className="absolute inset-0 rounded-[54px] bg-gradient-to-b from-[#3a3a3c] via-[#242426] to-[#333335] p-[11px]"
          style={{
            transform: 'translateZ(0)',
            boxShadow:
              '0 50px 100px -30px rgba(90,46,30,0.5), 0 24px 48px -24px rgba(90,46,30,0.4), 0 0 0 1.5px rgba(255,255,255,0.22), inset 0 0 6px rgba(255,255,255,0.12)',
          }}
        >
          {/*
           * Screen: fixed-height flex column — status bar (shrink-0),
           * app host (flex-1, the only region that scrolls internally),
           * home indicator overlaid at the bottom.
           */}
          <div className="phone-screen relative flex h-full w-full flex-col overflow-hidden rounded-[43px] bg-cream dark:bg-espresso">
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2.5 z-30 flex h-7 w-28 -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
            </div>

            {/*
             * Fake status bar: an in-flow flex row with a solid background,
             * so scrolled content can never show through behind the time
             * and icons.
             */}
            <div className="relative z-20 flex h-14 shrink-0 items-center justify-between bg-cream px-8 text-[15px] font-bold text-charcoal dark:bg-espresso dark:text-parchment">
              <span className="w-14 tabular-nums">{time}</span>
              <span className="flex items-center gap-1.5" aria-hidden>
                {/* Signal */}
                <svg width="18" height="12" viewBox="0 0 17 11" fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="0.8" />
                  <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
                  <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
                  <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
                </svg>
                {/* Wifi */}
                <svg width="16" height="12" viewBox="0 0 15 11" fill="currentColor">
                  <path d="M7.5 9.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
                  <path d="M7.5 5.6c1.5 0 2.9.6 3.9 1.6l-1.3 1.3a3.7 3.7 0 0 0-5.2 0L3.6 7.2a5.5 5.5 0 0 1 3.9-1.6z" />
                  <path d="M7.5 2c2.5 0 4.8 1 6.5 2.7l-1.3 1.3A7.4 7.4 0 0 0 7.5 3.8c-2 0-3.9.8-5.2 2.2L1 4.7A9.2 9.2 0 0 1 7.5 2z" />
                </svg>
                {/* Battery */}
                <svg width="27" height="13" viewBox="0 0 25 12" fill="none">
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.5" />
                  <rect x="2" y="2" width="15" height="8" rx="1.8" fill="currentColor" />
                  <path d="M23 4v4c1-.3 1.6-1 1.6-2S24 4.3 23 4z" fill="currentColor" opacity="0.5" />
                </svg>
              </span>
            </div>

            {/*
             * App host: fills the screen below the status bar. Deliberately
             * NOT position:relative, so absolute overlays inside the app
             * (modals, toasts, the floating "+") anchor to the phone screen
             * itself and can cover it edge to edge.
             */}
            <div className="phone-content flex min-h-0 flex-1 flex-col">
              {children}
            </div>

            {/* Home indicator */}
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-30 h-1 w-36 -translate-x-1/2 rounded-full bg-charcoal/80 dark:bg-parchment/70" />
          </div>
        </div>
      </div>
    </div>
  )
}
