<template>
  <slot name="title"></slot>
  <section part="section">
    <div class="code-container">
      <account-code></account-code>
      <countdown-timer></countdown-timer>
    </div>
    <dl></dl>
    <div>
      <button type="button" class="copy-link-button" part="button">
        Скопировать ссылку
      </button>
      <button type="button" class="delete-button" part="button button-delete">
        Удалить
      </button>
    </div>
  </section>
</template>

<script lang="ts">
import { DEFAULT_PERIOD } from '../constants'
import { getAccount } from '../data/db'
import { escapeHTML } from '../utils/escape'
import { createTotpauthURI } from '../utils/otpauth'
import AccountList from './AccountList.sfce.vue'

class AccountItem extends HTMLElement {
  private period = DEFAULT_PERIOD

  static observedAttributes = ['account-id', 'period']

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'account-item-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))
  }

  private setPeriod(val: string | number | null) {
    this.period = Number.parseInt(val as string) || DEFAULT_PERIOD
    this.shadowRoot
      ?.querySelector('account-code')
      ?.setAttribute('period', String(this.period))
    this.shadowRoot
      ?.querySelector('countdown-timer')
      ?.setAttribute('period', String(this.period))
  }

  private async updateDescription(accountId: string) {
    const listElement = this.shadowRoot?.querySelector<HTMLDListElement>('dl')
    const data = await getAccount(accountId)
    if (listElement && data) {
      let html = ''
      html += this.createDescriptionInner('ИД', data.id.toString())
      html += this.createDescriptionInner('Название', data.label)
      if (data.issuer) {
        html += this.createDescriptionInner('Сервис', data.issuer)
      }
      if (data.algorithm) {
        html += this.createDescriptionInner('Алгоритм', data.algorithm)
      }
      if (data.period) {
        html += this.createDescriptionInner(
          'Период (секунды)',
          data.period.toString(),
        )
      }
      if (data.digits) {
        html += this.createDescriptionInner(
          'Длина кода',
          data.digits.toString(),
        )
      }

      if (data.created) {
        html += this.createDescriptionInner(
          'Создан',
          new Date(data.created).toLocaleDateString('ru-RU'),
        )
      }
      listElement.innerHTML = html
    }
  }

  private createDescriptionInner(label: string, value: string) {
    return `<dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd>`
  }

  connectedCallback() {
    this.shadowRoot
      ?.querySelector('.delete-button')
      ?.addEventListener('click', async () => {
        const accountId = this.getAttribute('account-id') as string
        const result = confirm('Вы уверены что хотите удалить?')
        if (result) {
          await AccountList.deleteItem(accountId)
          history.length > 2 ? history.back() : location.replace('/')
        }
      })

    this.shadowRoot
      ?.querySelector('.copy-link-button')
      ?.addEventListener('click', async () => {
        const accountId = this.getAttribute('account-id') as string
        const data = await getAccount(accountId)
        if (data) {
          const uri = createTotpauthURI(data)
          navigator.clipboard.writeText(uri)
          console.log('Скопировано!', uri)
        }
      })

    this.setPeriod(this.getAttribute('period'))
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | number | null,
    newValue: string | number | null,
  ) {
    switch (name) {
      case 'account-id':
        if (newValue) {
          this.updateDescription(newValue as string)
          this.shadowRoot
            ?.querySelector<HTMLElement>('account-code')
            ?.setAttribute('account-id', newValue as string)
        }
        break
      case 'period':
        this.setPeriod(newValue)
        break
    }
  }
}

export default AccountItem

declare global {
  interface HTMLElementTagNameMap {
    'account-item': AccountItem
  }
}
</script>

<style>
.code-container {
  display: flex;
  align-items: center;
  column-gap: 0.5rem;
}

.delete-button {
  margin-left: 0.5rem;
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(min-content, max-content) 1fr;
  row-gap: 0.25rem;
  font-size: 0.875rem;
}
dl > dt {
  font-weight: 500;
  grid-column-start: 1;
}
dl > dd {
  margin-left: 1rem;
  grid-column-start: 2;
}

@media (prefers-color-scheme: dark) {
  dl {
    color: rgb(var(--colors-gray-light));
  }
}
</style>
