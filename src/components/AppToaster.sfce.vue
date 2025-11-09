<template>
  <div class="toaster-wrapper"></div>
</template>

<script lang="ts">
type ToasterType = 'info' | 'warning' | 'error'

type ToasterLink = {
  text: string
  url: string
}

type ToasterItem = {
  id: string
  message: string
  type?: ToasterType
  duration?: number
  link?: ToasterLink
}

const DEFAULT_DURATION = 5000

let _id = 0
let toasterProxy: Record<string, ToasterItem> = {}

class AppToaster extends HTMLElement {
  private timersMap: Record<string, number> = {}
  private itemsMap: Record<string, ToasterItem> = {}

  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'app-toaster-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))

    toasterProxy = new Proxy(this.itemsMap, {
      set: (target, property, newValue, receiver) => {
        if ((newValue as ToasterItem)?.id) {
          this._showToast(newValue)
        }
        return Reflect.set(target, property, newValue, receiver)
      },
      deleteProperty: (target, property) => {
        const item = target[String(property)]
        if (item?.id) {
          this._removeToast(item.id)
        }
        return Reflect.deleteProperty(target, property)
      },
    })
  }

  private _showToast(item: ToasterItem) {
    const rootElement = document.createElement('div')
    rootElement.id = item.id
    rootElement.className = `toaster-item toaster-item_${item.type}`
    rootElement.onclick = () => this._removeToast(item.id)
    if (item.link) {
      const contentElement = document.createElement('span')
      contentElement.innerText = item.message
      rootElement.appendChild(contentElement)
      const linkElement = document.createElement('a')
      linkElement.className = 'toaster-item__link'
      linkElement.href = item.link.url
      linkElement.innerText = item.link.text
      rootElement.appendChild(linkElement)
    } else {
      rootElement.innerText = item.message
    }
    this.shadowRoot?.querySelector('.toaster-wrapper')?.appendChild(rootElement)

    this.timersMap[item.id] = setTimeout(() => {
      this._removeToast(item.id)
    }, item.duration || DEFAULT_DURATION)
  }

  private _removeToast(id: string) {
    clearTimeout(this.timersMap[id])
    delete this.timersMap[id]
    delete toasterProxy[id]
    this.shadowRoot?.getElementById(id)?.remove()
  }

  static showToast(
    message: string,
    type?: ToasterType,
    duration = DEFAULT_DURATION,
    link?: ToasterLink,
  ) {
    const id = `toast-${++_id}`
    if (toasterProxy) {
      toasterProxy[id] = { id: `toast-${++_id}`, message, type, duration, link }
    }
  }

  static removeToast(id: string) {
    delete toasterProxy[id]
  }
}

export default AppToaster

declare global {
  interface HTMLElementTagNameMap {
    'app-toaster': AppToaster
  }
}
</script>

<style>
:host {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
}

.toaster-wrapper {
  width: max-content;
  max-width: 20rem;
  display: flex;
  align-items: center;
  flex-direction: column-reverse;
  gap: 0.5rem;
}

.toaster-item {
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  pointer-events: auto;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(var(--colors-white));
  background-color: rgb(var(--colors-gray));
  cursor: default;
  white-space: pre-wrap;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  column-gap: 0.5rem;
}

.toaster-item__link {
  text-decoration: inherit;
  font-size: 0.75rem;
  font-weight: 500;
}

.toaster-item_info {
  background-color: rgb(var(--colors-primary));
}
.toaster-item_warning {
  background-color: rgb(var(--colors-orange));
}
.toaster-item_error {
  background-color: rgb(var(--colors-red));
}
</style>
