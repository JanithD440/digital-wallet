import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Download, ExternalLink, Loader2, Mail, Phone, ScanLine, Search, Trash2, Wallet as WalletIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { THEMES } from '../components/CardPreview'
import { downloadVCard } from '../lib/vcard'

const BADGES = { digital: 'Digital card', scan: 'Scanned card', qr: 'QR contact', manual: 'Manual' }

const normalize = (row) => {
  const src = row.cards || row
  return {
    id: row.id,
    notes: row.notes || '',
    kind: row.card_id ? 'digital' : row.source || 'manual',
    slug: row.cards?.slug,
    theme: row.cards?.theme,
    logo_url: row.cards?.logo_url,
    full_name: src.full_name || '',
    job_title: src.job_title || '',
    company: src.company || '',
    phone: src.phone || '',
    email: src.email || '',
    website: src.website || '',
    address: src.address || '',
  }
}

function WalletItem({ item, onDelete }) {
  const [notes, setNotes] = useState(item.notes)
  const [lastSaved, setLastSaved] = useState(item.notes)
  const gradient = THEMES[item.theme] || THEMES.midnight

  const saveNotes = async () => {
    if (notes === lastSaved) return
    const { error } = await supabase.from('wallet_cards').update({ notes }).eq('id', item.id)
    if (!error) setLastSaved(notes)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-3xl p-5"
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-linear-to-br text-lg font-bold ${gradient}`}
        >
          {item.logo_url ? (
            <img src={item.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            (item.full_name[0] || '?').toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-bold">{item.full_name}</h3>
              <p className="truncate text-sm text-white/60">
                {[item.job_title, item.company].filter(Boolean).join(' · ') || ' '}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/60">
              {BADGES[item.kind] || 'Contact'}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {item.phone && (
              <a href={`tel:${item.phone.replace(/\s+/g, '')}`} className="btn-ghost !px-3 !py-2">
                <Phone className="h-4 w-4" /> {item.phone}
              </a>
            )}
            {item.email && (
              <a href={`mailto:${item.email}`} className="btn-ghost !px-3 !py-2">
                <Mail className="h-4 w-4" /> <span className="max-w-[160px] truncate">{item.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <textarea
        className="field mt-4"
        style={{ paddingLeft: '1rem', minHeight: '60px', resize: 'vertical' }}
        placeholder="Add a note..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => downloadVCard(item)} className="btn-ghost !px-3 !py-2">
          <Download className="h-4 w-4" /> Save to contacts
        </button>
        {item.slug && (
          <Link to={`/c/${item.slug}`} target="_blank" className="btn-ghost !px-3 !py-2">
            <ExternalLink className="h-4 w-4" /> View card
          </Link>
        )}
        <button
          onClick={() => onDelete(item.id)}
          className="btn-ghost ml-auto !px-3 !py-2 hover:!bg-red-500/20"
          aria-label="Remove from wallet"
        >
          <Trash2 className="h-4 w-4 text-red-300" />
        </button>
      </div>
    </motion.div>
  )
}

export default function WalletPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('wallet_cards')
      .select('*, cards(*)')
      .eq('owner_id', user.id)
      .order('saved_at', { ascending: false })
      .then(({ data }) => {
        if (active) {
          setItems((data || []).map(normalize))
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [user.id])

  const remove = async (id) => {
    if (!window.confirm('Remove this card from your wallet?')) return
    const { error } = await supabase.from('wallet_cards').delete().eq('id', id)
    if (!error) setItems((list) => list.filter((i) => i.id !== id))
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) =>
      [i.full_name, i.job_title, i.company, i.phone, i.email, i.notes].join(' ').toLowerCase().includes(q)
    )
  }, [items, query])

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            <span className="text-gradient">My Wallet</span>
          </h1>
          <p className="text-sm text-white/50">{items.length} saved {items.length === 1 ? 'card' : 'cards'}</p>
        </div>

        {items.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              className="field"
              placeholder="Search name, company, phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mx-auto max-w-md rounded-3xl p-10 text-center"
        >
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-500">
            <WalletIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-5 text-xl font-bold">Your wallet is empty</h2>
          <p className="mt-2 text-sm text-white/50">Scan a QR code or a business card to save your first contact.</p>
          <Link to="/scan" className="btn-primary mx-auto mt-6 !w-auto px-8">
            <ScanLine className="h-4 w-4" /> Scan a card
          </Link>
        </motion.div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-white/50">No cards match your search.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map((item) => (
              <WalletItem key={item.id} item={item} onDelete={remove} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}