export function debounce(fn: (...args: any[]) => void, delay: number) {
  let timeoutID: NodeJS.Timeout | null = null
  return function (...args: any[]) {
    if (timeoutID)
      clearTimeout(timeoutID)

    timeoutID = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function getRatio(width: number, height: number) {
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const r = gcd(width, height)
  return `${width / r}:${height / r}`
}
