export type JobLevel   = 'junior'|'middle'|'senior'|'lead'
export type JobFormat  = 'remote'|'office'|'hybrid'
export type JobType    = 'full-time'|'part-time'|'contract'|'freelance'|'internship'
export type JobSphere  = 'it'|'design'|'marketing'|'finance'|'hr'|'sales'|'legal'|'other'

export interface Job {
  id: string; slug: string; title: string; company: string
  location: string; format: JobFormat; level: JobLevel
  jobType: JobType; sphere: JobSphere
  salaryMin?: number; salaryMax?: number; salaryCurrency: string
  tags: string[]; description: string
  isHot: boolean; isFeatured: boolean; postedAt: string; visible: boolean
}

export const mockJobs: Job[] = [
  { id:'1', slug:'senior-frontend-yandex', title:'Senior Frontend Developer', company:'Яндекс', location:'Москва', format:'hybrid', level:'senior', jobType:'full-time', sphere:'it', salaryMin:300000, salaryMax:450000, salaryCurrency:'RUB', tags:['React','TypeScript','Next.js','GraphQL'], description:'Разрабатывайте сервисы которыми пользуются миллионы людей каждый день.', isHot:true, isFeatured:true, postedAt:'2025-01-20T10:00:00Z', visible:true },
  { id:'2', slug:'backend-go-sber', title:'Backend Go Developer', company:'Сбер', location:'Москва', format:'office', level:'middle', jobType:'full-time', sphere:'it', salaryMin:200000, salaryMax:280000, salaryCurrency:'RUB', tags:['Go','Kubernetes','PostgreSQL','gRPC'], description:'Проектируйте высоконагруженные системы для крупнейшего банка России.', isHot:true, isFeatured:false, postedAt:'2025-01-19T09:00:00Z', visible:true },
  { id:'3', slug:'product-designer-avito', title:'Product Designer', company:'Авито', location:'Москва', format:'hybrid', level:'middle', jobType:'full-time', sphere:'design', salaryMin:180000, salaryMax:250000, salaryCurrency:'RUB', tags:['Figma','UX Research','Prototyping','Design System'], description:'Создавайте удобный интерфейс для 50 млн пользователей Авито.', isHot:false, isFeatured:true, postedAt:'2025-01-18T11:00:00Z', visible:true },
  { id:'4', slug:'junior-python-ozon', title:'Junior Python Developer', company:'Ozon', location:'Санкт-Петербург', format:'remote', level:'junior', jobType:'full-time', sphere:'it', salaryMin:80000, salaryMax:120000, salaryCurrency:'RUB', tags:['Python','Django','PostgreSQL','Docker'], description:'Хороший старт карьеры в одной из крупнейших e-commerce компаний.', isHot:false, isFeatured:false, postedAt:'2025-01-17T14:00:00Z', visible:true },
  { id:'5', slug:'devops-vk', title:'DevOps Engineer', company:'VK', location:'Москва', format:'hybrid', level:'senior', jobType:'full-time', sphere:'it', salaryMin:280000, salaryMax:380000, salaryCurrency:'RUB', tags:['Kubernetes','Terraform','AWS','CI/CD','Ansible'], description:'Обеспечивайте стабильность инфраструктуры крупнейшей соцсети Рунета.', isHot:true, isFeatured:false, postedAt:'2025-01-16T08:00:00Z', visible:true },
  { id:'6', slug:'lead-android-tinkoff', title:'Lead Android Developer', company:'Тинькофф', location:'Москва', format:'office', level:'lead', jobType:'full-time', sphere:'it', salaryMin:400000, salaryMax:600000, salaryCurrency:'RUB', tags:['Kotlin','Jetpack Compose','Android','Coroutines'], description:'Руководите разработкой мобильного приложения с 20 млн пользователей.', isHot:true, isFeatured:true, postedAt:'2025-01-15T10:00:00Z', visible:true },
  { id:'7', slug:'ux-researcher-hh', title:'UX Researcher', company:'hh.ru', location:'Москва', format:'remote', level:'middle', jobType:'full-time', sphere:'design', salaryMin:140000, salaryMax:190000, salaryCurrency:'RUB', tags:['UX Research','Usability Testing','Interviews','Analytics'], description:'Изучайте поведение пользователей и влияйте на продукт которым пользуется вся страна.', isHot:false, isFeatured:false, postedAt:'2025-01-14T12:00:00Z', visible:true },
  { id:'8', slug:'marketing-lead-wb', title:'Performance Marketing Lead', company:'Wildberries', location:'Москва', format:'office', level:'lead', jobType:'full-time', sphere:'marketing', salaryMin:250000, salaryMax:350000, salaryCurrency:'RUB', tags:['Performance Marketing','Google Ads','MyTarget','Analytics'], description:'Управляйте платным трафиком крупнейшего маркетплейса России.', isHot:false, isFeatured:true, postedAt:'2025-01-13T09:00:00Z', visible:true },
  { id:'9', slug:'ios-kaspersky', title:'iOS Developer', company:'Kaspersky', location:'Москва', format:'hybrid', level:'middle', jobType:'full-time', sphere:'it', salaryMin:200000, salaryMax:270000, salaryCurrency:'RUB', tags:['Swift','UIKit','SwiftUI','Security'], description:'Разрабатывайте мобильные приложения для кибербезопасности.', isHot:false, isFeatured:false, postedAt:'2025-01-12T11:00:00Z', visible:true },
  { id:'10', slug:'data-scientist-sber', title:'Data Scientist', company:'Сбер AI', location:'Москва', format:'hybrid', level:'senior', jobType:'full-time', sphere:'it', salaryMin:320000, salaryMax:420000, salaryCurrency:'RUB', tags:['Python','ML','PyTorch','LLM','NLP'], description:'Работайте над задачами NLP и LLM в исследовательской лаборатории.', isHot:true, isFeatured:true, postedAt:'2025-01-11T10:00:00Z', visible:true },
  { id:'11', slug:'hr-bp-mail', title:'HR Business Partner', company:'VK / Mail.ru', location:'Москва', format:'office', level:'senior', jobType:'full-time', sphere:'hr', salaryMin:160000, salaryMax:220000, salaryCurrency:'RUB', tags:['HR','Talent Management','OKR','L&D'], description:'Партнёрьтесь с топ-менеджментом и стройте культуру продуктовой компании.', isHot:false, isFeatured:false, postedAt:'2025-01-10T09:00:00Z', visible:true },
  { id:'12', slug:'fullstack-edtech', title:'Fullstack Developer (React + Node)', company:'EdTech стартап', location:'Удалённо', format:'remote', level:'middle', jobType:'full-time', sphere:'it', salaryMin:150000, salaryMax:200000, salaryCurrency:'RUB', tags:['React','Node.js','TypeScript','MongoDB'], description:'Строим образовательную платформу нового поколения. Полная удалёнка.', isHot:false, isFeatured:false, postedAt:'2025-01-09T14:00:00Z', visible:true },
  { id:'13', slug:'financial-analyst-raiff', title:'Финансовый аналитик', company:'Райффайзен Банк', location:'Москва', format:'office', level:'middle', jobType:'full-time', sphere:'finance', salaryMin:130000, salaryMax:170000, salaryCurrency:'RUB', tags:['Excel','SQL','Power BI','МСФО'], description:'Анализируйте финансовые потоки и поддерживайте стратегические решения банка.', isHot:false, isFeatured:false, postedAt:'2025-01-08T10:00:00Z', visible:true },
  { id:'14', slug:'qa-automation-2gis', title:'QA Automation Engineer', company:'2GIS', location:'Новосибирск', format:'hybrid', level:'middle', jobType:'full-time', sphere:'it', salaryMin:160000, salaryMax:210000, salaryCurrency:'RUB', tags:['Python','Selenium','Pytest','CI/CD','Allure'], description:'Автоматизируйте тестирование геосервисов которыми пользуются города.', isHot:false, isFeatured:false, postedAt:'2025-01-07T11:00:00Z', visible:true },
  { id:'15', slug:'react-native-contract', title:'React Native Developer', company:'Финтех стартап', location:'Удалённо', format:'remote', level:'middle', jobType:'contract', sphere:'it', salaryMin:200000, salaryMax:280000, salaryCurrency:'RUB', tags:['React Native','TypeScript','Redux','Expo'], description:'Контракт 6 месяцев, возможно продление. Разработка мобильного банка.', isHot:false, isFeatured:false, postedAt:'2025-01-06T09:00:00Z', visible:true },
  { id:'16', slug:'smm-lamoda', title:'SMM Менеджер', company:'Lamoda', location:'Москва', format:'hybrid', level:'junior', jobType:'full-time', sphere:'marketing', salaryMin:70000, salaryMax:100000, salaryCurrency:'RUB', tags:['SMM','Instagram','Telegram','Reels','Контент'], description:'Ведите социальные сети крупнейшего fashion-маркетплейса.', isHot:false, isFeatured:false, postedAt:'2025-01-05T10:00:00Z', visible:true },
  { id:'17', slug:'cto-b2b-saas', title:'CTO / Технический директор', company:'B2B SaaS', location:'Москва', format:'hybrid', level:'lead', jobType:'full-time', sphere:'it', salaryMin:500000, salaryMax:700000, salaryCurrency:'RUB', tags:['Architecture','Team Lead','AWS','Microservices','Strategy'], description:'Возглавьте технологическую команду быстрорастущей B2B компании.', isHot:true, isFeatured:true, postedAt:'2025-01-04T08:00:00Z', visible:true },
  { id:'18', slug:'intern-design-yandex', title:'Стажёр — Product Design', company:'Яндекс', location:'Москва', format:'office', level:'junior', jobType:'internship', sphere:'design', salaryMin:60000, salaryMax:80000, salaryCurrency:'RUB', tags:['Figma','UI Design','Стажировка'], description:'Летняя стажировка для студентов старших курсов дизайнерских специальностей.', isHot:false, isFeatured:false, postedAt:'2025-01-03T10:00:00Z', visible:true },
  { id:'19', slug:'b2b-sales', title:'B2B Sales Manager', company:'IT компания', location:'Санкт-Петербург', format:'office', level:'middle', jobType:'full-time', sphere:'sales', salaryMin:100000, salaryMax:180000, salaryCurrency:'RUB', tags:['B2B Sales','CRM','Cold Outreach','SaaS'], description:'Продавайте корпоративное ПО крупным клиентам. Высокий бонус за KPI.', isHot:false, isFeatured:false, postedAt:'2025-01-02T09:00:00Z', visible:true },
  { id:'20', slug:'copywriter-remote', title:'Копирайтер (частичная занятость)', company:'Digital-агентство', location:'Удалённо', format:'remote', level:'junior', jobType:'part-time', sphere:'marketing', salaryMin:50000, salaryMax:80000, salaryCurrency:'RUB', tags:['Копирайтинг','SEO','Контент','Тексты'], description:'Пишите SEO-тексты и статьи для клиентов агентства. Гибкий график.', isHot:false, isFeatured:false, postedAt:'2025-01-01T10:00:00Z', visible:true },
]

export const JOBS_PER_PAGE = 9

export const SPHERES = [
  { value:'all',       label:'Все сферы'    },
  { value:'it',        label:'IT'           },
  { value:'design',    label:'Дизайн'       },
  { value:'marketing', label:'Маркетинг'    },
  { value:'finance',   label:'Финансы'      },
  { value:'hr',        label:'HR'           },
  { value:'sales',     label:'Продажи'      },
  { value:'legal',     label:'Юриспруденция'},
  { value:'other',     label:'Другое'       },
] as const

export const LEVELS = [
  { value:'all',    label:'Любой уровень'     },
  { value:'junior', label:'Junior'             },
  { value:'middle', label:'Middle'             },
  { value:'senior', label:'Senior'             },
  { value:'lead',   label:'Lead / Team Lead'   },
] as const

export const FORMATS = [
  { value:'all',    label:'Любой формат' },
  { value:'remote', label:'Удалённо'     },
  { value:'office', label:'Офис'         },
  { value:'hybrid', label:'Гибрид'       },
] as const

export const JOB_TYPES = [
  { value:'all',         label:'Любой тип'           },
  { value:'full-time',   label:'Полная занятость'     },
  { value:'part-time',   label:'Частичная занятость'  },
  { value:'contract',    label:'Контракт'             },
  { value:'freelance',   label:'Фриланс'              },
  { value:'internship',  label:'Стажировка'           },
] as const

export const SALARY_OPTIONS = [
  { value:0,       label:'Любая зарплата'  },
  { value:50000,   label:'от 50 000 ₽'    },
  { value:100000,  label:'от 100 000 ₽'   },
  { value:150000,  label:'от 150 000 ₽'   },
  { value:200000,  label:'от 200 000 ₽'   },
  { value:300000,  label:'от 300 000 ₽'   },
] as const

export const FORMAT_LABELS: Record<string,string> = { remote:'Удалённо', office:'Офис', hybrid:'Гибрид' }
export const LEVEL_LABELS: Record<string,string>  = { junior:'Junior', middle:'Middle', senior:'Senior', lead:'Lead / Team Lead' }
export const SPHERE_LABELS: Record<string,string> = { it:'IT', design:'Дизайн', marketing:'Маркетинг', finance:'Финансы', hr:'HR', sales:'Продажи', legal:'Юриспруденция', other:'Другое' }

export function filterJobs(jobs: Job[], f: {
  q?:string; sphere?:string; level?:string; format?:string
  jobType?:string; salaryMin?:number; hot?:boolean; featured?:boolean
}) {
  return jobs.filter(j => {
    if (!j.visible) return false
    if (f.q) { const q=f.q.toLowerCase(); if (!j.title.toLowerCase().includes(q) && !j.company.toLowerCase().includes(q) && !j.tags.some(t=>t.toLowerCase().includes(q)) && !j.location.toLowerCase().includes(q)) return false }
    if (f.sphere   && f.sphere   !== 'all' && j.sphere   !== f.sphere)   return false
    if (f.level    && f.level    !== 'all' && j.level    !== f.level)     return false
    if (f.format   && f.format   !== 'all' && j.format   !== f.format)    return false
    if (f.jobType  && f.jobType  !== 'all' && j.jobType  !== f.jobType)   return false
    if (f.salaryMin && f.salaryMin > 0 && (j.salaryMin||0) < f.salaryMin) return false
    if (f.hot      && !j.isHot)      return false
    if (f.featured && !j.isFeatured) return false
    return true
  })
}
