/**
 * экранирование HTML
 *
 * @param {string | null | undefined} input - входные данные
 * @returns {string} текст
 */
export function escapeHTML(input: string | null | undefined) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
