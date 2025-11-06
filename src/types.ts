import { TotpAlgorithmEnum } from './constants'

export type TotpAlgorithm = keyof typeof TotpAlgorithmEnum

export interface TOTP {
  type: 'totp'
  label: string
  secret: string
  issuer?: string
  algorithm?: TotpAlgorithm
  digits?: number
  period?: number
}

export type Account = TOTP & { id: number; created?: number }
export type AccountCreateRequest = Omit<Account, 'id'>
