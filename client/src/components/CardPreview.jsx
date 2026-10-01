import { motion } from 'framer-motion'
import { Phone, Mail, Globe, MapPin, ExternalLink } from 'lucide-react'

// eslint-disable-next-line react-refresh/only-export-components
export const THEMES = {
  midnight: 'from-indigo-600 via-purple-600 to-fuchsia-600',
  ocean: 'from-sky-500 via-cyan-500 to-teal-500',
  sunset: 'from-orange-500 via-rose-500 to-pink-600',
  forest: 'from-emerald-500 via-green-600 to-lime-500',
}

const toUrl = (u) => (/^https?:\/\//.test(u) ? u : `https://${u}`)

export default function CardPreview({ card }) {
  const gradient = THEMES[card.theme] || THEMES.midnight
  const socials = Object.entries(card.socials || {}).filter(([, v]) => v)

  const rows = [
    { icon: Phone, label: card.phone, href: card.phone && `tel:${card.phone.replace(/\s+/g, '')}` },
    { icon: Mail, label: card.email, href: card.email && `mailto:${card.email}` },
    { icon: Globe, label: card.website, href: card.website && toUrl(card.website) },
    { icon: MapPin, label: card.address },
  ].filter((r) => r.label)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="glass w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
    >
      <div className={`relative h-28 overflow-hidden bg-linear-to-br ${gradient}`}>
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/15" />
        <div className="absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-white/10" />
      </div>

      <div className="px-6 pb-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
          className="relative z-10 -mt-10 grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-4 border-[#0b0d17] bg-white text-2xl font-extrabold text-slate-800"
        >
          {card.logo_url ? (
            <img src={card.logo_url} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            (card.full_name?.[0] || '?').toUpperCase()
          )}
        </motion.div>

        <h2 className="mt-4 text-2xl font-extrabold tracking-tight">
          {card.full_name || 'Your Name'}
        </h2>
        <p className="text-sm text-white/60">
          {[card.job_title, card.company].filter(Boolean).join(' · ') || 'Job title · Company'}
        </p>

        {card.bio && <p className="mt-4 text-sm leading-relaxed text-white/70">{card.bio}</p>}

        {rows.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
            className="mt-5 space-y-2"
          >
            {rows.map((r, i) => {
              const Tag = r.href ? motion.a : motion.div
              return (
                <Tag
                  key={i}
                  href={r.href}
                  target={r.href?.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                  className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm transition-colors hover:bg-white/10"
                >
                  <r.icon className="h-4 w-4 shrink-0 text-indigo-300" />
                  <span className="truncate">{r.label}</span>
                </Tag>
              )
            })}
          </motion.div>
        )}

        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map(([name, url]) => (
              <a
                key={name}
                href={toUrl(url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium capitalize hover:bg-white/20"
              >
                {name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}