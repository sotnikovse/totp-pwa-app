<template>
  <input type="checkbox" />
</template>

<script lang="ts">
export default class AppTheme extends HTMLElement {
  constructor() {
    super()

    const shadowRoot = this.attachShadow({ mode: 'open' })
    const template = document.getElementById(
      'app-theme-template',
    ) as HTMLTemplateElement
    shadowRoot.appendChild(template.content.cloneNode(true))

    const inputElement = shadowRoot.querySelector('input') as HTMLInputElement

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (darkModeMediaQuery.matches) {
      inputElement.checked = true
      this.setTheme('dark')
    }
    darkModeMediaQuery.addEventListener('change', (e) => {
      const darkModeOn = e.matches
      inputElement.checked = darkModeOn
    })
    inputElement.addEventListener('change', (e) => {
      const input = e.target as HTMLInputElement
      this.setTheme(input.checked ? 'dark' : 'light')
    })
  }

  private setTheme(theme: 'light' | 'dark' = 'light') {
    const root = document.querySelector(':root') as HTMLElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-theme': AppTheme
  }
}
</script>
