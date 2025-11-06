<template>
  <div class="menu-button">
    <slot name="button"></slot>
    <div role="menu">
      <slot name="item"></slot>
    </div>
  </div>
</template>

<script lang="ts">
let _id = 1

class MenuButton extends HTMLElement {
  private isOpened = false
  private buttonId: string = `menu-button-${_id}`
  private contentId: string = `menu-content-${_id}`
  private buttonElement: HTMLElement | undefined
  private contentElement: HTMLElement | undefined

  constructor() {
    super()

    _id++

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'menu-button-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    const buttonSlot = this.shadowRoot?.querySelector<HTMLSlotElement>(
      'slot[name="button"]',
    )
    const contentElement =
      this.shadowRoot?.querySelector<HTMLElement>('[role="menu"]')
    const buttonElement = buttonSlot?.assignedElements()[0]

    if (buttonElement) {
      this.buttonElement = buttonElement as HTMLElement
      this.buttonElement.id = this.buttonId
      this.buttonElement.setAttribute('type', 'button')
      this.buttonElement.setAttribute('aria-haspopup', 'true')
      this.buttonElement.addEventListener('click', (e) => {
        e.stopPropagation()
        this.isOpened ? this.close() : this.open()
      })
    }

    if (contentElement) {
      this.contentElement = contentElement
      this.contentElement.id = this.contentId
      this.contentElement.dataset.status = 'closed'

      const itemsSlot =
        this.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="item"]')
      const items = itemsSlot?.assignedElements() || []
      for (const item of items) {
        item.setAttribute('role', 'menuitem')
      }
    }

    document.addEventListener('click', () => {
      this.close()
    })
  }

  private open() {
    this.buttonElement?.setAttribute('aria-expanded', 'true')
    this.buttonElement?.setAttribute('aria-controls', this.contentId)
    if (this.contentElement) {
      this.contentElement.dataset.status = 'opened'
    }
    this.isOpened = true
  }

  private close() {
    this.buttonElement?.removeAttribute('aria-expanded')
    this.buttonElement?.removeAttribute('aria-controls')
    if (this.contentElement) {
      this.contentElement.dataset.status = 'closed'
    }
    this.isOpened = false
  }
}

export default MenuButton

declare global {
  interface HTMLElementTagNameMap {
    'menu-button': MenuButton
  }
}
</script>

<style>
:host {
  display: inline-block;
  position: relative;
}

[role='menu'] {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: rgb(var(--colors-bg));
  border: transparent;
  border-radius: 0.25rem;
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  margin-top: 4px;
  width: max-content;
  z-index: 10;
}

:host([align='left']) [role='menu'] {
  left: 0;
  right: auto;
}

:host([align='right']) [role='menu'] {
  left: auto;
  right: 0;
}

[role='menu'][data-status='opened'] {
  display: block;
}

::slotted([role='menuitem']) {
  font-size: 0.875rem;
  padding: 0.375rem 0.625rem;
  cursor: default;
  text-align: left;
}

::slotted([role='menuitem']:hover) {
  background-color: #e5e5e5;
}

::slotted([role='menuitem']:first-of-type) {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

::slotted([role='menuitem']:last-of-type) {
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
}

@media (prefers-color-scheme: dark) {
  [role='menu'] {
    background-color: #262626;
  }
  ::slotted([role='menuitem']:hover) {
    background-color: #171717;
  }
}
</style>
