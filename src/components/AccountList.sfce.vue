<script lang="ts">
import { getAccounts, addAccount, deleteAccount } from '../data/db'
import { compressText, downloadFile } from '../utils/compress'
import { createTotpauthURI } from '../utils/otpauth'
import type { AccountCreateRequest } from '../types'
import AccountCard from './AccountCard.sfce.vue'
import AppToaster from './AppToaster.sfce.vue'

class AccountList extends HTMLElement {
  constructor() {
    super()
  }

  async connectedCallback() {
    const items = await getAccounts()
    // удаляется атрибут индикации загрузки, который установлен в шаблоне html
    this.removeAttribute('loading')

    const sectionElement = document.querySelector('account-list section')
    if (sectionElement) {
      for (const item of items) {
        const itemElement = AccountCard.createElement(item)
        sectionElement.appendChild(itemElement)
      }
    }

    document
      .getElementById('account-list-export-button')
      ?.addEventListener('click', async () => {
        const items = await getAccounts()
        if (items.length > 0) {
          try {
            const lines: string[] = []
            for (const item of items) {
              const uri = createTotpauthURI(item)
              lines.push(uri)
            }
            const compressedData = await compressText(lines.join('\n'))
            const filename = new Date().toISOString().slice(0, 10)
            downloadFile(filename, compressedData)
          } catch (error) {
            AppToaster.showToast(
              `Не удалось сохранить список.\n${(error as Error).message}`,
              'error',
            )
            throw error
          }
        } else {
          AppToaster.showToast('Список пуст', 'info')
        }
      })
  }

  static async addItem(data: AccountCreateRequest, redirect = false) {
    const item = await addAccount(data)
    const itemElement = AccountCard.createElement(item)
    document.querySelector('account-list section')?.prepend(itemElement)
    if (redirect) {
      location.replace(`#${item.id}`)
    }
    return item
  }

  static async deleteItem(id: string | number) {
    await deleteAccount(id)
    document.querySelector(`account-list [account-id="${id}"]`)?.remove()
  }
}

export default AccountList

declare global {
  interface HTMLElementTagNameMap {
    'account-list': AccountList
  }
}
</script>
