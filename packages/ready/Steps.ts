import { validateAccessibleText } from './accessible-text'

export interface StepsItem {
  /** Unique stable identifier; the current step is a zero-based position in the list. */
  id: string
  label: string
  description?: string
}

export interface StepsProps {
  label: string
  items: readonly StepsItem[]
  /** The current index; items.length represents completion. */
  step?: number
  defaultStep?: number
  previousLabel?: string
  nextLabel?: string
  finishLabel?: string
  completedLabel?: string
  onStepChange?: (step: number) => void
}

export function prepareSteps({ items, label, previousLabel = 'Previous', nextLabel = 'Next', finishLabel = 'Finish', completedLabel = 'Completed' }: StepsProps) {
  if (!Array.isArray(items) || items.length === 0) throw new RangeError('Ready Steps: items must be nonempty.')
  const ids = new Set<string>()
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id))
      throw new Error('Ready Steps: item IDs must be nonempty and unique.')
    ids.add(item.id)
    validateAccessibleText(item.label, 'Steps', 'item label')
  }
  for (const [prop, text] of Object.entries({ label, previousLabel, nextLabel, finishLabel, completedLabel }))
    validateAccessibleText(text, 'Steps', prop)
  return { label, items, previousLabel, nextLabel, finishLabel, completedLabel }
}

export function validateStepsIndex(step: number, count: number, prop: 'step' | 'defaultStep') {
  if (!Number.isInteger(step) || step < 0 || step > count)
    throw new RangeError(`Ready Steps: ${prop} must be an integer from 0 to ${count}.`)
  return step
}
