<template>
  <div>
    <div>
      <account-code card></account-code>
    </div>
    <label>
      <slot name="label"></slot>
    </label>
  </div>
  <button
    type="button"
    part="button button-flat button-icon button-delete"
    aria-label="Удалить"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  </button>
  <div class="progress">
    <div class="progress__track"></div>
    <div class="progress__indicator"></div>
  </div>
</template>

<script lang="ts">
import { DEFAULT_PERIOD } from '../constants'
import { timerWorker } from '../main'
import { escapeHTML } from '../utils/escape'
import { periodSeconds } from '../utils/seconds'
import type { Account } from '../types'
import AccountList from './AccountList.sfce.vue'
import AppToaster from './AppToaster.sfce.vue'

class AccountCard extends HTMLElement {
  private period = DEFAULT_PERIOD
  private animationId: number | null = null
  private errorMessage = ''
  private onTimerWorkerMessageHandler: (e: MessageEvent) => void | undefined

  static observedAttributes = ['label', 'period']

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'account-card-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))

    this.onTimerWorkerMessageHandler = this.onTimerWorkerMessage.bind(this)
  }

  private setError(message: string) {
    this.errorMessage = message
    this.classList.add('error')
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  private startAnimation() {
    let indicatorElemenet = this.shadowRoot?.querySelector<HTMLElement>(
      '.progress__indicator',
    )
    if (!indicatorElemenet || this.errorMessage) {
      return
    }

    const periodMs = this.period * 1000
    const duration = periodSeconds(Date.now(), periodMs)

    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    let startTimestamp: number = 0
    indicatorElemenet.style.width = '100%'

    const animate = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp
      }
      const elapsed = timestamp - startTimestamp
      const percent = Math.max(
        0,
        Math.min(100, (100 * (duration - elapsed)) / duration),
      )
      if (percent > 0) {
        indicatorElemenet.style.width = `${percent}%`
        this.animationId = requestAnimationFrame(animate)
      }
    }
    this.animationId = requestAnimationFrame(animate)
  }

  private onTimerWorkerMessage(e: MessageEvent) {
    if (e.data.type === 'period' && e.data.message.includes(this.period)) {
      this.startAnimation()
    }
  }

  private setLabel(label: string) {
    const element = this.shadowRoot?.querySelector('label')
    const issuer = this.getAttribute('issuer')
    if (element) {
      const escapedLabel = escapeHTML(label)
      element.innerHTML = issuer
        ? `${escapedLabel} <small>(${escapeHTML(issuer)})</small>`
        : escapedLabel
    }
  }

  connectedCallback() {
    this.startAnimation()

    const accountId = this.getAttribute('account-id') as string

    this.shadowRoot
      ?.querySelector('account-code')
      ?.setAttribute('account-id', accountId)

    this.shadowRoot
      ?.querySelector('button')
      ?.addEventListener('click', async (e) => {
        e.stopPropagation()
        const result = confirm('Вы уверены что хотите удалить?')
        if (result) {
          try {
            await AccountList.deleteItem(accountId)
            AppToaster.showToast('Аккаунт удален', 'info')
          } catch (error) {
            AppToaster.showToast(
              `Не удалось удалить аккаунт.\n${(error as Error).message}`,
              'error',
            )
          }
        }
      })

    this.shadowRoot?.addEventListener('click', () => {
      location.assign(`#${accountId}`)
    })

    this.shadowRoot
      ?.querySelector('account-code')
      ?.addEventListener('error', (e) => {
        this.setError(e.message)
      })

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
      case 'label':
        if (newValue) {
          this.setLabel(newValue as string)
        }
        break
      case 'period':
        this.period = Number.parseInt(newValue as string) || DEFAULT_PERIOD
        this.shadowRoot
          ?.querySelector('account-code')
          ?.setAttribute('period', String(this.period))
        break
    }
  }

  static createElement(item: Account) {
    const element = document.createElement('account-card')
    element.setAttribute('account-id', String(item.id))
    if (item.issuer) {
      element.setAttribute('issuer', item.issuer)
    }
    if (item.period) {
      element.setAttribute('period', String(item.period))
    }
    element.setAttribute('label', item.label)
    return element
  }
}

export default AccountCard

declare global {
  interface HTMLElementTagNameMap {
    'account-card': AccountCard
  }
}
</script>

<style>
:host {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 0.5rem;
  padding: 1rem;
  padding-top: 0.75rem;
  padding-right: 0.5rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.progress {
  position: absolute;
  width: 100%;
  height: 0.5rem;
  bottom: 0;
  left: 0;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  overflow: hidden;
}
.progress__track {
  background-color: rgb(var(--colors-gray-light) / 0.5);
  position: absolute;
  width: 100%;
  height: 0.1875rem;
  bottom: 0;
  left: 0;
}
.progress__indicator {
  background-color: rgb(var(--colors-gray-light));
  position: absolute;
  width: 100%;
  height: 0.1875rem;
  bottom: 0;
  left: 0;
}
:host(.error) .progress__indicator {
  background-color: rgb(var(--colors-red) / 0.5);
}

:host > div:first-of-type {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
label {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
label > small {
  color: rgb(var(--colors-gray-dark));
}

button[aria-label='Удалить'] > svg {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
}
button[aria-label='Удалить'] {
  color: rgb(var(--colors-gray)) !important;
}
@media (hover: hover) {
  button[aria-label='Удалить']:hover {
    color: rgb(var(--colors-red)) !important;
  }
}

@media (prefers-color-scheme: dark) {
  :host {
    box-shadow: none;
    background-color: rgb(var(--colors-gray-dark) / 0.25);
  }
  label > small {
    color: rgb(var(--colors-gray-light));
  }

  .progress__track {
    background-color: rgb(var(--colors-gray-dark) / 0.5);
  }
  .progress__indicator {
    background-color: rgb(var(--colors-gray-dark));
  }
}
</style>
