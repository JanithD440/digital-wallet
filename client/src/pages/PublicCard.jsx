import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Loader2, UserPlus, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import CardPreview from '../components/CardPreview'

export default function PublicCard() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('cards')
      .select('*')
      .eq('slug', slug)
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
  }, [slug])

  const saveToWallet = async () => {
    setMsg('')
    if (!user) {
      navigate('/login')
      return
    }
    if (user.id === card.user_id) {
      setMsg('This is your own card.')
      return
    }
    const { error } = await supabase
      .from('wallet_cards')
      .insert({ owner_id: user.id, card_id: card.id })
    if (error?.code === '23505') setMsg('Already in your wallet.')
    else if (error) setMsg(error.message)
    else setSaved(true)
  }

  const downloadVCard = () => {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.full_name}`,
      card.company && `ORG:${card.company}`,
      card.job_title && `TITLE:${card.job_title}`,
      card.phone && `TEL;TYPE=WORK,VOICE:${card.phone}`,
      card.email && `EMAIL;TYPE=WORK:${card.email}`,
      card.website && `URL:${card.website}`,
      'END:VCARD',
    ].filter(Boolean)
    const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${card.full_name.replace(/\s+/g, '-')}.vcf`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">Card not found</h1>
          <p className="mt-2 text-white/50">This link may be wrong or the card was removed.</p>
          <Link to="/login" className="btn-ghost mt-6">Go to Digital Wallet</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <CardPreview card={card} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-5 space-y-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={saveToWallet}
            disabled={saved}
            className="btn-primary"
          >
            {saved ? <Check className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
            {saved ? 'Saved to your wallet' : 'Save to wallet'}
          </motion.button>

          <button onClick={downloadVCard} className="btn-ghost w-full">
            <UserPlus className="h-4 w-4" /> Add to phone contacts
          </button>

          {msg && <p className="text-center text-sm text-amber-300">{msg}</p>}

          <p className="pt-2 text-center text-xs text-white/40">
            Want your own digital card?{' '}
            <Link to="/login" className="text-indigo-300 hover:underline">
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}