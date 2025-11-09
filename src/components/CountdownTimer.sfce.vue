<template>
  <div>
    <svg
      part="svg"
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
    >
      <circle
        r="20"
        cx="24"
        cy="24"
        fill="none"
        stroke="currentColor"
        stroke-width="2px"
      ></circle>
    </svg>
    <span part="value"></span>
  </div>
</template>

<script lang="ts">
import { DEFAULT_PERIOD } from '../constants'
import { timerWorker } from '../main'
import { secondsFromMs, periodSeconds } from '../utils/seconds'

class CountdownTimer extends HTMLElement {
  private period = DEFAULT_PERIOD
  private onTimerWorkerMessageHandler: (e: MessageEvent) => void | undefined

  static observedAttributes = ['period']

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'countdown-timer-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))

    this.onTimerWorkerMessageHandler = this.onTimerWorkerMessage.bind(this)
  }

  private onTimerWorkerMessage(e: MessageEvent) {
    if (e.data.type === 'tick') {
      const seconds = periodSeconds(e.data.message, this.period)
      this.setValue(seconds)
    }
  }

  private setPeriod(val: string | number | null) {
    this.period = Number.parseInt(val as string) || DEFAULT_PERIOD
  }

  private getColors(value: number) {
    return `hsl(${value * 120},100%,40%)`
  }

  private setValue(seconds?: number | null) {
    const rootElement =
      this.shadowRoot?.querySelector<HTMLElement>('div:first-of-type')
    const valueElement = rootElement?.querySelector(
      '[part="value"]',
    ) as HTMLElement
    if (seconds) {
      rootElement?.style.setProperty(
        'color',
        this.getColors(seconds / this.period),
      )
      valueElement.innerText = String(seconds)
    } else {
      rootElement?.style.removeProperty('color')
      valueElement.innerText = ''
    }
  }

  connectedCallback() {
    this.setPeriod(this.getAttribute('period'))
    const seconds = periodSeconds(secondsFromMs(Date.now()), this.period)
    this.setValue(seconds)

    timerWorker.addEventListener('message', this.onTimerWorkerMessageHandler)
  }

  disconnectedCallback() {
    timerWorker.removeEventListener('message', this.onTimerWorkerMessageHandler)
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | number | null,
    newValue: string | number | null,
  ) {
    switch (name) {
      case 'period':
        this.setPeriod(newValue)
        break
    }
  }
}

export default CountdownTimer

declare global {
  interface HTMLElementTagNameMap {
    'countdown-timer': CountdownTimer
  }
}
</script>

<style>
:host {
  width: 3rem;
  height: 3rem;
  position: relative;
}
:host > div:first-of-type {
  color: rgb(var(--colors-gray-light) / 0.5);
  transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-color-scheme: dark) {
  :host > div:first-of-type {
    color: rgb(var(--colors-gray-dark) / 0.5);
  }
}
[part='svg'] {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
  display: block;
}
[part='value'] {
  color: currentColor;
  font-size: 1rem;
  font-weight: 700;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
