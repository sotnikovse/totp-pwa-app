import {
  DEFAULT_PERIOD,
  DEFAULT_DIGITS,
  DEFAULT_TOTP_ALGORITHM,
  TotpAlgorithmEnum,
} from '../constants'
import type { TOTP, TotpAlgorithm } from '../types'

export function safeParseAlgorithm(value?: string | null) {
  if (!value) {
    return DEFAULT_TOTP_ALGORITHM
  }
  const algorithm = TotpAlgorithmEnum[value as TotpAlgorithm]
  return algorithm || DEFAULT_TOTP_ALGORITHM
}

export function safeParseInteger(value?: string | null, defaultValue = 0) {
  if (!value) {
    return defaultValue
  }
  return Number.isInteger(Number(value)) ? Number.parseInt(value) : defaultValue
}

/**
 * парсинг otpauth URI @see https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 *
 * @param {string} uri - URI
 * @returns {TOTP} - данные TOTP
 */
export function parseTotpauthURI(uri: string): TOTP {
  if (!uri.startsWith('otpauth://totp/')) {
    throw new Error('Невалидный URI')
  }
  const otpauthURI = new URL(uri)
  let label: string | undefined
  let issuer: string | undefined
  const pathArr = otpauthURI.pathname.slice(1).split(':')
  if (pathArr.length === 1) {
    label = decodeURIComponent(pathArr[0])
  }
  if (pathArr.length == 2) {
    const [prefixIssuer, _label] = pathArr
    issuer = decodeURIComponent(prefixIssuer)
    label = decodeURIComponent(_label)
  }
  if (!label) {
    throw new Error('Невалидный URI, отсутствует параметр `label`')
  }
  const secret = otpauthURI.searchParams.get('secret')
  if (!secret) {
    throw new Error('Невалидный URI, отсутствует параметр `secret`')
  }
  const paramIssuer = otpauthURI.searchParams.get('issuer')
  if (paramIssuer) {
    if (!issuer) {
      issuer = paramIssuer
    } else if (issuer !== paramIssuer) {
      throw new Error(
        'Невалидный URI, отсутствует параметр `issuer` не совпадают',
      )
    }
  }
  const algorithm = safeParseAlgorithm(otpauthURI.searchParams.get('algorithm'))
  const digits = safeParseInteger(
    otpauthURI.searchParams.get('digits'),
    DEFAULT_DIGITS,
  )
  const period = safeParseInteger(
    otpauthURI.searchParams.get('period'),
    DEFAULT_PERIOD,
  )
  return {
    type: 'totp',
    label,
    secret,
    issuer,
    algorithm,
    digits,
    period,
  }
}

/**
 * создание otpauth URI
 *
 * @param {TOTP} data - данные TOTP
 * @returns {string} - URI
 */
export function createTotpauthURI(data: TOTP) {
  let baseUrl = 'otpauth://totp/'
  if (data.issuer) {
    baseUrl += `${data.issuer}:${data.label}`
  } else {
    baseUrl += data.label
  }
  const url = new URL(baseUrl)
  const params = {
    secret: data.secret,
    issuer: data.issuer,
    algorithm: data.algorithm,
    digits: data.digits,
    period: data.period,
  }
  // при использовании URLSearchParams `issuer` пробел кодируется как '+'
  const searchParams = Object.entries(params).reduce<string[]>(
    (acc, [key, val]) => {
      if (val) {
        acc.push(`${key}=${encodeURIComponent(val.toString())}`)
      }
      return acc
    },
    [],
  )
  return `${url.toString()}?${searchParams.join('&')}`
}
