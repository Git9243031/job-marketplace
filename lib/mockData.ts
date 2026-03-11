export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  sphere: string;
  experience_level: string;
  format: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
  skills: string[];
  contact?: string;
  created_at: string;
  visible: boolean;
}

export interface Resume {
  id: string;
  name: string;
  title: string;
  bio?: string;
  sphere: string;
  experience_years: number;
  format: string;
  expected_salary?: number;
  location?: string;
  skills: string[];
  created_at: string;
  visible: boolean;
}

export const MOCK_JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Frontend Developer (React)",
    company: "Яндекс",
    description: "Разработка новых фич для Яндекс.Маркета. Оптимизация производительности React-приложений.",
    sphere: "it",
    experience_level: "senior",
    format: "hybrid",
    job_type: "full-time",
    salary_min: 280000,
    salary_max: 380000,
    location: "Москва",
    skills: ["React", "TypeScript", "Redux", "Jest"],
    contact: "hr@yandex.ru",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    visible: true,
  },
  {
    id: "j2",
    title: "Middle Backend Developer (Go)",
    company: "Сбер",
    description: "Разработка микросервисов на Go. Проектирование API (gRPC, REST).",
    sphere: "it",
    experience_level: "middle",
    format: "hybrid",
    job_type: "full-time",
    salary_min: 200000,
    salary_max: 280000,
    location: "Москва",
    skills: ["Go", "gRPC", "Kafka", "PostgreSQL"],
    contact: "jobs@sber.ru",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    visible: true,
  },
  {
    id: "j3",
    title: "UX/UI Designer",
    company: "Авито",
    description: "Проектирование интерфейсов для мобильных и веб-приложений.",
    sphere: "design",
    experience_level: "middle",
    format: "remote",
    job_type: "full-time",
    salary_min: 150000,
    salary_max: 220000,
    location: "Удалённо",
    skills: ["Figma", "UX Research", "Prototyping"],
    contact: "design@avito.ru",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    visible: true,
  },
];

export const MOCK_RESUMES: Resume[] = [
  {
    id: "r1",
    name: "Алексей Петров",
    title: "Senior React Developer",
    bio: "5 лет опыта в разработке высоконагруженных SPA",
    sphere: "it",
    experience_years: 5,
    format: "remote",
    expected_salary: 280000,
    location: "Москва",
    skills: ["React", "TypeScript", "Redux", "GraphQL"],
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    visible: true,
  },
];

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "";
  if (min && max) return `${min.toLocaleString("ru-RU")} – ${max.toLocaleString("ru-RU")} ₽`;
  if (min) return `от ${min.toLocaleString("ru-RU")} ₽`;
  return `до ${max?.toLocaleString("ru-RU")} ₽`;
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  return `${Math.floor(days / 30)} мес. назад`;
}
