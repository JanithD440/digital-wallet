import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '8mb' }))

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Tried in order. If a model name is retired (404), the next one is used.
const MODELS = [process.env.GEMINI_MODEL, 'gemini-3.1-flash-lite', 'gemini-2.5-flash'].filter(Boolean)

const FIELDS = ['full_name', 'job_title', 'company', 'phone', 'email', 'website', 'address']

const PROMPT = [
  'You are reading a photo of a business card.',
  'Extract the contact details and return ONLY a JSON object with exactly these keys:',
  'full_name, job_title, company, phone, email, website, address.',
  'Rules:',
  '- Use an empty string for anything that is not on the card. Never invent data.',
  '- full_name: the person name in normal capitalization (convert ALL CAPS to Title Case).',
  '- company: the business name, even if it only appears as part of the logo.',
  '- phone: keep the country code as printed. If there are several numbers, join them with " / ".',
  '- email and website: copy exactly as printed.',
  '- address: a single line.',
].join('\n')

// simple per-user limit: 8 scans per minute
const hits = new Map()
function allowed(userId) {
  const now = Date.now()
  const recent = (hits.get(userId) || []).filter((t) => now - t < 60_000)
  if (recent.length >= 8) return false
  recent.push(now)
  hits.set(userId, recent)
  return true
}

async function requireUser(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Not logged in.' })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid session.' })

  req.user = data.user
  next()
}

const normalize = (obj) => {
  const src = Array.isArray(obj) ? obj[0] : obj
  const out = {}
  FIELDS.forEach((k) => {
    out[k] = typeof src?.[k] === 'string' ? src[k].trim() : ''
  })
  return out
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.post('/api/scan-card', requireUser, async (req, res) => {
  const { image, mimeType = 'image/jpeg' } = req.body || {}

  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Image is required.' })
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY.' })
  }
  if (!allowed(req.user.id)) {
    return res.status(429).json({ error: 'Too many scans. Please wait a minute.' })
  }

  let lastError = 'Scan failed.'

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image } }] },
            ],
            generationConfig: { responseMimeType: 'application/json', temperature: 0 },
          }),
        }
      )

      if (r.status === 404 || r.status >= 500) {
        lastError = `Model ${model} is unavailable (${r.status}).`
        console.error(lastError)
        continue
      }

      if (r.status === 429) {
        return res.status(429).json({ error: 'AI scan limit reached. Please try again in a minute.' })
      }

      if (!r.ok) {
        console.error('Gemini error', r.status, await r.text())
        return res.status(502).json({ error: 'AI service error.' })
      }

      const data = await r.json()
      const text = (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')

      try {
        const json = JSON.parse(text.replace(/```json|```/g, '').trim())
        return res.json({ fields: normalize(json), model })
      } catch {
        console.error('Could not parse Gemini output:', text)
        return res.status(502).json({ error: 'Could not read the card.' })
      }
    } catch (err) {
      lastError = err.message
      console.error('Gemini request failed:', err)
    }
  }

  return res.status(502).json({ error: lastError })
})

if (!process.env.VERCEL) {
  app.listen(5000, () => console.log('Server running on 5000'))
}
export default app