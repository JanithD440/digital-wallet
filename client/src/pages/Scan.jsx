import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, QrCode, UserPlus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { parseVCard } from '../lib/vcard'
import { saveContact, saveDigitalCard } from '../lib/wallet'
import QrScanner from '../components/QrScanner'
import CardOCR from '../components/CardOCR'
import ContactForm from '../components/ContactForm'

const MODES = [
  { key: 'qr', label: 'Scan QR', icon: QrCode },
  { key: 'photo', label: 'Card photo', icon: Camera },
]

const EMPTY = {
  full_name: '',
  job_title: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  notes: '',
}

export default function Scan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('qr')
  const [qrKey, setQrKey] = useState(0)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [result, setResult] = useState(null)

  const handleQr = async (text) => {
    const slug = text.match(/\/c\/([a-z0-9-]+)/i)?.[1]

    if (slug) {
      const { data: card } = await supabase.from('cards').select('*').eq('slug', slug).maybeSingle()
      if (!card) {
        setResult({ ok: false, text: 'This card was not found.' })
        return
      }
      const res = await saveDigitalCard(user.id, card)
      if (res.status === 'saved') setResult({ ok: true, text: `${card.full_name} was added to your wallet.` })
      else if (res.status === 'exists') setResult({ ok: true, text: `${card.full_name} is already in your wallet.` })
      else if (res.status === 'own') setResult({ ok: false, text: 'This is your own card.' })
      else setResult({ ok: false, text: res.message })
      return
    }

    if (/BEGIN:VCARD/i.test(text)) {
      setDraft({ fields: parseVCard(text), source: 'qr', image: '' })
      return
    }

    setResult({ ok: false, text: 'This QR code is not a business card.' })
  }

  const saveDraft = async (fields) => {
    setSaving(true)
    setFormError('')
    const res = await saveContact(user.id, fields, draft.source)
    setSaving(false)

    if (res.status === 'saved') {
      setDraft(null)
      setResult({ ok: true, text: `${fields.full_name} was added to your wallet.` })
    } else {
      setFormError(res.message)
    }
  }

  const reset = () => {
    setResult(null)
    setDraft(null)
    setFormError('')
    setQrKey((k) => k + 1)
  }

  return (
    <div className="mx-auto max-w-xl">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-3xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
                result.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
              }`}
            >
              {result.ok ? <Check className="h-8 w-8" /> : <X className="h-8 w-8" />}
            </motion.div>
            <p className="mt-5 text-lg font-semibold">{result.text}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={reset} className="btn-ghost">
                Scan another
              </button>
              <button onClick={() => navigate('/wallet')} className="btn-primary !w-auto px-6">
                Open wallet
              </button>
            </div>
          </motion.div>
        ) : draft ? (
          <motion.div key="draft" exit={{ opacity: 0 }}>
            {draft.image && (
              <img
                src={draft.image}
                alt="Scanned card"
                className="mb-4 max-h-48 w-full rounded-2xl bg-black/30 object-contain"
              />
            )}
            <ContactForm
              initial={draft.fields}
              note={draft.source === 'scan' ? 'Please check the details. Scanned text can have mistakes.' : ''}
              saving={saving}
              error={formError}
              onSave={saveDraft}
              onCancel={reset}
            />
          </motion.div>
        ) : (
          <motion.div key="scan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1 className="text-2xl font-extrabold">
              <span className="text-gradient">Add a card to your wallet</span>
            </h1>

            <div className="mt-5 grid grid-cols-2 rounded-xl bg-white/5 p-1 text-sm font-medium">
              {MODES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className="relative flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5"
                >
                  {mode === key && (
                    <motion.span
                      layoutId="scan-pill"
                      className="absolute inset-0 rounded-lg bg-white/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              {mode === 'qr' ? (
                <QrScanner key={qrKey} onDecoded={handleQr} />
              ) : (
                <CardOCR onParsed={(fields, image) => setDraft({ fields, source: 'scan', image })} />
              )}
            </div>

            <button
              onClick={() => setDraft({ fields: EMPTY, source: 'manual', image: '' })}
              className="btn-ghost mx-auto mt-6"
            >
              <UserPlus className="h-4 w-4" /> Add manually
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}