import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  )
}
