import sharp from 'sharp'

const input = 'C:\\Users\\omar-\\Downloads\\md_viewer.png'
const output = 'src-tauri/icons/icon-processed.png'

// Trim surrounding white edges only (preserves white inside the icon)
let buf = await sharp(input)
  .trim({ threshold: 20, background: [255, 255, 255] })
  .ensureAlpha()
  .toBuffer()

const meta = await sharp(buf).metadata()
const size = Math.max(1024, meta.width || 0, meta.height || 0)

await sharp(buf)
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(output)

console.log(`Trimmed to ${meta.width}x${meta.height}, output ${size}x${size}`)
