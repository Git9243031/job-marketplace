import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'ВакансияРФ — Найдите работу мечты',
  description: 'Тысячи вакансий от лучших компаний России.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning>
        <Navbar />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
        <footer className="border-t border-[#E5E7EB] bg-white mt-8">
          <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#7C3AED] rounded-md flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M20 7H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9 8H4v-2h7v2zm9 0h-7v-2h7v2zm0-4H4V9h16v2z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#0F172A]">ВакансияРФ</span>
            </div>
            <p className="text-xs text-[#94A3B8]">© 2025 ВакансияРФ. Все права защищены.</p>
            <div className="flex gap-5 text-xs text-[#64748B]">
              <a href="/"             className="hover:text-[#7C3AED] transition-colors">Вакансии</a>
              <a href="/resumes"      className="hover:text-[#7C3AED] transition-colors">Резюме</a>
              <a href="/auth/register" className="hover:text-[#7C3AED] transition-colors">Разместить вакансию</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
