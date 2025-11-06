export const DEFAULT_PERIOD = 30
export const DEFAULT_DIGITS = 6

export const TotpAlgorithmEnum = Object.freeze({
  SHA1: 'SHA1',
  SHA256: 'SHA256',
  SHA512: 'SHA512',
})

export const DEFAULT_TOTP_ALGORITHM = TotpAlgorithmEnum.SHA1
