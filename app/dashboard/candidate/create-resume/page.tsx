"use client";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { resumesService } from "@/services/resumes";
import { FormInput } from "@/components/forms/FormInput";
import { FormSelect } from "@/components/forms/FormSelect";
import { TagInput } from "@/components/forms/TagInput";
import { cn } from "@/lib/utils";
import { SPHERE_TREE } from "@/components/jobs/JobFilters";

const schema = z
  .object({
    name: z.string().min(2, "Введите имя"),
    title: z.string().min(3, "Введите должность"),
    experience_years: z.coerce.number().min(0).max(50).default(0),
    expected_salary: z.coerce.number().optional(),
    location: z.string().optional(),
    bio: z.string().optional(),
    portfolio: z.string().optional(),
    telegram: z.string().optional(),
    email_contact: z
      .string()
      .email("Некорректный email")
      .optional()
      .or(z.literal("")),
    skills: z.array(z.string()).default([]),
  })
  .refine((data) => data.telegram || data.email_contact, {
    message: "Укажите хотя бы один способ связи (Telegram или Email)",
    path: ["telegram"],
  });
type FormData = z.infer<typeof schema>;

const FORMATS = [
  { value: "", label: "Формат" },
  { value: "remote", label: "Удалённо" },
  { value: "office", label: "Офис" },
  { value: "hybrid", label: "Гибрид" },
];

// ── Модалка выбора сферы ─────────────────────────────────────────
function SpherePickerModal({
  open,
  onClose,
  sphere,
  subSphere,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  sphere: string;
  subSphere: string;
  onChange: (sphere: string, subSphere: string) => void;
}) {
  const [activeSphere, setActiveSphere] = useState(sphere || "it");

  useEffect(() => {
    if (open) setActiveSphere(sphere || "it");
  }, [open, sphere]);
  if (!open) return null;

  const currentNode = SPHERE_TREE.find((s) => s.value === activeSphere);
  const selectedSubs = subSphere ? subSphere.split(",").filter(Boolean) : [];

  const toggleSub = (val: string) => {
    const next = selectedSubs.includes(val)
      ? selectedSubs.filter((v) => v !== val)
      : [...selectedSubs, val];
    onChange(activeSphere, next.join(","));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white rounded-[20px] shadow-[0_24px_60px_rgba(0,0,0,0.15)] w-full max-w-[660px] flex flex-col overflow-hidden"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <h2 className="text-base font-semibold text-[#0F172A]">
            Выбор сферы
          </h2>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-48 border-r border-[#F1F5F9] overflow-y-auto py-2 shrink-0">
            {SPHERE_TREE.map((s) => (
              <button
                key={s.value}
                onClick={() => {
                  setActiveSphere(s.value);
                  onChange(s.value, "");
                }}
                className={cn(
                  "w-full text-left px-5 py-2.5 text-sm transition-colors flex items-center justify-between",
                  activeSphere === s.value
                    ? "font-semibold text-[#0F172A] bg-[#F8FAFC]"
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]",
                )}
              >
                {s.label}
                {s.children && (
                  <ChevronRight size={12} className="text-[#CBD5E1]" />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {currentNode?.children ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[#0F172A]">
                    {currentNode.label}
                  </span>
                  <button
                    onClick={() =>
                      onChange(
                        activeSphere,
                        currentNode.children!.map((c) => c.value).join(","),
                      )
                    }
                    className="text-xs font-medium text-[#7C3AED] hover:underline"
                  >
                    Выбрать все
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentNode.children.map((child) => (
                    <button
                      key={child.value}
                      onClick={() => toggleSub(child.value)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all",
                        selectedSubs.includes(child.value)
                          ? "bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]"
                          : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#DDD6FE] hover:text-[#7C3AED]",
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-[#94A3B8]">
                Нет подкатегорий
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F1F5F9]">
          <button
            onClick={() => onChange("", "")}
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Сбросить
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-[10px] hover:bg-[#6D28D9] transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}

function SpherePicker({
  sphere,
  subSphere,
  onClick,
}: {
  sphere: string;
  subSphere: string;
  onClick: () => void;
}) {
  const node = SPHERE_TREE.find((s) => s.value === sphere);
  const subs = subSphere ? subSphere.split(",").filter(Boolean) : [];
  const label = !sphere
    ? "Выберите сферу"
    : subs.length === 1
      ? `${node?.label} — ${node?.children?.find((c) => c.value === subs[0])?.label ?? subs[0]}`
      : subs.length > 1
        ? `${node?.label} (${subs.length} специализации)`
        : node?.label;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-2.5 rounded-[10px] border text-sm transition-all",
        sphere
          ? "border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] font-medium"
          : "border-[#E5E7EB] bg-white text-[#94A3B8] hover:border-[#7C3AED]/40",
      )}
    >
      <span>{label}</span>
      <ChevronRight size={14} className="text-[#CBD5E1] shrink-0" />
    </button>
  );
}

export default function CreateResumePage() {
  const [user, setUser] = useState<any>(null);
  const [sphere, setSphere] = useState("");
  const [subSphere, setSubSphere] = useState("");
  const [format, setFormat] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [publishImmediately, setPublishImmediately] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/auth/login");
        return;
      }
      const { data: u } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();
      if (!u || u.role !== "candidate") {
        router.push("/");
        return;
      }
      setUser(u);
    });
  }, [router]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { skills: [], experience_years: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    if (!user) return;

    try {
      const { error } = await resumesService.createResume({
        ...data,
        email_contact: data.email_contact || null,
        telegram: data.telegram || null,
        sphere: sphere || null,
        sub_sphere: subSphere || null,
        format: format || null,
        user_id: user.id,
        visible: publishImmediately, // true = сразу в базу, false = на модерацию
      });

      if (error) throw error;

      router.push("/dashboard/candidate?success=resume-created");
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при создании резюме",
      );
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SpherePickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        sphere={sphere}
        subSphere={subSphere}
        onChange={(s, sub) => {
          setSphere(s);
          setSubSphere(sub);
        }}
      />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href="/dashboard/candidate"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Назад в кабинет
        </Link>

        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">
          Создать резюме
        </h1>
        <p className="text-sm text-[#64748B] mb-8">
          Заполните информацию о себе. Резюме появится в базе после заполнения.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Основное */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">Основное</h2>
            <FormInput
              label="Имя и фамилия *"
              placeholder="Иван Иванов"
              {...register("name")}
              error={errors.name?.message}
            />
            <FormInput
              label="Должность / специальность *"
              placeholder="Frontend-разработчик"
              {...register("title")}
              error={errors.title?.message}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#374151]">
                Сфера и специализация
              </label>
              <SpherePicker
                sphere={sphere}
                subSphere={subSphere}
                onClick={() => setModalOpen(true)}
              />
              {subSphere && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {subSphere
                    .split(",")
                    .filter(Boolean)
                    .map((val) => {
                      const node = SPHERE_TREE.find((s) => s.value === sphere);
                      const child = node?.children?.find(
                        (c) => c.value === val,
                      );
                      return (
                        <span
                          key={val}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EDE9FE] text-[#7C3AED] text-xs rounded-full font-medium"
                        >
                          {child?.label ?? val}
                          <button
                            type="button"
                            onClick={() => {
                              const next = subSphere
                                .split(",")
                                .filter((v) => v !== val);
                              setSubSphere(next.join(","));
                              if (!next.length) setSphere("");
                            }}
                            className="hover:opacity-70"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Формат работы"
                options={FORMATS}
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              />
              <FormInput
                label="Город"
                placeholder="Москва"
                {...register("location")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Опыт (лет)"
                type="number"
                placeholder="3"
                {...register("experience_years")}
                error={errors.experience_years?.message}
              />
              <FormInput
                label="Ожидаемая зарплата (₽)"
                type="number"
                placeholder="150 000"
                {...register("expected_salary")}
              />
            </div>
          </div>

          {/* Контакты */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Контакты</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Видны работодателям — заполните хотя бы одно поле
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#374151]">
                  Telegram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">
                    @
                  </span>
                  <input
                    {...register("telegram")}
                    placeholder="username"
                    className="w-full h-10 pl-7 pr-3 rounded-[10px] border border-[#E5E7EB] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
                  />
                </div>
                {errors.telegram && (
                  <p className="text-xs text-[#EF4444] mt-1">
                    {errors.telegram.message}
                  </p>
                )}
              </div>
              <FormInput
                label="Email"
                placeholder="ivan@example.com"
                {...register("email_contact")}
                error={errors.email_contact?.message}
              />
            </div>
          </div>

          {/* Навыки */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              🔧 Навыки / Стек
            </h2>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="TypeScript, React, Node.js..."
                />
              )}
            />
          </div>

          {/* О себе */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">О себе</h2>
            <textarea
              {...register("bio")}
              rows={6}
              placeholder="Расскажите о своём опыте, проектах и чем хотите заниматься..."
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2.5 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 resize-y"
            />
          </div>

          {/* Портфолио */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Портфолио / GitHub
            </h2>
            <FormInput
              label="Ссылка"
              placeholder="https://github.com/username"
              {...register("portfolio")}
            />
          </div>

          {/* Публикация */}
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-5 shadow-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span className="text-sm font-medium text-[#374151]">
                Опубликовать сразу (без модерации)
              </span>
            </label>
            {!publishImmediately && (
              <p className="text-xs text-[#94A3B8] mt-2">
                Резюме появится в базе после проверки модератором
              </p>
            )}
          </div>

          {serverError && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] px-4 py-3 text-sm text-[#EF4444]">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-[#10B981] hover:bg-[#059669] text-white font-semibold rounded-[12px] text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "✅ Создать резюме"
            )}
          </button>
        </form>
      </div>
    </>
  );
}
