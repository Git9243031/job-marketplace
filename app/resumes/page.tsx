"use client";
import { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import { ResumeCard } from "@/components/resumes/ResumeCard";
import {
  ResumeFilters,
  DEFAULT_RESUME_FILTERS,
  type ResumeFilterState,
} from "@/components/resumes/ResumeFilters";
import { Pagination } from "@/components/ui/Pagination";
import { supabase } from "@/lib/supabaseClient";

const PER_PAGE = 9;

export default function ResumesPage() {
  const [filters, setFilters] = useState<ResumeFilterState>(
    DEFAULT_RESUME_FILTERS,
  );
  const [resumes, setResumes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: ResumeFilterState, p: number) => {
    setLoading(true);
    let q = supabase
      .from("resumes")
      .select("*", { count: "exact" })
      // .eq('visible', true)
      .order("created_at", { ascending: false })
      .range((p - 1) * PER_PAGE, p * PER_PAGE - 1);

    if (f.q) q = q.or(`name.ilike.%${f.q}%,title.ilike.%${f.q}%`);
    if (f.sphere !== "all") q = q.eq("sphere", f.sphere);
    if (f.level !== "all") q = q.eq("experience_level", f.level);
    if (f.format !== "all") q = q.eq("format", f.format);
    if (f.salaryMax > 0) q = q.lte("expected_salary", f.salaryMax);

    const { data, count } = await q;
    setResumes(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(filters, page);
  }, [filters, page, load]);

  const onFilter = (f: ResumeFilterState) => {
    setFilters(f);
    setPage(1);
  };
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">База резюме</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {total} специалистов готовы к работе
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-20">
              <ResumeFilters
                filters={filters}
                onChange={onFilter}
                total={total}
              />
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-16 text-center">
                <FileText size={28} className="text-[#94A3B8] mx-auto mb-3" />
                <h3 className="font-semibold text-[#0F172A] mb-1">
                  Специалисты не найдены
                </h3>
                <p className="text-sm text-[#64748B] mb-4">
                  Попробуйте изменить фильтры
                </p>
                <button
                  onClick={() => onFilter(DEFAULT_RESUME_FILTERS)}
                  className="text-sm text-[#7C3AED] hover:underline"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {resumes.map((r) => (
                    <ResumeCard key={r.id} resume={r} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
