/**
 * CSS contract regression tests.
 *
 * Tailwind v4 only emits z-index/duration utilities for the correct theme
 * namespaces (--z-index-*, --transition-duration-*). The location dialog and
 * dropdown previously used classes that were silently never generated, which
 * let dashboard content paint over the modal. These checks keep the mapping in
 * place without needing a real browser.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('theme CSS contracts', () => {
  it('maps every z-index design token to the Tailwind namespace', () => {
    for (const token of [
      'dropdown',
      'sticky',
      'modal-backdrop',
      'modal',
      'popover',
      'tooltip',
      'toast',
    ]) {
      expect(css).toMatch(
        new RegExp(`--z-index-${token}:\\s*var\\(--z-${token}\\)`)
      )
    }
  })

  it('maps duration utilities used by components', () => {
    for (const token of ['instant', 'fast', 'normal', 'slow', 'slower']) {
      expect(css).toMatch(
        new RegExp(`--transition-duration-${token}:\\s*var\\(--duration-${token}\\)`)
      )
    }
  })

  it('keeps component styles in the components layer so utilities can override them', () => {
    expect(css).toContain('@layer components {')
    const start = css.indexOf('@layer components {')
    const card = css.indexOf('.card-interactive {', start)
    const tabs = css.indexOf('.tabs-trigger[data-state=', start)
    expect(card).toBeGreaterThan(start)
    expect(tabs).toBeGreaterThan(card)
  })

  it('pairs every icon-container modifier with its base class', () => {
    // The modifier classes only set size/colour. Without the base class the
    // container loses the rounded shape and icon centring.
    const srcDir = resolve(process.cwd(), 'src')
    const files = (readdirSync(srcDir, { recursive: true }) as string[]).filter(
      file => file.endsWith('.tsx')
    )
    const offenders: string[] = []

    for (const file of files) {
      const lines = readFileSync(resolve(srcDir, file), 'utf8').split('\n')
      lines.forEach((line, index) => {
        if (
          !/icon-container-(sm|md|lg|xl|2xl|brand|accent|success|warning|danger|info|muted)/.test(
            line
          )
        ) {
          return
        }
        if (line.includes('Skeleton')) return
        if (/icon-container icon-container-/.test(line)) return
        // Containers that supply their own flex layout and rounding.
        if (line.includes('items-center justify-center') && line.includes('rounded-')) return
        offenders.push(`${file}:${index + 1}`)
      })
    }

    expect(offenders).toEqual([])
  })

  it('hides the native search clear control to avoid a double icon', () => {
    expect(css).toContain("input[type='search']::-webkit-search-cancel-button")
    expect(css).toMatch(
      /input\[type='search'\]::-webkit-search-cancel-button[\s\S]{0,120}appearance:\s*none/
    )
  })

  it('has no references to retired ink/color tokens', () => {
    expect(css).not.toContain('text-ink')
    expect(css).not.toContain('var(--color-success')
    expect(css).not.toContain('var(--color-danger')
  })
})
