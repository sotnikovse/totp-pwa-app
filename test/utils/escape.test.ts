import { describe, expect, test } from 'vitest'
import { escapeHTML } from '../../src/utils/escape'

describe('utils/escape.ts', () => {
  describe('sanitizeInput', () => {
    test('Должно экранировать строку', () => {
      expect(escapeHTML('<script>alert("x")</script>')).toBe(
        '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
      )

      expect(escapeHTML(`"'&<>`)).toBe('&quot;&#39;&amp;&lt;&gt;')

      expect(escapeHTML(null)).toBe('null')

      expect(escapeHTML(undefined)).toBe('undefined')
    })
  })
})
