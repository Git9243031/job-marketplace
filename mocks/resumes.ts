import type { JobSphere } from './jobs'

export interface Resume {
  id: string; slug: string; name: string; title: string
  location: string; format: string; level: string; sphere: JobSphere
  expectedSalary?: number; skills: string[]; bio: string
  experienceYears: number; portfolio?: string
  available: boolean; createdAt: string
}

export const mockResumes: Resume[] = [
  { id:'r1', slug:'ivan-petrov-dev', name:'Иван Петров', title:'Senior React Developer', location:'Москва', format:'remote', level:'senior', sphere:'it', expectedSalary:350000, skills:['React','TypeScript','Next.js','Redux','GraphQL'], bio:'5 лет в продуктовых компаниях. Строил SPA от нуля до 1M DAU. Люблю чистый код и атомарный дизайн.', experienceYears:5, portfolio:'https://github.com/ivanpetrov', available:true, createdAt:'2025-01-20T10:00:00Z' },
  { id:'r2', slug:'anna-smirnova-design', name:'Анна Смирнова', title:'Product Designer', location:'Санкт-Петербург', format:'hybrid', level:'middle', sphere:'design', expectedSalary:200000, skills:['Figma','UX Research','Prototyping','Design System','Framer'], bio:'Проектирую интерфейсы с фокусом на пользователя. 3 года в дизайн-системах.', experienceYears:3, portfolio:'https://behance.net/annasmirnova', available:true, createdAt:'2025-01-19T09:00:00Z' },
  { id:'r3', slug:'dmitry-kozlov-ml', name:'Дмитрий Козлов', title:'ML Engineer', location:'Москва', format:'hybrid', level:'senior', sphere:'it', expectedSalary:400000, skills:['Python','PyTorch','TensorFlow','MLOps','Docker'], bio:'Специалист по CV и NLP. Работал в Яндексе и Mail.ru. Публикации на NeurIPS.', experienceYears:6, portfolio:'https://kaggle.com/dkozlov', available:true, createdAt:'2025-01-18T11:00:00Z' },
  { id:'r4', slug:'maria-volkova-hr', name:'Мария Волкова', title:'HR Business Partner', location:'Москва', format:'office', level:'senior', sphere:'hr', expectedSalary:180000, skills:['Рекрутинг','HRIS','OKR','L&D','Employer Branding'], bio:'7 лет в HR tech-компаний. Выстроила процессы найма с 0 до 500 человек.', experienceYears:7, available:true, createdAt:'2025-01-17T14:00:00Z' },
  { id:'r5', slug:'alexey-novikov-backend', name:'Алексей Новиков', title:'Backend Go Developer', location:'Новосибирск', format:'remote', level:'middle', sphere:'it', expectedSalary:220000, skills:['Go','PostgreSQL','Redis','gRPC','Kubernetes'], bio:'Разрабатываю высоконагруженные микросервисы на Go. Опыт в финтехе.', experienceYears:4, available:true, createdAt:'2025-01-16T08:00:00Z' },
  { id:'r6', slug:'olga-fadeeva-marketing', name:'Ольга Фадеева', title:'Performance Marketing Manager', location:'Москва', format:'remote', level:'middle', sphere:'marketing', expectedSalary:160000, skills:['Google Ads','Facebook Ads','Analytics','CPA','Retargeting'], bio:'Управляю платным трафиком с ROI >300%. 4 года в e-commerce и SaaS.', experienceYears:4, available:true, createdAt:'2025-01-15T10:00:00Z' },
  { id:'r7', slug:'nikita-sorokin-ios', name:'Никита Сорокин', title:'iOS Developer', location:'Казань', format:'remote', level:'junior', sphere:'it', expectedSalary:100000, skills:['Swift','SwiftUI','Combine','UIKit','CoreData'], bio:'Выпускник ВУЗа, год коммерческого опыта. Ищу первую полноценную позицию.', experienceYears:1, available:true, createdAt:'2025-01-14T12:00:00Z' },
  { id:'r8', slug:'elena-guseva-finance', name:'Елена Гусева', title:'Финансовый аналитик', location:'Москва', format:'office', level:'middle', sphere:'finance', expectedSalary:150000, skills:['Excel','SQL','Power BI','МСФО','1С'], bio:'Строю финансовые модели и дашборды. Опыт в банкинге и производстве.', experienceYears:5, available:true, createdAt:'2025-01-13T09:00:00Z' },
]

export const RESUME_SPHERES = [
  { value:'all', label:'Все сферы' },
  { value:'it', label:'IT' }, { value:'design', label:'Дизайн' },
  { value:'marketing', label:'Маркетинг' }, { value:'finance', label:'Финансы' },
  { value:'hr', label:'HR' }, { value:'sales', label:'Продажи' },
  { value:'legal', label:'Юриспруденция' }, { value:'other', label:'Другое' },
] as const

export const RESUME_LEVELS = [
  { value:'all', label:'Любой уровень' },
  { value:'junior', label:'Junior' }, { value:'middle', label:'Middle' },
  { value:'senior', label:'Senior' }, { value:'lead', label:'Lead' },
] as const

export const RESUME_FORMATS = [
  { value:'all', label:'Любой формат' },
  { value:'remote', label:'Удалённо' }, { value:'office', label:'Офис' },
  { value:'hybrid', label:'Гибрид' },
] as const

export const RESUME_SALARY_MAX = [
  { value:0, label:'Любая зарплата' },
  { value:100000, label:'до 100 000 ₽' },
  { value:150000, label:'до 150 000 ₽' },
  { value:200000, label:'до 200 000 ₽' },
  { value:300000, label:'до 300 000 ₽' },
] as const

export function filterResumes(resumes: Resume[], f: {
  q?:string; sphere?:string; level?:string; format?:string; salaryMax?:number
}) {
  return resumes.filter(r => {
    if (f.q) { const q=f.q.toLowerCase(); if (!r.name.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q) && !r.skills.some(s=>s.toLowerCase().includes(q)) && !r.location.toLowerCase().includes(q)) return false }
    if (f.sphere && f.sphere !== 'all' && r.sphere !== f.sphere) return false
    if (f.level  && f.level  !== 'all' && r.level  !== f.level)  return false
    if (f.format && f.format !== 'all' && r.format !== f.format) return false
    if (f.salaryMax && f.salaryMax > 0 && (r.expectedSalary||0) > f.salaryMax) return false
    return true
  })
}
