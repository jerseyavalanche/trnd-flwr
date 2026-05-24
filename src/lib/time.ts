export const formatRelativeTime = (isoDate?: string) => {
  if (!isoDate) return 'never'

  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return 'unknown'

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 60) return `${diffSeconds}s ago`

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export const formatClock = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)

export const formatObservatoryTime = (date: Date) => {
  const iso = date.toISOString().replace('T', ' ').slice(0, 19)
  return `${iso}Z`
}

export const formatPublishedAge = (isoDate: string) => {
  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return 'unknown'

  const diffHours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000))
  if (diffHours < 24) return `pub ${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `pub ${diffDays}d ago`
}
