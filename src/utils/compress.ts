import AppToaster from '../components/AppToaster.sfce.vue'

/**
 * сжатие текста
 *
 * @param {string} text - входные данные
 * @returns {Promise<Uint8Array<ArrayBuffer>>} результат
 */
export async function compressText(text: string) {
  if ('CompressionStream' in window) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(text))
        controller.close()
      },
    }).pipeThrough(new CompressionStream('gzip'))

    const compressedBuffer = await new Response(stream).arrayBuffer()
    return new Uint8Array(compressedBuffer)
  } else {
    const message = 'CompressionStream не поддерживается'
    AppToaster.showToast(message, 'error')
    throw new Error(message)
  }
}

/**
 * распаковка сжатого файла
 *
 * @param {Blob} blob - входные данные
 * @returns {Promise<string>} текст
 */
export async function decompressFile(blob: Blob) {
  if ('DecompressionStream' in window) {
    const stream = blob.stream()
    const decompressedStream = stream.pipeThrough(
      new DecompressionStream('gzip'),
    )
    const decompressedBuffer = await new Response(
      decompressedStream,
    ).arrayBuffer()
    return new TextDecoder().decode(decompressedBuffer)
  } else {
    const message = 'DecompressionStream не поддерживается'
    AppToaster.showToast(message, 'error')
    throw new Error(message)
  }
}

/**
 * скачивание файла с указанным названием
 *
 * @param {string} filename - название файла
 * @param {Uint8Array<ArrayBuffer>} - данные
 */
export function downloadFile(
  filename: string,
  arrayBuffer: Uint8Array<ArrayBuffer>,
) {
  const blob = new Blob([arrayBuffer])
  const blobURL = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = blobURL
  a.download = `${filename}.zip`
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(blobURL)
  })
}

/**
 * безопасное названия файла
 *
 * @param {string} label - название
 * @param {number} [maxLength=25] - максимальная длина
 * @returns {string} безопасное название файла с текущей датой
 */
export function filenameFromLabel(label: string, maxLength = 25): string {
  const date = new Date()

  const normalizedName = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-я0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength)

  return `${normalizedName}-${date.toISOString().slice(0, 10)}`
}
