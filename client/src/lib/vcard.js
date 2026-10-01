export function parseVCard(text) {
  const get = (re) => (text.match(re)?.[1] || '').trim()
  return {
    full_name: get(/^FN[^:\r\n]*:(.+)$/m),
    company: get(/^ORG[^:\r\n]*:(.+)$/m).replace(/;/g, ' ').trim(),
    job_title: get(/^TITLE[^:\r\n]*:(.+)$/m),
    phone: get(/^TEL[^:\r\n]*:(.+)$/m),
    email: get(/^EMAIL[^:\r\n]*:(.+)$/m),
    website: get(/^URL[^:\r\n]*:(.+)$/m),
    address: '',
    notes: '',
  }
}

export function downloadVCard(c) {
  const parts = (c.full_name || '').trim().split(/\s+/)
  const last = parts.length > 1 ? parts.pop() : ''
  const first = parts.join(' ')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${last};${first};;;`,
    `FN:${c.full_name}`,
    c.company && `ORG:${c.company}`,
    c.job_title && `TITLE:${c.job_title}`,
    c.phone && `TEL;TYPE=WORK,VOICE:${c.phone}`,
    c.email && `EMAIL;TYPE=WORK:${c.email}`,
    c.website && `URL:${c.website}`,
    c.address && `ADR;TYPE=WORK:;;${c.address};;;;`,
    'END:VCARD',
  ].filter(Boolean)

  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${(c.full_name || 'contact').replace(/\s+/g, '-')}.vcf`
  a.click()
  URL.revokeObjectURL(a.href)
}