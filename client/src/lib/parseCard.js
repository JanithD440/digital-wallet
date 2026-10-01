const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/
const WEB_RE =
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|lk|net|org|io|co|biz|info|edu|gov|app|dev|ai)\b(?:\/[^\s]*)?/i
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g
const NAME_RE = /^[\p{L}.'’-]+(?:\s[\p{L}.'’-]+){1,3}$/u

const TITLE_RE =
  /\b(manager|director|engineer|developer|officer|executive|ceo|cto|cfo|coo|founder|co-founder|owner|president|consultant|designer|analyst|head|lead|chairman|partner|associate|assistant|specialist|architect|accountant|sales|marketing|administrator|supervisor|proprietor|programmer|intern|coordinator|advisor)\b/i

const COMPANY_RE =
  /\b(pvt|ltd|limited|inc|llc|llp|corp|co|company|holdings|group|solutions|technologies|technology|labs|systems|enterprises|industries|trading|associates|international|studio|agency|services|software|partners|bank|hotel|motors|traders)\b/i

const ADDRESS_RE =
  /\b(road|rd|street|lane|avenue|mawatha|place|floor|building|colombo|kandy|galle|jaffna|kurunegala|anuradhapura|negombo|sri lanka|p\.?o\.? box)\b/i

const GENERIC_MAIL = ['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'live', 'proton', 'protonmail', 'msn']

const letters = (s) => s.toLowerCase().replace(/[^a-z]/g, '')

const titleCase = (s) =>
  s === s.toUpperCase()
    ? s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
    : s

export function parseCard(text, rawLines = []) {
  const clean = (l) => l.replace(/[|_~•]/g, ' ').replace(/\s+/g, ' ').trim()

  let lines = rawLines
    .map((l) => ({ ...l, text: clean(l.text) }))
    .filter((l) => l.text.length > 1)

  if (!lines.length) {
    lines = text
      .split(/\r?\n/)
      .map(clean)
      .filter((l) => l.length > 1)
      .map((t, i) => ({ text: t, conf: 100, h: 0, y: i, x: 0 }))
  }

  const all = lines.map((l) => l.text).join('\n')

  const email = (all.match(EMAIL_RE) || [''])[0].toLowerCase()
  const noEmail = all.replace(EMAIL_RE, ' ')
  const website = (noEmail.match(WEB_RE) || [''])[0].replace(/[.,;]+$/, '')

  const phones = []
  for (const m of noEmail.matchAll(PHONE_RE)) {
    const digits = m[1].replace(/\D/g, '')
    if (digits.length >= 9 && digits.length <= 15) phones.push(m[1].trim())
  }
  const phone = phones[0] || ''

  const local = (email.split('@')[0] || '').toLowerCase()
  const websiteHost = website
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase()
  const emailHost = (email.split('@')[1] || '').toLowerCase()
  const domain =
    [websiteHost, emailHost]
      .map((h) => h.split('.')[0].replace(/[^a-z0-9]/g, ''))
      .filter((d) => d && !GENERIC_MAIL.includes(d))[0] || ''

  const isContactLine = (l) =>
    (email && l.toLowerCase().includes(email)) ||
    (website && l.toLowerCase().includes(website.toLowerCase())) ||
    phones.some((p) => l.includes(p)) ||
    l.replace(/\D/g, '').length >= 7 ||
    /^(tel|mob|mobile|phone|fax|email|e-mail|web|www)\b/i.test(l)

  const rest = lines.filter((l) => !isContactLine(l.text))

  const companyParts = []
  const address = []
  const leftover = []
  let job_title = ''
  let companyLine = ''

  for (const l of rest) {
    const t = letters(l.text)
    const commas = (l.text.match(/,/g) || []).length

    if (domain && t.length >= 3 && domain.includes(t) && !local.includes(t)) {
      companyParts.push(l)
    } else if (ADDRESS_RE.test(l.text) || commas >= 2 || (/\d/.test(l.text) && commas >= 1)) {
      address.push(l.text)
    } else if (!job_title && TITLE_RE.test(l.text)) {
      job_title = l.text
    } else if (!companyLine && COMPANY_RE.test(l.text)) {
      companyLine = l.text
    } else {
      leftover.push(l)
    }
  }

  // Name: the tallest text, joined with nearby lines of similar size
  const candidates = leftover.filter((l) => letters(l.text).length >= 3 && l.conf >= 40)
  let full_name = ''

  if (candidates.length) {
    const maxH = Math.max(...candidates.map((l) => l.h))

    if (maxH === 0) {
      full_name = (candidates.find((l) => NAME_RE.test(l.text)) || candidates[0]).text
    } else {
      const big = candidates.filter((l) => l.h >= maxH * 0.7)
      const anchor = big.reduce((a, b) => (b.h > a.h ? b : a), big[0])
      full_name = big
        .filter((l) => Math.abs(l.y - anchor.y) <= anchor.h * 2.5)
        .sort((a, b) => a.y - b.y)
        .map((l) => l.text)
        .join(' ')
    }
  }
  full_name = titleCase(full_name)

  // Company: logo text matching the domain, then a keyword line, then the domain itself
  // eslint-disable-next-line no-useless-assignment
  let company = ''
  const domainName = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : ''

  if (companyParts.length) {
    const joined = companyParts
      .sort((a, b) => a.y - b.y)
      .map((l) => l.text)
      .join(' ')
    company = letters(joined).length >= domain.length * 0.6 ? titleCase(joined) : domainName
  } else if (companyLine) {
    company = companyLine
  } else {
    company = domainName
  }

  return {
    full_name,
    job_title,
    company,
    phone,
    email,
    website,
    address: address.join(', '),
    notes: '',
  }
}