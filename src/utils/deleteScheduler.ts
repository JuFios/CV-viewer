type FinalizeCallback = () => void

let timeoutId: ReturnType<typeof setTimeout> | null = null

export function scheduleFinalize(
  callback: FinalizeCallback,
  delayMs = 5000
): void {
  cancelFinalize()
  timeoutId = setTimeout(() => {
    timeoutId = null
    callback()
  }, delayMs)
}

export function cancelFinalize(): void {
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

export function resetDeleteSchedulerForTests(): void {
  cancelFinalize()
}
