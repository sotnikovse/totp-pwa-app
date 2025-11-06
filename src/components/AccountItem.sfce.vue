<template>
  <slot name="title"></slot>
  <section part="section">
    <div>
      <account-code></account-code>
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
import AccountList from './AccountList.sfce.vue'
import { getAccount } from '../data/db'
import { createTotpauthURI } from '../utils/otpauth'
import { escapeHTML } from '../utils/escape'

class AccountItem extends HTMLElement {
  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'account-item-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))
  }

  static get observedAttributes() {
    return ['account-id', 'period']
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
        this.shadowRoot
          ?.querySelector<HTMLElement>('account-code')
          ?.setAttribute('period', String(newValue || DEFAULT_PERIOD))
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
</style>
