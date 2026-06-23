export const OPEN_CASTAWAY_EVENT = 'idol-null:open-castaway'

export function requestOpenCastaway(castawayId: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_CASTAWAY_EVENT, { detail: { castawayId } }))
}
