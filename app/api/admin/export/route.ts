import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
         HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType } from 'docx'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtSalary(min?: number, max?: number) {
  if (!min && !max) return '—'
  if (min && max) return `${min.toLocaleString('ru')} – ${max.toLocaleString('ru')} ₽`
  if (min) return `от ${min.toLocaleString('ru')} ₽`
  return `до ${max!.toLocaleString('ru')} ₽`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const SPHERE_RU: Record<string,string> = {
  it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы',
  hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое', management:'Management',
}
const FORMAT_RU: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
const LEVEL_RU: Record<string,string>  = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead', any:'Любой' }

function makeTableRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: 'F8FAFC' },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: '64748B' })] })],
      }),
      new TableCell({
        width: { size: 72, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 18 })] })],
      }),
    ],
  })
}

export async function GET(req: NextRequest) {
  const fmt = req.nextUrl.searchParams.get('format') ?? 'xlsx'

  const [{ data: jobs, error }, { data: resumes }] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }),
    supabase.from('resumes').select('*').order('created_at', { ascending: false }),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!jobs) return NextResponse.json({ error: 'No data' }, { status: 404 })

  // ── XLSX ─────────────────────────────────────────────────────────
  if (fmt === 'xlsx') {
    const wb = XLSX.utils.book_new()

    // Лист 1 — Вакансии
    const jobRows = (jobs ?? []).map((j, i) => ({
      '№':             i + 1,
      'Должность':     j.title ?? '—',
      'Компания':      j.company ?? '—',
      'Сфера':         SPHERE_RU[j.sphere] ?? j.sphere ?? '—',
      'Подсфера':      j.sub_sphere ?? '—',
      'Уровень':       LEVEL_RU[j.experience_level] ?? j.experience_level ?? '—',
      'Формат':        FORMAT_RU[j.format] ?? j.format ?? '—',
      'Тип занятости': j.job_type ?? '—',
      'Город':         j.location ?? '—',
      'Зарплата':      fmtSalary(j.salary_min, j.salary_max),
      'Навыки':        (j.skills ?? []).join(', '),
      'Контакт':       j.contact ?? '—',
      'Статус':        j.visible ? 'Опубликовано' : 'На модерации',
      'Источник':      j.source_type ?? '—',
      'Дата':          fmtDate(j.created_at),
    }))
    const wsJobs = XLSX.utils.json_to_sheet(jobRows)
    wsJobs['!cols'] = [
      {wch:4},{wch:36},{wch:22},{wch:14},{wch:20},{wch:10},
      {wch:12},{wch:16},{wch:16},{wch:26},{wch:40},{wch:16},{wch:12},{wch:14},
    ]
    XLSX.utils.book_append_sheet(wb, wsJobs, 'Вакансии')

    // Лист 2 — Резюме
    const resumeRows = (resumes ?? []).map((r, i) => ({
      '№':               i + 1,
      'Имя':             r.name ?? '—',
      'Должность':       r.title ?? '—',
      'Сфера':           SPHERE_RU[r.sphere] ?? r.sphere ?? '—',
      'Подсфера':        r.sub_sphere ?? '—',
      'Опыт (лет)':      r.experience_years ?? '—',
      'Формат':          FORMAT_RU[r.format] ?? r.format ?? '—',
      'Город':           r.location ?? '—',
      'Ожид. зарплата':  r.expected_salary ? `${Number(r.expected_salary).toLocaleString('ru')} ₽` : '—',
      'Навыки':          (r.skills ?? []).join(', '),
      'Telegram':        r.telegram ? `@${r.telegram}` : '—',
      'Email':           r.email_contact ?? '—',
      'Портфолио':       r.portfolio ?? '—',
      'Статус':          r.visible ? 'Опубликовано' : 'На модерации',
      'Дата':            fmtDate(r.created_at),
    }))
    const wsResumes = XLSX.utils.json_to_sheet(resumeRows)
    wsResumes['!cols'] = [
      {wch:4},{wch:24},{wch:28},{wch:14},{wch:20},{wch:10},
      {wch:12},{wch:16},{wch:18},{wch:40},{wch:18},{wch:26},{wch:30},{wch:16},{wch:14},
    ]
    XLSX.utils.book_append_sheet(wb, wsResumes, 'Резюме')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="export_${Date.now()}.xlsx"`,
      },
    })
  }

  // ── DOCX ─────────────────────────────────────────────────────────
  if (fmt === 'docx') {
    const ts = fmtDate(new Date().toISOString())
    const children: any[] = []

    // ─ Раздел: Вакансии ─
    children.push(
      new Paragraph({
        text: `ВакансияРФ — Выгрузка от ${ts}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Вакансии (${(jobs ?? []).length})`, bold: true, size: 24, color: '7C3AED' })],
        spacing: { after: 300 },
      })
    )

    for (const j of (jobs ?? [])) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: j.title ?? '—', bold: true, size: 24 }),
            new TextRun({ text: `  ${j.company ?? ''}`, size: 22, color: '7C3AED' }),
          ],
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Сфера',    SPHERE_RU[j.sphere] ?? j.sphere ?? '—'),
            makeTableRow('Уровень',  LEVEL_RU[j.experience_level] ?? '—'),
            makeTableRow('Формат',   FORMAT_RU[j.format] ?? '—'),
            makeTableRow('Город',    j.location ?? '—'),
            makeTableRow('Зарплата', fmtSalary(j.salary_min, j.salary_max)),
            makeTableRow('Контакт',   j.contact ?? '—'),
            makeTableRow('Telegram',  j.telegram ? `@${j.telegram}` : '—'),
            makeTableRow('Email',     j.email_contact ?? '—'),
            makeTableRow('Статус',   j.visible ? 'Опубликовано' : 'На модерации'),
            makeTableRow('Источник', j.source_type ?? '—'),
            makeTableRow('Дата',     fmtDate(j.created_at)),
          ],
        })
      )
      if (j.skills?.length) children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Навыки: ', bold: true, size: 18, color: '64748B' }),
            new TextRun({ text: j.skills.join(', '), size: 18 }),
          ],
          spacing: { before: 80, after: 60 },
        })
      )
      if (j.description) children.push(
        new Paragraph({
          children: [new TextRun({ text: j.description, size: 18, color: '374151' })],
          spacing: { before: 60, after: 200 },
        })
      )
    }

    // ─ Раздел: Резюме ─
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Резюме (${(resumes ?? []).length})`, bold: true, size: 24, color: '10B981' })],
        spacing: { before: 600, after: 300 },
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: '7C3AED' } },
      })
    )

    for (const r of (resumes ?? [])) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: r.name ?? '—', bold: true, size: 24 }),
            new TextRun({ text: `  ${r.title ?? ''}`, size: 22, color: '10B981' }),
          ],
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' } },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            makeTableRow('Сфера',       SPHERE_RU[r.sphere] ?? r.sphere ?? '—'),
            makeTableRow('Опыт',        r.experience_years ? `${r.experience_years} лет` : '—'),
            makeTableRow('Формат',      FORMAT_RU[r.format] ?? r.format ?? '—'),
            makeTableRow('Город',       r.location ?? '—'),
            makeTableRow('Зарплата',    r.expected_salary ? `${Number(r.expected_salary).toLocaleString('ru')} ₽` : '—'),
            makeTableRow('Telegram',    r.telegram ? `@${r.telegram}` : '—'),
            makeTableRow('Email',       r.email_contact ?? '—'),
            makeTableRow('Портфолио',   r.portfolio ?? '—'),
            makeTableRow('Статус',      r.visible ? 'Опубликовано' : 'На модерации'),
            makeTableRow('Дата',        fmtDate(r.created_at)),
          ],
        })
      )
      if (r.skills?.length) children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Навыки: ', bold: true, size: 18, color: '64748B' }),
            new TextRun({ text: r.skills.join(', '), size: 18 }),
          ],
          spacing: { before: 80, after: 60 },
        })
      )
      if (r.bio) children.push(
        new Paragraph({
          children: [new TextRun({ text: r.bio, size: 18, color: '374151' })],
          spacing: { before: 60, after: 200 },
        })
      )
    }

    const doc = new Document({ sections: [{ properties: {}, children }] })
    const buf = await Packer.toBuffer(doc)

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="export_${Date.now()}.docx"`,
      },
    })
  }

  return NextResponse.json({ error: 'Unknown format' }, { status: 400 })
}
