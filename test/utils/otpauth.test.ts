import { describe, expect, test } from 'vitest'
import type { TOTP } from '../../src/types'
import {
  DEFAULT_PERIOD,
  DEFAULT_DIGITS,
  DEFAULT_TOTP_ALGORITHM,
  TotpAlgorithmEnum,
} from '../../src/constants'
import {
  parseTotpauthURI,
  createTotpauthURI,
  safeParseAlgorithm,
  safeParseInteger,
} from '../../src/utils/otpauth'

describe('utils/otpauth.ts', () => {
  describe('parseTotpauthURI', () => {
    test('Должно парсить URI', () => {
      expect(
        parseTotpauthURI(
          'otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60',
        ),
      ).toStrictEqual({
        type: 'totp',
        label: 'john.doe@email.com',
        issuer: 'ACME Co',
        secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
        algorithm: TotpAlgorithmEnum.SHA256,
        digits: 8,
        period: 60,
      } as TOTP)

      expect(
        parseTotpauthURI(
          'otpauth://totp/Example:Label?secret=JBSWY3DPEHPK3PXP&issuer=Example',
        ),
      ).toStrictEqual({
        type: 'totp',
        label: 'Label',
        issuer: 'Example',
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: DEFAULT_TOTP_ALGORITHM,
        digits: DEFAULT_DIGITS,
        period: DEFAULT_PERIOD,
      } as TOTP)

      expect(
        parseTotpauthURI('otpauth://totp/Label?secret=JBSWY3DPEHPK3PXP'),
      ).toStrictEqual({
        type: 'totp',
        label: 'Label',
        issuer: undefined,
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: DEFAULT_TOTP_ALGORITHM,
        digits: DEFAULT_DIGITS,
        period: DEFAULT_PERIOD,
      } as TOTP)
    })

    test('Должна быть ошибка "Невалидный URI"', () => {
      expect(() => parseTotpauthURI('http://totp/Example')).toThrow(
        'Невалидный URI',
      )

      expect(() => parseTotpauthURI('otpauth://hotp/Example')).toThrow(
        'Невалидный URI',
      )

      expect(() => parseTotpauthURI('otpauth://totp/')).toThrow(
        'Невалидный URI, отсутствует параметр `label`',
      )

      expect(() => parseTotpauthURI('otpauth://totp/Example')).toThrow(
        'Невалидный URI, отсутствует параметр `secret`',
      )

      expect(() => parseTotpauthURI('otpauth://totp/Example?secret=')).toThrow(
        'Невалидный URI, отсутствует параметр `secret`',
      )

      expect(() =>
        parseTotpauthURI(
          'otpauth://totp/Example:Label?secret=JBSWY3DPEHPK3PXP&issuer=Provider',
        ),
      ).toThrow('Невалидный URI, отсутствует параметр `issuer` не совпадают')
    })
  })

  describe('createTotpauthURI', () => {
    test('Должно создать URI', () => {
      expect(
        createTotpauthURI({
          type: 'totp',
          label: 'john.doe@email.com',
          issuer: 'ACME Co',
          secret: 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ',
          algorithm: TotpAlgorithmEnum.SHA256,
          digits: 8,
          period: 60,
        }),
      ).toBe(
        'otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60',
      )

      expect(
        createTotpauthURI({
          type: 'totp',
          label: 'Label',
          issuer: 'Example',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      ).toBe(
        'otpauth://totp/Example:Label?secret=JBSWY3DPEHPK3PXP&issuer=Example',
      )

      expect(
        createTotpauthURI({
          type: 'totp',
          label: 'Label',
          secret: 'JBSWY3DPEHPK3PXP',
        }),
      ).toBe('otpauth://totp/Label?secret=JBSWY3DPEHPK3PXP')

      expect(
        // @ts-expect-error check empty data
        createTotpauthURI({}),
      ).toBe('otpauth://totp/undefined?')
    })
  })

  describe('safeParseAlgorithm', () => {
    test('Должно вернуть корректный алгоритм', () => {
      expect(safeParseAlgorithm('SHA1')).toBe('SHA1')

      expect(safeParseAlgorithm('SHA256')).toBe('SHA256')

      expect(safeParseAlgorithm('SHA512')).toBe('SHA512')
    })

    test('Должно вернуть значение по умолчанию', () => {
      expect(safeParseAlgorithm('SHA')).toBe('SHA1')

      expect(safeParseAlgorithm('')).toBe('SHA1')

      expect(safeParseAlgorithm(null)).toBe('SHA1')

      expect(safeParseAlgorithm(undefined)).toBe('SHA1')
    })
  })

  describe('safeParseInteger', () => {
    test('Должно вернуть число', () => {
      expect(safeParseInteger('1')).toBe(1)

      expect(safeParseInteger('0')).toBe(0)
    })

    test('Должно вернуть значение по умолчанию', () => {
      for (const defaultValue of [undefined, 30, 60]) {
        const expectValue = defaultValue === undefined ? 0 : defaultValue

        expect(safeParseInteger('a', defaultValue)).toBe(expectValue)

        expect(safeParseInteger('', defaultValue)).toBe(expectValue)

        expect(safeParseInteger(null, defaultValue)).toBe(expectValue)

        expect(safeParseInteger(undefined, defaultValue)).toBe(expectValue)
      }
    })
  })
})
