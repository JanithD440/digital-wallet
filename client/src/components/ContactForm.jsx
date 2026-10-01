import { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Building2, Globe, Loader2, Mail, MapPin, Phone, Save, User } from 'lucide-react'

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      <input className="field" {...props} />
    </div>
  )
}

export default function ContactForm({ initial, note, saving, error, onSave, onCancel }) {
  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    notes: '',
    ...initial,
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass space-y-4 rounded-3xl p-6"
    >
      <div>
        <h2 className="text-xl font-bold">
          <span className="text-gradient">Review contact details</span>
        </h2>
        {note && <p className="mt-1 text-sm text-amber-300/80">{note}</p>}
      </div>

      <Field icon={User} placeholder="Full name" value={form.full_name} onChange={set('full_name')} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field icon={Briefcase} placeholder="Job title" value={form.job_title} onChange={set('job_title')} />
        <Field icon={Building2} placeholder="Company" value={form.company} onChange={set('company')} />
      </div>
            <div className="grid gap-4 sm:grid-cols-2">
        <Field icon={Phone} placeholder="Phone" value={form.phone} onChange={set('phone')} />
        <Field icon={Mail} placeholder="Email" value={form.email} onChange={set('email')} />
      </div>
      <Field icon={Globe} placeholder="Website" value={form.website} onChange={set('website')} />
      <Field icon={MapPin} placeholder="Address" value={form.address} onChange={set('address')} />

      <textarea
        className="field"
        style={{ paddingLeft: '1rem', minHeight: '80px', resize: 'vertical' }}
        placeholder="Notes (where you met, what to follow up on...)"
        value={form.notes}
        onChange={set('notes')}
      />

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Discard
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-4 w-4" />}
          Save to wallet
        </motion.button>
      </div>
    </motion.form>
  )
}