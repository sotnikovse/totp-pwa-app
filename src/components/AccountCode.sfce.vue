<template>
  <div role="button">
    <span></span>
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
        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
      />
    </svg>
  </div>
</template>

<script lang="ts">
import {
  DEFAULT_PERIOD,
  DEFAULT_DIGITS,
  DEFAULT_TOTP_ALGORITHM,
} from '../constants'
import { timerWorker } from '../main'
import { getAccount } from '../data/db'
import init, { totp } from '../../wasm/pkg/totp_wasm'

class AccountCode extends HTMLElement {
  private period = DEFAULT_PERIOD
  private onTimerWorkerMessageHandler: (e: MessageEvent) => void | undefined

  static observedAttributes = ['period']

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'account-code-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))

    this.onTimerWorkerMessageHandler = this.onTimerWorkerMessage.bind(this)
  }

  private onTimerWorkerMessage(e: MessageEvent) {
    if (e.data.type === 'period' && e.data.message.includes(this.period)) {
      this.setCode()
    }
  }

  private setPeriod(val: string | number | null) {
    this.period = Number.parseInt(val as string) || DEFAULT_PERIOD
    timerWorker.postMessage({ type: 'period', message: this.period })
  }

  private async setCode() {
    const accountId = this.getAttribute('account-id') as string
    const item = await getAccount(accountId)
    if (item) {
      try {
        const code = totp(
          item.secret,
          BigInt(this.period),
          item.digits || DEFAULT_DIGITS,
          item.algorithm || DEFAULT_TOTP_ALGORITHM,
        )
        const element = this.shadowRoot?.querySelector<HTMLElement>(
          '[role="button"] > span',
        )
        if (element) {
          element.innerText = code || '-'
        }
      } catch (error) {
        throw error
      }
    }
  }

  async connectedCallback() {
    await init()

    const codeElement = this.shadowRoot?.querySelector<HTMLElement>('span')

    this.shadowRoot
      ?.querySelector('[role="button"]')
      ?.addEventListener('click', (e) => {
        e.stopPropagation()
        const text = codeElement?.innerText
        if (text) {
          navigator.clipboard.writeText(text)
          console.log('Скопировано!', codeElement.innerText)
        }
      })

    this.setPeriod(this.getAttribute('period'))
    this.setCode()

    timerWorker.addEventListener('message', this.onTimerWorkerMessageHandler)
  }

  disconnectedCallback() {
    timerWorker.removeEventListener('message', this.onTimerWorkerMessageHandler)
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    switch (name) {
      case 'period':
        this.setPeriod(newValue)
        break
    }
  }
}

export default AccountCode

declare global {
  interface HTMLElementTagNameMap {
    'account-code': AccountCode
  }
}
</script>

<style>
:host {
  position: relative;
  display: flex;
  align-items: center;
}
[role='button'] {
  font-size: 1.875rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  border-radius: 0.5rem;
  background-color: rgb(var(--colors-gray-light) / 0.15);
}
[role='button']:hover {
  background-color: rgb(var(--colors-gray-light) / 0.3);
}
@media (prefers-color-scheme: dark) {
  [role='button'] {
    background-color: rgb(var(--colors-gray-dark) / 0.15);
  }
  [role='button']:hover {
    background-color: rgb(var(--colors-gray-dark) / 0.3);
  }
}
:host([card]) [role='button'] {
  font-size: 1.25rem;
  padding: 0;
  border-radius: 0;
  background-color: transparent;
}
[role='button'] svg {
  width: 0.8em;
  height: 0.8em;
  color: rgb(var(--colors-gray));
}
[role='button']:hover svg {
  color: rgb(var(--colors-text));
}
</style>
