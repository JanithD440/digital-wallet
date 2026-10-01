import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Briefcase, Building2, Phone, Mail, Globe, MapPin, Link2,
  Upload, Loader2, Save,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import CardPreview, { THEMES } from './CardPreview'

const makeSlug = (name) => {
  const base =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'card'
  return `${base}-${Math.random().toString(36).slice(2, 6)}`
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input className="field" {...props} />
    </div>
  )
}

export default function CardForm({ user, card, onSaved, onCancel }) {
  const [form, setForm] = useState({
    full_name: card?.full_name || '',
    job_title: card?.job_title || '',
    company: card?.company || '',
    phone: card?.phone || '',
    email: card?.email || user.email || '',
    website: card?.website || '',
    address: card?.address || '',
    bio: card?.bio || '',
    logo_url: card?.logo_url || '',
    theme: card?.theme || 'midnight',
    linkedin: card?.socials?.linkedin || '',
    facebook: card?.socials?.facebook || '',
    instagram: card?.socials?.instagram || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const preview = {
    ...form,
    socials: { linkedin: form.linkedin, facebook: form.facebook, instagram: form.instagram },
  }

  const handleLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be smaller than 2MB.')
      return
    }
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (upErr) {
      setError(upErr.message)
    } else {
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      setForm((f) => ({ ...f, logo_url: data.publicUrl }))
    }
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      full_name: form.full_name.trim(),
      job_title: form.job_title.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      address: form.address.trim(),
      bio: form.bio.trim(),
      logo_url: form.logo_url,
      theme: form.theme,
      socials: preview.socials,
      updated_at: new Date().toISOString(),
    }

    const query = card
      ? supabase.from('cards').update(payload).eq('id', card.id)
      : supabase.from('cards').insert({ ...payload, user_id: user.id, slug: makeSlug(payload.full_name) })

    const { data, error: saveErr } = await query.select().single()

    if (saveErr) setError(saveErr.message)
    else onSaved(data)
    setSaving(false)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass space-y-4 rounded-3xl p-6"
      >
        <h2 className="text-xl font-bold">
          <span className="text-gradient">{card ? 'Edit your card' : 'Create your digital card'}</span>
        </h2>

        <Field icon={User} placeholder="Full name" value={form.full_name} onChange={set('full_name')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={Briefcase} placeholder="Job title" value={form.job_title} onChange={set('job_title')} />
          <Field icon={Building2} placeholder="Company" value={form.company} onChange={set('company')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field icon={Phone} placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <Field icon={Mail} type="email" placeholder="Email" value={form.email} onChange={set('email')} />
        </div>
        <Field icon={Globe} placeholder="Website" value={form.website} onChange={set('website')} />
        <Field icon={MapPin} placeholder="Address" value={form.address} onChange={set('address')} />

        <textarea
          className="field"
          style={{ paddingLeft: '1rem', minHeight: '90px', resize: 'vertical' }}
          placeholder="Short bio (optional)"
          value={form.bio}
          onChange={set('bio')}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field icon={Link2} placeholder="LinkedIn URL" value={form.linkedin} onChange={set('linkedin')} />
          <Field icon={Link2} placeholder="Facebook URL" value={form.facebook} onChange={set('facebook')} />
          <Field icon={Link2} placeholder="Instagram URL" value={form.instagram} onChange={set('instagram')} />
        </div>

        <div>
          <p className="mb-2 text-sm text-white/50">Card color</p>
          <div className="flex gap-3">
            {Object.entries(THEMES).map(([key, gradient]) => (
              <motion.button
                key={key}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setForm((f) => ({ ...f, theme: key }))}
                className={`h-10 w-10 cursor-pointer rounded-full bg-linear-to-br ${gradient} ${
                  form.theme === key ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b0d17]' : ''
                }`}
                aria-label={key}
              />
            ))}
          </div>
        </div>

        <label className="btn-ghost w-full">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {form.logo_url ? 'Change logo / photo' : 'Upload logo / photo'}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </label>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}

        <div className="flex gap-3">
          {card && (
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
            {card ? 'Save changes' : 'Create card'}
          </motion.button>
        </div>
      </motion.form>

      <div className="flex items-start justify-center lg:sticky lg:top-8 lg:self-start">
        <CardPreview card={preview} />
      </div>
    </div>
  )
}