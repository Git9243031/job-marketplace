#!/bin/bash
# cd job-marketplace && bash ../fix-rls-admin-settings.sh
set -e

echo "🔧 Фикс RLS + настройки админки (чистый bash)..."

# ─────────────────────────────────────────────────────────────────
# 1. ADMIN PAGE — полная перезапись settings-таба
#    Читаем текущий файл, вырезаем кусок с settings-табом,
#    вставляем чистую версию без дублей
# ─────────────────────────────────────────────────────────────────

ADMIN_FILE="app/dashboard/admin/page.tsx"

# Добавляем toggleAutoApproveJobs/toggleAutoApproveTelegram если их нет
if ! grep -q "toggleAutoApproveJobs" "$ADMIN_FILE"; then
  # Вставляем после toggleHeader функции
  sed -i "s/const toggleHeader = async () => {/const toggleAutoApproveJobs = async () => {\n    const next = !settings.auto_approve_jobs\n    await supabase.from('settings').update({ auto_approve_jobs: next }).eq('id', 1)\n    setSettings(s => ({ ...s, auto_approve_jobs: next }))\n  }\n  const toggleAutoApproveTelegram = async () => {\n    const next = !settings.auto_approve_telegram\n    await supabase.from('settings').update({ auto_approve_telegram: next }).eq('id', 1)\n    setSettings(s => ({ ...s, auto_approve_telegram: next }))\n  }\n  const toggleHeader = async () => {/" "$ADMIN_FILE"
  echo "✅ toggleAutoApproveJobs\/toggleAutoApproveTelegram добавлены"
fi

# Расширяем state если нужно
if ! grep -q "auto_approve_jobs" "$ADMIN_FILE"; then
  sed -i "s/const \[settings, setSettings\] = useState({ telegram_autopost_enabled: false, header_enabled: true })/const [settings, setSettings] = useState({ telegram_autopost_enabled: false, header_enabled: true, auto_approve_jobs: false, auto_approve_telegram: false })/" "$ADMIN_FILE"
  echo "✅ state settings расширен"
fi

# Расширяем загрузку settings
if ! grep -q "auto_approve_jobs.*data\." "$ADMIN_FILE"; then
  sed -i "s/if (s\.data) setSettings({ telegram_autopost_enabled: s\.data\.telegram_autopost_enabled, header_enabled: s\.data\.header_enabled ?? true })/if (s.data) setSettings({ telegram_autopost_enabled: s.data.telegram_autopost_enabled, header_enabled: s.data.header_enabled ?? true, auto_approve_jobs: s.data.auto_approve_jobs ?? false, auto_approve_telegram: s.data.auto_approve_telegram ?? false })/" "$ADMIN_FILE"
  echo "✅ загрузка settings расширена"
fi

# ─────────────────────────────────────────────────────────────────
# Переписываем settings таб — находим строку начала и конца
# и заменяем всё между ними через временный файл
# ─────────────────────────────────────────────────────────────────

START_LINE=$(grep -n "{tab==='settings' && (" "$ADMIN_FILE" | head -1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
  echo "⚠️  settings таб не найден в $ADMIN_FILE"
else
  echo "📍 settings таб найден на строке $START_LINE"

  # Берём всё ДО settings таба
  head -n $((START_LINE - 1)) "$ADMIN_FILE" > /tmp/admin_before.txt

  # Берём всё ПОСЛЕ settings таба — ищем строку с закрывающим )}
  # settings блок заканчивается на строке с единственным )}, после которой идёт footer/закрытие
  TOTAL=$(wc -l < "$ADMIN_FILE")
  END_LINE=$TOTAL

  # Ищем паттерн закрытия блока settings: строка "      )}" после settings
  AFTER_START=$((START_LINE + 1))
  DEPTH=1
  CUR=$AFTER_START
  while [ $CUR -le $TOTAL ]; do
    LINE_CONTENT=$(sed -n "${CUR}p" "$ADMIN_FILE")
    OPENS=$(echo "$LINE_CONTENT" | tr -cd '(' | wc -c)
    CLOSES=$(echo "$LINE_CONTENT" | tr -cd ')' | wc -c)
    DEPTH=$(( DEPTH + OPENS - CLOSES ))
    if [ $DEPTH -le 0 ]; then
      END_LINE=$CUR
      break
    fi
    CUR=$((CUR + 1))
  done

  echo "📍 settings таб: строки $START_LINE — $END_LINE"

  # Всё после end_line
  tail -n +$((END_LINE + 1)) "$ADMIN_FILE" > /tmp/admin_after.txt

  # Новый settings блок
  cat > /tmp/admin_settings.txt << 'SETTINGS_EOF'
      {tab==='settings' && (
        <div className="max-w-2xl space-y-4">

          {/* Hero-блок */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5 flex items-center gap-2">
                  <Layout size={15}/>Hero-блок на главной
                </h3>
                <p className="text-sm text-[#64748B]">Показывать/скрывать приветственный блок с заголовком и статистикой</p>
                <p className={cn('text-xs mt-1 font-medium', settings.header_enabled ? 'text-green-600' : 'text-[#94A3B8]')}>
                  {settings.header_enabled ? '✅ Виден' : '⛔ Скрыт'}
                </p>
              </div>
              <button onClick={toggleHeader}>
                {settings.header_enabled
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft  size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Автомодерация сайта */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5">🛡 Автомодерация сайта</h3>
                <p className="text-sm text-[#64748B]">Публиковать вакансии сразу без ручного одобрения</p>
                <p className={cn('text-xs mt-1 font-medium', settings.auto_approve_jobs ? 'text-green-600' : 'text-[#94A3B8]')}>
                  {settings.auto_approve_jobs ? '✅ Вкл — вакансии публикуются сразу' : '⛔ Выкл — вакансии ждут модерации'}
                </p>
              </div>
              <button onClick={toggleAutoApproveJobs}>
                {settings.auto_approve_jobs
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft  size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Автопостинг в Telegram */}
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#0F172A] mb-0.5">✈️ Автопостинг в Telegram</h3>
                <p className="text-sm text-[#64748B]">Отправлять новые вакансии в канал при публикации</p>
                <p className={cn('text-xs mt-1 font-medium', settings.auto_approve_telegram ? 'text-green-600' : 'text-[#94A3B8]')}>
                  {settings.auto_approve_telegram ? '✅ Вкл — новые вакансии летят в TG' : '⛔ Выкл — только ручная отправка'}
                </p>
              </div>
              <button onClick={toggleAutoApproveTelegram}>
                {settings.auto_approve_telegram
                  ? <ToggleRight size={40} className="text-[#7C3AED] cursor-pointer hover:opacity-80 transition-opacity"/>
                  : <ToggleLeft  size={40} className="text-[#94A3B8] cursor-pointer hover:opacity-80 transition-opacity"/>
                }
              </button>
            </div>
          </div>

          {/* Env инфо */}
          <div className="bg-[#EDE9FE] rounded-[16px] p-5 text-sm text-[#7C3AED]">
            <p className="font-semibold mb-2">Telegram настройки (.env.local / Vercel)</p>
            <div className="space-y-1 text-[#6D28D9] text-xs font-mono bg-[#DDD6FE]/50 rounded-[8px] p-3">
              <p>TELEGRAM_BOT_TOKEN=...</p>
              <p>TELEGRAM_CHANNEL_ID=@канал</p>
              <p>NEXT_PUBLIC_APP_URL=https://домен.ru</p>
            </div>
          </div>

        </div>
      )}
SETTINGS_EOF

  # Собираем файл
  cat /tmp/admin_before.txt /tmp/admin_settings.txt /tmp/admin_after.txt > "$ADMIN_FILE"
  echo "✅ settings таб перезаписан без дублей"

  # Чистим временные файлы
  rm -f /tmp/admin_before.txt /tmp/admin_settings.txt /tmp/admin_after.txt
fi

# ─────────────────────────────────────────────────────────────────
# 2. SQL для Supabase — выводим и сохраняем в файл
# ─────────────────────────────────────────────────────────────────
cat > /tmp/fix_rls.sql << 'SQL'
-- ═══════════════════════════════════════════════════════
-- Разрешаем анонимным пользователям читать вакансии/резюме
-- ═══════════════════════════════════════════════════════

-- Пересоздаём политику для jobs
DROP POLICY IF EXISTS "jobs_select_visible" ON public.jobs;
CREATE POLICY "jobs_select_visible"
  ON public.jobs FOR SELECT
  USING (visible = true);

-- Пересоздаём политику для resumes
DROP POLICY IF EXISTS "resumes_select_vis" ON public.resumes;
CREATE POLICY "resumes_select_vis"
  ON public.resumes FOR SELECT
  USING (visible = true);

-- Даём права anon роли
GRANT SELECT ON public.jobs     TO anon;
GRANT SELECT ON public.resumes  TO anon;
GRANT SELECT ON public.settings TO anon;

-- Новые колонки для settings (если ещё не добавлены)
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS auto_approve_jobs     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_approve_telegram boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
SQL

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  ⚠️  ВЫПОЛНИ В Supabase → SQL Editor:                           ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
cat /tmp/fix_rls.sql
echo ""
echo "SQL сохранён в /tmp/fix_rls.sql"

rm -rf .next
echo ""
echo "✅ Готово. Выполни SQL выше → затем npm run dev"
