export async function postJobToTelegram(job: {
  id: string
  title: string
  company: string
  location?: string
  format?: string
  job_type?: string
  contract_type?: string
  salary_min?: number | null
  salary_max?: number | null
  description?: string
  skills?: string[]
  tags?: string[]
}): Promise<void> {
  const res = await fetch('/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Передаём весь объект — ссылка строится на сервере
    body: JSON.stringify({ job }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Telegram post error:', err)
    throw new Error(err.error || 'Ошибка отправки в Telegram')
  }

  const data = await res.json()
  console.log('Telegram post sent, link:', data.link)
}
