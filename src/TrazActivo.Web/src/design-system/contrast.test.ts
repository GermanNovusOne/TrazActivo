import { describe, expect, it } from 'vitest'

const surface = '#FFFFFF'
const textColors = [
  '#17324D',
  '#202A33',
  '#66727D',
  '#19766F',
  '#327DA8',
  '#287A59',
  '#B42318',
  '#25689B',
]

describe('Design System contrast', () => {
  it.each(textColors)('%s alcanza contraste AA para texto normal sobre surface', (foreground) => {
    expect(contrastRatio(foreground, surface)).toBeGreaterThanOrEqual(4.5)
  })
})

function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)
  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color: ${hex}`)
  }

  const [red, green, blue] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)
}