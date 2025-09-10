/**
 * Utilidades para detectar y manejar diferentes tipos de archivos
 * Especialmente para animaciones Rive vs imágenes normales
 */

export function getFileExtension(url: string): string {
  if (!url) return ''
  
  // Remover query params y hash
  const cleanUrl = url.split('?')[0].split('#')[0]
  const parts = cleanUrl.split('.')
  
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export function isRiveFile(url: string): boolean {
  const extension = getFileExtension(url)
  return extension === 'riv'
}

export function isImageFile(url: string): boolean {
  const extension = getFileExtension(url)
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
  return imageExtensions.includes(extension)
}

export function isValidAnimationFile(url: string): boolean {
  return isRiveFile(url) || isImageFile(url)
}

export function getMediaType(url: string): 'rive' | 'image' | 'unknown' {
  if (isRiveFile(url)) return 'rive'
  if (isImageFile(url)) return 'image'
  return 'unknown'
}

// Helper para debugging
export function analyzeMediaUrl(url: string) {
  return {
    url,
    extension: getFileExtension(url),
    type: getMediaType(url),
    isRive: isRiveFile(url),
    isImage: isImageFile(url),
    isValid: isValidAnimationFile(url)
  }
}
