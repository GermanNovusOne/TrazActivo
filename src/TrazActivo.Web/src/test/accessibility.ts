import axe from 'axe-core'
import { expect } from 'vitest'

export async function expectNoAxeViolations(container: Element) {
  // jsdom has no canvas; token contrast is covered by a dedicated numeric regression.
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(result.violations, formatViolations(result.violations)).toEqual([])
}

function formatViolations(violations: axe.Result[]) {
  return violations
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
    .join('\n')
}
