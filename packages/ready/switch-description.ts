export function describeField(id: string, description?: string, error?: string, inherited?: string) {
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const hasDescription = Boolean(description?.trim())
  const ids = [...new Set([inherited, hasDescription && descriptionId, error && errorId]
    .filter(Boolean).join(' ').split(/\s+/).filter(Boolean))]
  return { hasDescription, descriptionId, errorId, describedBy: ids.join(' ') || undefined }
}
