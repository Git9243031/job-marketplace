#!/bin/bash
# cd job-marketplace && bash ../fix-admin-analytics-link.sh
set -e

awk '
/Панель администратора/ && !done {
  print
  print "            <Link href=\"/dashboard/admin/analytics\" className=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#7C3AED] text-xs font-semibold border border-[#7C3AED]/20 transition-colors\">"
  print "              <TrendingUp size={13}/>"
  print "              Аналитика"
  print "            </Link>"
  done=1
  next
}
{ print }
' app/dashboard/admin/page.tsx > /tmp/_admin_patch.tsx
mv /tmp/_admin_patch.tsx app/dashboard/admin/page.tsx

rm -rf .next
echo "✅ Ссылка на /dashboard/admin/analytics добавлена"
echo "npm run dev"