<template>
  <menu-button align="right">
    <button
      type="button"
      slot="button"
      part="button button-flat button-icon"
      aria-haspopup="true"
      aria-label="Меню добавления"
    >
      <svg
        part="icon"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
    </button>
    <div slot="item" id="add-menuitem">Добавить вручную</div>
    <div slot="item" id="import-menuitem">Импорт ссылки</div>
  </menu-button>

  <dialog
    id="add-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="add-dialog-label"
  >
    <form id="add-form">
      <h3 id="add-dialog-label">Добавить аккаунт</h3>
      <input
        part="input"
        id="add-form-label"
        type="text"
        name="add-form-label"
        placeholder="Название*(example@gmail.com)"
        aria-label="label input"
        autocomplete="off"
        required
        autofocus
      />
      <input
        part="input"
        id="add-form-issuer"
        type="text"
        name="add-form-issuer"
        placeholder="Сервис(Google)"
        aria-label="issuer input"
        autocomplete="off"
      />
      <input
        part="input"
        id="add-form-secret"
        type="text"
        name="add-form-secret"
        placeholder="Секрет*(JBSWY3DPEHPK3PXP)"
        aria-label="secret input"
        autocomplete="off"
        required
      />
      <input
        part="input"
        id="add-form-period"
        type="number"
        min="1"
        inputmode="numeric"
        name="add-form-period"
        placeholder="Период(30 секунд)"
        aria-label="period input"
      />
      <fieldset>
        <legend>Длина кода:</legend>
        <input
          type="radio"
          id="add-form-digits-6"
          name="add-form-digits"
          value="6"
          checked
        />
        <label for="add-form-digits-6">6</label>
        <input
          type="radio"
          id="add-form-digits-8"
          name="add-form-digits"
          value="8"
        />
        <label for="add-form-digits-8">8</label>
      </fieldset>
      <select
        part="input"
        id="add-form-algorithm"
        name="add-form-algorithm"
        aria-label="algorithm select"
      >
        <option value="" disabled>Выберите алгоритм</option>
        <option value="SHA1" selected>SHA1</option>
        <option value="SHA256">SHA256</option>
        <option value="SHA512">SHA512</option>
      </select>
      <div>
        <button
          type="button"
          part="button"
          id="add-form-cancel"
          value="cancel"
          formmethod="dialog"
        >
          Отмена
        </button>
        <button
          part="button"
          id="add-form-submit"
          value="submit"
          formmethod="dialog"
        >
          Добавить
        </button>
      </div>
    </form>
  </dialog>

  <dialog
    id="import-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="import-dialog-label"
  >
    <form id="import-form">
      <h3 id="import-dialog-label">Импорт ссылки</h3>
      <textarea
        part="input"
        id="import-form-uri"
        name="import-form-uri"
        placeholder="Введите ссылки"
        aria-label="uri input"
        rows="6"
        required
        autofocus
      ></textarea>
      <div>
        <button
          type="button"
          part="button"
          id="import-form-cancel"
          value="cancel"
          formmethod="dialog"
        >
          Отмена
        </button>
        <button
          part="button"
          id="import-form-submit"
          value="submit"
          formmethod="dialog"
        >
          Импорт
        </button>
      </div>
    </form>
  </dialog>
</template>

<script lang="ts">
import { DEFAULT_PERIOD, DEFAULT_DIGITS } from '../constants'
import {
  parseTotpauthURI,
  safeParseAlgorithm,
  safeParseInteger,
} from '../utils/otpauth'
import type { AccountCreateRequest } from '../types'
import AccountList from './AccountList.sfce.vue'
import AppToaster from './AppToaster.sfce.vue'

class AccountAddDialog extends HTMLElement {
  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'account-add-dialog-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))
  }

  private openAddDialog() {
    const addMenuItem = this.shadowRoot?.getElementById('add-menuitem') as
      | HTMLElement
      | undefined
    const addDialog = this.shadowRoot?.getElementById(
      'add-dialog',
    ) as HTMLDialogElement
    addMenuItem?.setAttribute('aria-expanded', 'true')
    addMenuItem?.setAttribute('aria-controls', 'add-dialog')
    addDialog.showModal()
  }

  private closeAddDialog() {
    const addMenuItem = this.shadowRoot?.getElementById('add-menuitem') as
      | HTMLElement
      | undefined
    addMenuItem?.removeAttribute('aria-expanded')
    addMenuItem?.removeAttribute('aria-controls')
  }

  private openImportDialog() {
    const importMenuItem = this.shadowRoot?.getElementById(
      'import-menuitem',
    ) as HTMLElement | undefined
    const importDialog = this.shadowRoot?.getElementById(
      'import-dialog',
    ) as HTMLDialogElement
    importMenuItem?.setAttribute('aria-expanded', 'true')
    importMenuItem?.setAttribute('aria-controls', 'add-dialog')
    importDialog.showModal()
  }

  private closeImportDialog() {
    const importMenuItem = this.shadowRoot?.getElementById(
      'import-menuitem',
    ) as HTMLElement | undefined
    importMenuItem?.removeAttribute('aria-expanded')
    importMenuItem?.removeAttribute('aria-controls')
  }

  connectedCallback() {
    const addMenuItem = this.shadowRoot?.getElementById('add-menuitem') as
      | HTMLElement
      | undefined
    const addDialog = this.shadowRoot?.getElementById(
      'add-dialog',
    ) as HTMLDialogElement
    const addForm = this.shadowRoot?.getElementById(
      'add-form',
    ) as HTMLFormElement
    const addFormCancelButton = this.shadowRoot?.getElementById(
      'add-form-cancel',
    ) as HTMLButtonElement

    const importMenuItem = this.shadowRoot?.getElementById(
      'import-menuitem',
    ) as HTMLElement | undefined
    const importDialog = this.shadowRoot?.getElementById(
      'import-dialog',
    ) as HTMLDialogElement
    const importForm = this.shadowRoot?.getElementById(
      'import-form',
    ) as HTMLFormElement
    const importFormCancelButton = this.shadowRoot?.getElementById(
      'import-form-cancel',
    ) as HTMLButtonElement

    addMenuItem?.addEventListener('click', () => {
      this.openAddDialog()
    })

    importMenuItem?.addEventListener('click', () => {
      this.openImportDialog()
    })

    addDialog.addEventListener('close', async () => {
      if (addDialog.returnValue === 'submit') {
        const formData = new FormData(addForm)
        const algorithm = safeParseAlgorithm(
          formData.get('add-form-algorithm') as string | null,
        )
        const digits = safeParseInteger(
          formData.get('add-form-digits') as string | null,
          DEFAULT_DIGITS,
        )
        const period = safeParseInteger(
          formData.get('add-form-period') as string | null,
          DEFAULT_PERIOD,
        )
        const data: AccountCreateRequest = {
          type: 'totp',
          label: formData.get('add-form-label') as string,
          secret: formData.get('add-form-secret') as string,
          issuer: formData.get('add-form-issuer') as string | undefined,
          algorithm,
          digits,
          period,
        }
        try {
          await AccountList.addItem(data)
        } catch (error) {
          AppToaster.showToast((error as Error).message, 'error')
          throw error
        }
        addForm.reset()
      }
      this.closeAddDialog()
    })

    importDialog.addEventListener('close', async () => {
      if (importDialog.returnValue === 'submit') {
        const formData = new FormData(importForm)
        const uriInput = formData.get('import-form-uri') as string | null
        if (uriInput) {
          const lines = uriInput
            .split('\n')
            .map((item) => item.trim())
            .filter((item) => item)
          for (const uri of lines) {
            try {
              const data = parseTotpauthURI(uri)
              await AccountList.addItem(data)
            } catch (error) {
              AppToaster.showToast((error as Error).message, 'error')
              throw error
            }
          }
          importForm.reset()
        }
      }
      this.closeImportDialog()
    })

    addFormCancelButton.addEventListener('click', (e) => {
      e.preventDefault()
      addDialog.close(addFormCancelButton.value)
    })

    importFormCancelButton.addEventListener('click', (e) => {
      e.preventDefault()
      importDialog.close(importFormCancelButton.value)
    })
  }
}

export default AccountAddDialog

declare global {
  interface HTMLElementTagNameMap {
    'account-add-dialog': AccountAddDialog
  }
}
</script>

<style>
dialog {
  min-width: 16rem;
  border-radius: 0.75rem;
  background-color: rgb(var(--colors-bg));
  box-shadow:
    0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
  border-color: transparent;
}
dialog::backdrop {
  background-color: rgb(255 255 255 / 0.75);
  backdrop-filter: blur(8px);
}
@media (min-width: 640px) {
  dialog {
    min-width: 20rem;
  }
}
@media (prefers-color-scheme: dark) {
  dialog::backdrop {
    background-color: rgb(0 0 0 / 0.75);
  }
}
dialog h3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 600;
  margin: 0;
  color: rgb(var(--colors-text));
}
form {
  display: flex;
  flex-direction: column;
}
form > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1.25rem;
}
form button[value='cancel'] {
  color: rgb(var(--colors-text));
}
form button[value='submit'] {
  color: rgb(var(--colors-primary));
  font-weight: 500;
  margin-left: 0.5rem;
}

::placeholder {
  font-size: 0.875rem;
}
</style>
