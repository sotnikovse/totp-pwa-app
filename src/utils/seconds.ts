import { DEFAULT_PERIOD } from '../constants'

/**
 * миллисекунды в секунды
 *
 * @param {number} ms - миллисекунды
 * @returns {number} - секунды
 */
export function secondsFromMs(ms: number) {
  return Math.floor(ms / 1000)
}

/**
 * секунды в рамках указанного периода
 *
 * @param {number} seconds - секунды
 * @param {number} period - период в секундах
 * @returns {number} - секунды
 */
export function periodSeconds(seconds: number, period = DEFAULT_PERIOD) {
  return period - (seconds % period)
}
