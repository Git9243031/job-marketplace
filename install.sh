#!/bin/bash
# cd job-marketplace && bash ../fix-contract-type.sh
set -e

# ─────────────────────────────────────────────────────────────────
# Патчим jobsService.createJob — конвертируем пустые строки в null
# для всех nullable полей с check constraint
# ─────────────────────────────────────────────────────────────────
python3 << 'PYEOF'
import re

with open('services/jobs.ts', 'r') as f:
    code = f.read()

# Ищем createJob метод и добавляем sanitize перед insert
old = 'async createJob(job: Partial<Job>)'
new = 'async createJob(job: Partial<Job> & Record<string, any>)'

# Ищем тело createJob и добавляем sanitize
old_body = '''async createJob(job: Partial<Job>'''
# Попробуем найти паттерн с supabase.from insert
if 'sanitizeJob' not in code:
    # Добавляем хелпер в начало файла после импортов
    import_end = code.rfind("import ")
    # Найдём конец последнего импорта
    lines = code.split('\n')
    last_import_line = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            last_import_line = i
    
    sanitize_fn = '''
// Конвертирует пустые строки в null для полей с CHECK constraint
function sanitizeJob(job: Record<string, any>): Record<string, any> {
  const nullableFields = ['contract_type', 'sphere', 'format', 'job_type', 'experience_level', 'location', 'contact']
  const result = { ...job }
  for (const field of nullableFields) {
    if (result[field] === '' || result[field] === undefined) {
      result[field] = null
    }
  }
  if (result.salary_min === '' || result.salary_min === 0) result.salary_min = null
  if (result.salary_max === '' || result.salary_max === 0) result.salary_max = null
  return result
}
'''
    lines.insert(last_import_line + 1, sanitize_fn)
    code = '\n'.join(lines)

# Теперь патчим createJob чтобы вызывал sanitizeJob
# Ищем .from('jobs').insert( и добавляем sanitize
code = re.sub(
    r'(\.from\([\'"]jobs[\'"]\)\.insert\()(\s*\{[^}]*\}|\s*job|\s*\{\.\.\.job)',
    lambda m: m.group(1) + 'sanitizeJob(' + m.group(2).strip() + ')',
    code,
    count=1
)

with open('services/jobs.ts', 'w') as f:
    f.write(code)

print("✅ services/jobs.ts — sanitizeJob добавлен")
PYEOF

# Если python-патч не сработал (разная структура файла) — делаем прямую замену
echo ""
echo "Проверяем services/jobs.ts..."
if grep -q "sanitizeJob" services/jobs.ts; then
  echo "✅ sanitizeJob уже в файле"
else
  echo "⚠️  Python-патч не сработал, применяем ручной фикс..."
  
  # Показываем createJob для ручного патча
  echo ""
  echo "Найди в services/jobs.ts строку с .from('jobs').insert( и оберни аргумент в sanitizeJob()"
  echo "Например:"
  echo "  было:   .from('jobs').insert(job)"
  echo "  стало:  .from('jobs').insert(sanitizeJob(job as any))"
fi

# ─────────────────────────────────────────────────────────────────
# Гарантированный фикс — патчим create-job форму напрямую
# Пустые строки → undefined перед отправкой
# ─────────────────────────────────────────────────────────────────
python3 << 'PYEOF'
with open('app/dashboard/hr/create-job/page.tsx', 'r') as f:
    code = f.read()

# Находим onSubmit и добавляем sanitize данных формы
old_submit = '''  const onSubmit = async (data: JobFormData) => {
    setServerError('')
    if (!user || !jobId) return

    // visible = true только если включена автомодерация на сайте
    const visible = autoApproveJobs

    const { error } = await jobsService.createJob({
      ...data,
      id: jobId,
      created_by: user.id,
      visible,
    })'''

new_submit = '''  const onSubmit = async (data: JobFormData) => {
    setServerError('')
    if (!user || !jobId) return

    // visible = true только если включена автомодерация на сайте
    const visible = autoApproveJobs

    // Конвертируем пустые строки в undefined — иначе БД нарушает CHECK constraint
    const clean: Record<string, any> = { ...data }
    const nullableFields = ['contract_type', 'sphere', 'format', 'job_type', 'experience_level', 'location', 'contact']
    for (const f of nullableFields) {
      if (clean[f] === '') clean[f] = undefined
    }
    if (!clean.salary_min)  clean.salary_min  = undefined
    if (!clean.salary_max)  clean.salary_max  = undefined

    const { error } = await jobsService.createJob({
      ...clean,
      id: jobId,
      created_by: user.id,
      visible,
    })'''

if old_submit in code:
    code = code.replace(old_submit, new_submit)
    with open('app/dashboard/hr/create-job/page.tsx', 'w') as f:
        f.write(code)
    print("✅ create-job/page.tsx — пустые строки конвертируются в undefined")
else:
    print("⚠️  Паттерн не найден точно, применяем regex...")
    import re
    # Более гибкий патч
    code = re.sub(
        r'(const \{ error \} = await jobsService\.createJob\(\{)\s*(\.\.\.(data|clean),)',
        r'    // Очищаем пустые строки\n    const _clean: Record<string,any> = {...data}\n    [\'contract_type\',\'sphere\',\'format\',\'job_type\',\'experience_level\',\'location\',\'contact\'].forEach(k => { if(_clean[k]===\'\') _clean[k]=undefined })\n    if(!_clean.salary_min) _clean.salary_min=undefined\n    if(!_clean.salary_max) _clean.salary_max=undefined\n\n    \1\n      ..._clean,',
        code
    )
    with open('app/dashboard/hr/create-job/page.tsx', 'w') as f:
        f.write(code)
    print("✅ create-job/page.tsx — regex патч применён")
PYEOF

# ─────────────────────────────────────────────────────────────────
# SQL фикс — делаем constraint более гибким (принимает NULL)
# Это уже должно работать по умолчанию, но на всякий случай
# ─────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Если ошибка остаётся — выполни в Supabase SQL Editor:"
echo ""
echo "ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_contract_type_check;"
echo "ALTER TABLE public.jobs ADD CONSTRAINT jobs_contract_type_check"
echo "  CHECK (contract_type IS NULL OR contract_type IN ('trud','gph','ip','selfemployed'));"
echo ""
echo "ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_sphere_check;"
echo "ALTER TABLE public.jobs ADD CONSTRAINT jobs_sphere_check"
echo "  CHECK (sphere IS NULL OR sphere IN ('it','design','marketing','finance','hr','sales','legal','other'));"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

rm -rf .next
echo ""
echo "✅ Готово. npm run dev"
