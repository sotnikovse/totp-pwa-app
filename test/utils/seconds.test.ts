import { describe, expect, test } from 'vitest'
import { secondsFromMs, periodSeconds } from '../../src/utils/seconds'

describe('utils/seconds.ts', () => {
  describe('secondsFromMs', () => {
    test('Должно вернуть секунды', () => {
      expect(secondsFromMs(new Date(2025, 1, 1).getTime())).toBe(1738335600)
    })
  })

  describe('periodSeconds', () => {
    test('Должно вернуть секунды периода', () => {
      expect(periodSeconds(1738335600)).toBe(30)
      expect(periodSeconds(1738335601)).toBe(29)
      expect(periodSeconds(1738335629)).toBe(1)
      expect(periodSeconds(1738335630)).toBe(30)

      expect(periodSeconds(1738335600, 60)).toBe(60)
      expect(periodSeconds(1738335601, 60)).toBe(59)
      expect(periodSeconds(1738335659, 60)).toBe(1)
      expect(periodSeconds(1738335660, 60)).toBe(60)
    })
  })
})
