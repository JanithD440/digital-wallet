import { supabase } from './supabase'

const FIELDS = ['full_name', 'job_title', 'company', 'phone', 'email', 'website', 'address', 'notes']

export async function saveDigitalCard(userId, card) {
  if (card.user_id === userId) return { status: 'own' }

  const { error } = await supabase
    .from('wallet_cards')
    .insert({ owner_id: userId, card_id: card.id, source: 'qr' })

  if (error?.code === '23505') return { status: 'exists' }
  if (error) return { status: 'error', message: error.message }
  return { status: 'saved' }
}

export async function saveContact(userId, fields, source = 'scan') {
  const row = { owner_id: userId, source }
  FIELDS.forEach((k) => {
    row[k] = (fields[k] || '').trim()
  })

  if (!row.full_name) return { status: 'error', message: 'Name is required.' }

  const { error } = await supabase.from('wallet_cards').insert(row)
  if (error) return { status: 'error', message: error.message }
  return { status: 'saved' }
}