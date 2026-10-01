import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeCanvas } from 'qrcode.react'
import { Check, Copy, Download, ExternalLink, Loader2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CardForm from '../components/CardForm'
import CardPreview from '../components/CardPreview'

export default function MyCard() {
  const { user } = useAuth()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef(null)

  useEffect(() => {
    let active = true
    supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setCard(data)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user.id])

  const url = card ? `${window.location.origin}/c/${card.slug}` : ''

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${card.slug}-qr.png`
    a.click()
  }

  const showForm = editing || !card

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {showForm ? (
        <motion.div key="form" exit={{ opacity: 0 }}>
          <CardForm
            user={user}
            card={card}
            onCancel={() => setEditing(false)}
            onSaved={(saved) => {
              setCard(saved)
              setEditing(false)
            }}
          />
        </motion.div>
      ) : (
        <motion.div key="view" exit={{ opacity: 0 }} className="grid items-start gap-8 lg:grid-cols-2">
          <div className="flex justify-center">
            <CardPreview card={card} />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-3xl p-6 text-center"
          >
            <h2 className="text-xl font-bold">
              <span className="text-gradient">Share your card</span>
            </h2>
            <p className="mt-1 text-sm text-white/50">Anyone can scan this QR code to open your card.</p>

            <motion.div
              ref={qrRef}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
              className="mx-auto mt-6 w-fit rounded-2xl bg-white p-3 shadow-xl shadow-indigo-500/20"
            >
              <QRCodeCanvas
                value={url}
                size={512}
                level="H"
                marginSize={1}
                fgColor="#0b0d17"
                bgColor="#ffffff"
                style={{ width: 220, height: 220 }}
              />
            </motion.div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/5 p-2 pl-4 text-sm">
              <span className="flex-1 truncate text-left text-white/70">{url}</span>
              <button onClick={copyLink} className="btn-ghost px-3! !py-2">
                {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button onClick={downloadQR} className="btn-ghost">
                <Download className="h-4 w-4" /> QR
              </button>
              <a href={url} target="_blank" rel="noreferrer" className="btn-ghost">
                <ExternalLink className="h-4 w-4" /> Open
              </a>
              <button onClick={() => setEditing(true)} className="btn-ghost">
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}