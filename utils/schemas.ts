import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
})

export const registerSchema = z.object({
  email:    z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  role:     z.enum(['candidate','hr']),
})

export const jobSchema = z.object({
  title:            z.string().min(3, 'Минимум 3 символа'),
  company:          z.string().min(2, 'Укажите компанию'),
  description:      z.string().min(30, 'Минимум 30 символов'),
  sphere:           z.string().optional(),
  location:         z.string().optional(),
  format:           z.string().optional(),
  experience_level: z.string().optional(),
  job_type:         z.string().optional(),
  contract_type:    z.string().optional(),
  salary_min:       z.coerce.number().optional(),
  salary_max:       z.coerce.number().optional(),
  skills:           z.array(z.string()).default([]),
  tags:             z.array(z.string()).default([]),
  contact:       z.string().optional(),
  telegram:      z.string().optional(),
  email_contact: z.string().email('Некорректный email').optional().or(z.literal('')),
})

export const resumeSchema = z.object({
  name:             z.string().min(2, 'Укажите имя'),
  title:            z.string().min(3, 'Укажите должность'),
  bio:              z.string().optional(),
  sphere:           z.string().optional(),
  location:         z.string().optional(),
  format:           z.string().optional(),
  experience_years: z.coerce.number().min(0).max(50).default(0),
  portfolio:        z.string().url('Введите корректный URL').optional().or(z.literal('')),
  expected_salary:  z.coerce.number().optional(),
  skills:           z.array(z.string()).default([]),
})

export type LoginFormData    = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type JobFormData      = z.infer<typeof jobSchema>
export type ResumeFormData   = z.infer<typeof resumeSchema>
