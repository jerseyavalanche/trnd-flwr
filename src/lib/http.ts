export type ApiErrorDetails = {
  endpoint: string
  status: number
  statusText: string
  bodyText: string
  bodyPreview: string
  isEmpty: boolean
  isHtml: boolean
}

export class ApiRequestError extends Error {
  readonly endpoint: string
  readonly status: number
  readonly statusText: string
  readonly bodyText: string
  readonly bodyPreview: string
  readonly isEmpty: boolean
  readonly isHtml: boolean

  constructor(details: ApiErrorDetails) {
    const summary = details.isEmpty
      ? `${details.endpoint} returned an empty body (HTTP ${details.status})`
      : details.isHtml
        ? `${details.endpoint} returned HTML instead of JSON. Is the API server running on port 4000?`
        : `${details.endpoint} returned invalid JSON (HTTP ${details.status})`
    super(summary)
    this.name = 'ApiRequestError'
    this.endpoint = details.endpoint
    this.status = details.status
    this.statusText = details.statusText
    this.bodyText = details.bodyText
    this.bodyPreview = details.bodyPreview
    this.isEmpty = details.isEmpty
    this.isHtml = details.isHtml
  }
}

const previewBody = (bodyText: string, maxLength = 160) => {
  const trimmed = bodyText.trim()
  if (!trimmed) return ''
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed
}

const looksLikeHtml = (bodyText: string, contentType: string | null) => {
  if (contentType?.includes('text/html')) return true
  const trimmed = bodyText.trimStart().toLowerCase()
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')
}

export const readResponseBody = async (response: Response, endpoint: string) => {
  const bodyText = await response.text()
  const isEmpty = bodyText.trim().length === 0
  const isHtml = looksLikeHtml(bodyText, response.headers.get('content-type'))

  if (!response.ok) {
    throw new ApiRequestError({
      endpoint,
      status: response.status,
      statusText: response.statusText,
      bodyText,
      bodyPreview: previewBody(bodyText),
      isEmpty,
      isHtml,
    })
  }

  if (isEmpty) {
    return null
  }

  if (isHtml) {
    throw new ApiRequestError({
      endpoint,
      status: response.status,
      statusText: response.statusText,
      bodyText,
      bodyPreview: previewBody(bodyText),
      isEmpty,
      isHtml,
    })
  }

  try {
    return JSON.parse(bodyText) as unknown
  } catch {
    throw new ApiRequestError({
      endpoint,
      status: response.status,
      statusText: response.statusText,
      bodyText,
      bodyPreview: previewBody(bodyText),
      isEmpty: false,
      isHtml: false,
    })
  }
}
