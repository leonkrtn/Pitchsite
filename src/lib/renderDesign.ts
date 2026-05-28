import JSZip from 'jszip'

function guessMime(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    css: 'text/css', js: 'application/javascript', mjs: 'application/javascript',
    html: 'text/html', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
    json: 'application/json',
  }
  return map[ext] ?? 'application/octet-stream'
}

// Injected into every design HTML — reports full content height to parent via postMessage
// so pins can be positioned over the full design regardless of iframe origin.
const HEIGHT_SCRIPT = `<script>(function(){
  function send(){parent.postMessage({type:'pitchsite-height',h:document.documentElement.scrollHeight},'*')}
  window.addEventListener('load',send);
  if(typeof ResizeObserver!=='undefined'){new ResizeObserver(send).observe(document.documentElement)}
  setTimeout(send,500);setTimeout(send,1500);
})();</script>`

function injectHeightScript(html: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, HEIGHT_SCRIPT + '</body>')
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, HEIGHT_SCRIPT + '</html>')
  return html + HEIGHT_SCRIPT
}

async function resolveZip(blob: Blob): Promise<{ src: string; revoke: () => void }> {
  const zip = await JSZip.loadAsync(blob)
  const entries = Object.keys(zip.files)
  const indexPath =
    entries.find(f => f.toLowerCase() === 'index.html') ||
    entries.find(f => !zip.files[f].dir && f.toLowerCase().endsWith('/index.html')) ||
    entries.find(f => !zip.files[f].dir && f.toLowerCase().endsWith('.html'))
  if (!indexPath) throw new Error('Keine index.html im ZIP gefunden.')

  const baseDir = indexPath.includes('/') ? indexPath.replace(/[^/]+$/, '') : ''
  const htmlRaw = await zip.files[indexPath].async('string')
  const blobUrls: string[] = []
  const blobMap = new Map<string, string>()

  await Promise.all(
    entries.filter(f => !zip.files[f].dir).map(async f => {
      const buf = await zip.files[f].async('arraybuffer')
      const url = URL.createObjectURL(new Blob([buf], { type: guessMime(f) }))
      blobUrls.push(url)
      blobMap.set(f, url)
      if (baseDir && f.startsWith(baseDir)) blobMap.set(f.slice(baseDir.length), url)
    })
  )

  const resolve = (path: string) => blobMap.get(path) ?? blobMap.get(baseDir + path) ?? null
  const rewritten = htmlRaw
    .replace(/\b(src|href)\s*=\s*(["'])([^"']+)\2/gi, (match, attr, q, path) => {
      if (/^(https?:|\/\/|data:|blob:|#|mailto:)/.test(path)) return match
      const u = resolve(path); return u ? `${attr}=${q}${u}${q}` : match
    })
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, q, path) => {
      if (/^(https?:|\/\/|data:|blob:)/.test(path)) return match
      const u = resolve(path); return u ? `url(${q}${u}${q})` : match
    })

  const src = URL.createObjectURL(new Blob([injectHeightScript(rewritten)], { type: 'text/html' }))
  blobUrls.push(src)
  return { src, revoke: () => blobUrls.forEach(URL.revokeObjectURL) }
}

export async function fetchAndRenderDesign(
  fileUrl: string,
  fileName: string,
): Promise<{ src: string; revoke: () => void }> {
  const response = await fetch(fileUrl)
  const blob = await response.blob()

  if (fileName.toLowerCase().endsWith('.zip')) {
    return resolveZip(blob)
  }

  const html = await blob.text()
  const src = URL.createObjectURL(new Blob([injectHeightScript(html)], { type: 'text/html' }))
  return { src, revoke: () => URL.revokeObjectURL(src) }
}
