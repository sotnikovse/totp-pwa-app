// расшаренный таймера
import { DEFAULT_PERIOD } from './constants'
import { secondsFromMs } from './utils/seconds'

// периоды могут расширяться
const periods = [DEFAULT_PERIOD]

postSeconds(secondsFromMs(Date.now()))

// тик таймера
setInterval(() => {
  postSeconds(secondsFromMs(Date.now()))
}, 1000)

// отправка тика таймера и полные периоды
function postSeconds(timestamp: number) {
  self.postMessage({
    type: 'tick',
    message: timestamp,
  })
  const fullPeriods = periods.reduce<number[]>((acc, period) => {
    if (timestamp % period === 0) {
      acc.push(period)
    }
    return acc
  }, [])
  if (fullPeriods.length) {
    self.postMessage({
      type: 'period',
      message: fullPeriods,
    })
  }
}

self.onmessage = (e) => {
  switch (e.data.type) {
    // расширение периодов
    case 'period':
      const period = e.data.message
      if (period && Number.isInteger(period) && !periods.includes(period)) {
        periods.push(period)
      }
      break
  }
}
