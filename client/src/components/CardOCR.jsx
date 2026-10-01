import { useState } from 'react'
import { Camera, ImageUp, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { parseCard } from '../lib/parseCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function toCanvas(file, { maxSide, upscale, grayscale }) {
  const bitmap = await createImageBitmap(file)
  const ratio = maxSide / Math.max(bitmap.width, bitmap.height)
  const scale = upscale ? Math.min(2, ratio) : Math.min(1, ratio)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (grayscale) ctx.filter = 'grayscale(1) contrast(1.25)'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function scanWithAI(file) {
  const canvas = await toCanvas(file, { maxSide: 1600, upscale: false, grayscale: false })
  const image = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${API_URL}/api/scan-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ image, mimeType: 'image/jpeg' }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || 'AI scan failed.')
  return { ...body.fields, notes: '' }
}

function extractLines(data) {
  const out = []
  const push = (l) => {
    if (!l?.text || !l.bbox) return
    out.push({
      text: l.text.trim(),
      conf: l.confidence ?? 100,
      h: l.bbox.y1 - l.bbox.y0,
      y: l.bbox.y0,
      x: l.bbox.x0,
    })
  }

  if (data.lines?.length) data.lines.forEach(push)
  else data.blocks?.forEach((b) => b.paragraphs?.forEach((p) => p.lines?.forEach(push)))

  return out
}

async function scanWithTesseract(file, onProgress) {
  const { createWorker } = await import('tesseract.js')
  const canvas = await toCanvas(file, { maxSide: 1600, upscale: true, grayscale: true })

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100))
    },
  })

  await worker.setParameters({ tessedit_pageseg_mode: '11' })
  const { data } = await worker.recognize(canvas, {}, { blocks: true })
  await worker.terminate()

  if (!data.text.trim()) throw new Error('No text found.')
  return parseCard(data.text, extractLines(data))
}

export default function CardOCR({ onParsed }) {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError('')
    setBusy(true)
    setStatus('Reading card with AI...')
    const imageUrl = URL.createObjectURL(file)
    setPreview(imageUrl)

    try {
      let fields
      try {
        fields = await scanWithAI(file)
      } catch (aiErr) {
        console.warn('AI scan failed, using offline reader:', aiErr.message)
        setStatus('AI unavailable, using offline reader...')
        fields = await scanWithTesseract(file, (p) => setStatus(`Offline reader... ${p}%`))
      }
      onParsed(fields, imageUrl)
    } catch {
      setError('Could not read the card. Try again with better light and the card filling the frame.')
    }

    setBusy(false)
  }

  return (
    <div>
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-8 text-center">
        {preview ? (
          <img src={preview} alt="Card preview" className="mx-auto max-h-48 rounded-xl object-contain" />
        ) : (
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-500">
            <Camera className="h-7 w-7 text-white" />
          </div>
        )}

        <p className="mx-auto mt-4 max-w-xs text-sm text-white/60">
          Take a photo of any business card. Name, phone, email and company are filled in automatically.
        </p>

        {busy ? (
          <div className="mt-6">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-300" />
            <p className="mt-2 text-sm text-white/60">{status}</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <label className="btn-primary w-auto! cursor-pointer px-6">
              <Camera className="h-4 w-4" /> Take photo
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            </label>
            <label className="btn-ghost cursor-pointer">
              <ImageUp className="h-4 w-4" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-white/40">
        Tip: good light, card flat on a plain background, text filling the frame.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}