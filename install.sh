#!/bin/bash
# cd job-marketplace && bash ../fix-views-layout.sh
set -e

# Меняем блок с датой и просмотрами — каждый на своей строке
awk '
/mt-3 pt-3 border-t border-dashed.*flex items-center justify-center gap-3/ {
  print "          <div className=\"mt-3 pt-3 border-t border-dashed border-[#E5E7EB] flex flex-col items-center gap-1\">"
  next
}
{ print }
' "app/jobs/[id]/page.tsx" > /tmp/_job_layout.tsx
mv /tmp/_job_layout.tsx "app/jobs/[id]/page.tsx"

# Убираем разделитель · между датой и просмотрами
awk '
/<span className="text-\[#E5E7EB\]">·<\/span>/ { next }
{ print }
' "app/jobs/[id]/page.tsx" > /tmp/_job_layout2.tsx
mv /tmp/_job_layout2.tsx "app/jobs/[id]/page.tsx"

rm -rf .next
echo "✅ Дата и просмотры теперь на отдельных строках"
echo "npm run dev"