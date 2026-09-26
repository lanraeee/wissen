'use client'

/**
 * Resizes an uploaded image client-side and returns it as a base64 JPEG
 * data URL. Admin content editors embed photos directly in a site_content
 * JSON blob (capped at 500KB by the PUT route), and an unresized phone
 * photo easily blows past that on its own -- causing the save to fail
 * with no visible feedback unless the caller also checks res.ok. Downscaling
 * to a small avatar-sized image here keeps saves well under the cap.
 */
export function resizeImageToDataUrl(
  file: File,
  maxDim = 400,
  // PNG preserves transparency (logos, especially ones meant for dark
  // backgrounds) at the cost of a larger file; JPEG is smaller and fine for
  // opaque photos. Pass 'image/png' explicitly for logo/icon uploads.
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not read the selected image.'))
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Image resizing is not supported in this browser.'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL(mimeType, quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
