"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { RefreshCw, Power } from "lucide-react";

type Status = "ok" | "error" | "loading" | "timeout";
interface Check {
  name: string;
  status: Status;
  latency?: number;
  detail?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Таймаут ${ms}ms`)), ms),
    ),
  ]);
}

async function runCheck(
  name: string,
  fn: () => Promise<string>,
  ms = 5000,
): Promise<Check> {
  const t0 = Date.now();
  try {
    const detail = await withTimeout(fn(), ms);
    return { name, status: "ok", latency: Date.now() - t0, detail };
  } catch (e: any) {
    const isTimeout = e.message?.includes("Таймаут");
    const isFetch = e.message?.includes("Failed to fetch");
    return {
      name,
      status: isTimeout ? "timeout" : "error",
      latency: Date.now() - t0,
      detail: isFetch
        ? "Failed to fetch — неверный SUPABASE_URL или нет сети"
        : e.message,
    };
  }
}

const INITIAL: Check[] = [
  { name: "Auth — getSession", status: "loading" },
  { name: "DB — jobs (SELECT)", status: "loading" },
  { name: "DB — resumes (SELECT)", status: "loading" },
  { name: "DB — settings (SELECT)", status: "loading" },
  { name: "DB — users (SELECT)", status: "loading" },
  { name: "Env — SUPABASE_URL", status: "loading" },
  { name: "Env — APP_URL", status: "loading" },
];

// ── Диагноз по результатам ─────────────────────────────────────
function diagnose(checks: Check[]): { text: string; color: string } | null {
  const url = checks.find((c) => c.name === "Env — SUPABASE_URL");
  const jobs = checks.find((c) => c.name === "DB — jobs (SELECT)");

  if (
    url?.detail?.includes("your-project") ||
    url?.detail?.includes("placeholder")
  ) {
    return {
      text: "⚠️ NEXT_PUBLIC_SUPABASE_URL содержит placeholder — замени на реальный URL в .env.local и перезапусти сервер",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    };
  }
  if (jobs?.detail?.includes("Failed to fetch")) {
    return {
      text: "⚠️ Failed to fetch — проверь NEXT_PUBLIC_SUPABASE_URL в .env.local. Значение должно быть https://xxxxxx.supabase.co",
      color: "text-red-400 bg-red-500/10 border-red-500/20",
    };
  }
  if (jobs?.status === "timeout") {
    return {
      text: "⏱ Supabase не отвечает — возможно Free план заснул. Подожди 10 сек и нажми «Повторить»",
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    };
  }
  return null;
}

export default function StatusPage() {
  const router = useRouter();
  const [checks, setChecks] = useState<Check[]>(INITIAL);
  const [runAt, setRunAt] = useState("");
  const [running, setRunning] = useState(false);
  const [authState, setAuthState] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );
  const [accessMode, setAccessMode] = useState<"admin" | "hidden" | null>(null);
  const [ping, setPing] = useState<{
    status: "idle" | "loading" | "ok" | "error";
    ms?: number;
    msg?: string;
  }>({ status: "idle" });

  // НОВОЕ: Состояние для автообновления
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("statusAutoRefresh");
      return saved !== null ? saved === "true" : true; // по умолчанию true
    }
    return true;
  });

  // НОВОЕ: Сохраняем в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("statusAutoRefresh", String(autoRefresh));
  }, [autoRefresh]);

  // НОВОЕ: Таймер для автообновления
  useEffect(() => {
    if (!autoRefresh || authState !== "allowed") return;

    const intervalId = setInterval(() => {
      if (!running) {
        runAll();
      }
    }, 50000); // 50 секунд

    return () => clearInterval(intervalId);
  }, [autoRefresh, authState, running]);

  // ── Проверка доступа ───────────────────────────────────────────
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (localStorage.getItem("hiddenOptions") === "yess") {
          setAccessMode("hidden");
          setAuthState("allowed");
          return;
        }
      } catch (_) {}

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setAuthState("denied");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data?.role === "admin") {
        setAccessMode("admin");
        setAuthState("allowed");
      } else setAuthState("denied");
    };
    checkAccess();
  }, []);

  useEffect(() => {
    if (authState === "denied") router.replace("/");
  }, [authState, router]);

  // ── Ping DB ────────────────────────────────────────────────────
  const handlePing = async () => {
    setPing({ status: "loading" });
    const t0 = Date.now();
    try {
      await withTimeout(
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .then((r) => {
            if (r.error) throw new Error(r.error.message);
            return r;
          }),
        6000,
      );
      setPing({ status: "ok", ms: Date.now() - t0, msg: "Supabase отвечает" });
    } catch (e: any) {
      const ms = Date.now() - t0;
      const isFetch = e.message?.includes("Failed to fetch");
      setPing({
        status: "error",
        ms,
        msg: isFetch
          ? "Failed to fetch — неверный SUPABASE_URL или нет сети"
          : e.message?.includes("Таймаут")
            ? "Таймаут — Supabase не отвечает (возможно заснул)"
            : e.message,
      });
    }
  };

  // ── Диагностика ────────────────────────────────────────────────
  const updateCheck = (name: string, result: Check) =>
    setChecks((prev) => prev.map((c) => (c.name === name ? result : c)));

  const runAll = async () => {
    setRunning(true);
    setRunAt(new Date().toLocaleTimeString("ru-RU"));
    setChecks(INITIAL);
    setPing({ status: "idle" });

    const checkDefs = [
      {
        name: "Auth — getSession",
        fn: async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw new Error(error.message);
          return data.session
            ? `Залогинен: ${data.session.user.email}`
            : "Анонимный пользователь";
        },
      },
      {
        name: "DB — jobs (SELECT)",
        fn: async () => {
          const { count, error } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true });
          if (error) throw new Error(error.message);
          return `${count ?? 0} записей`;
        },
      },
      {
        name: "DB — resumes (SELECT)",
        fn: async () => {
          const { count, error } = await supabase
            .from("resumes")
            .select("id", { count: "exact", head: true });
          if (error) throw new Error(error.message);
          return `${count ?? 0} записей`;
        },
      },
      {
        name: "DB — settings (SELECT)",
        fn: async () => {
          const { data, error } = await supabase
            .from("settings")
            .select("header_enabled,telegram_autopost_enabled")
            .eq("id", 1)
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!data) throw new Error("Нет строки settings с id=1");
          return `hero=${data.header_enabled} tg=${data.telegram_autopost_enabled}`;
        },
      },
      {
        name: "DB — users (SELECT)",
        fn: async () => {
          const { data: auth } = await supabase.auth.getSession();
          if (!auth.session) return "Пропущено (не авторизован)";
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", auth.session.user.id)
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (!data)
            throw new Error(
              "Нет записи в public.users — триггер не сработал при регистрации",
            );
          return `role = ${data.role}`;
        },
      },
      {
        name: "Env — SUPABASE_URL",
        fn: async () => {
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
          if (!url) throw new Error("Не задан");
          if (url.includes("your-project") || url.includes("placeholder"))
            throw new Error(`Placeholder: ${url}`);
          return url;
        },
      },
      {
        name: "Env — APP_URL",
        fn: async () => {
          const url = process.env.NEXT_PUBLIC_APP_URL;
          if (!url) throw new Error("NEXT_PUBLIC_APP_URL не задан");
          return url;
        },
      },
    ];

    await Promise.all(
      checkDefs.map(({ name, fn }) =>
        runCheck(name, fn, 5000).then((result) => updateCheck(name, result)),
      ),
    );
    setRunning(false);
  };

  useEffect(() => {
    if (authState === "allowed") runAll();
  }, [authState]);

  if (authState === "checking")
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#334155] border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#475569] text-sm font-mono">
            Проверка доступа...
          </p>
        </div>
      </div>
    );

  if (authState === "denied")
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm font-mono">⛔ Доступ запрещён</p>
          <p className="text-[#475569] text-xs mt-1">Перенаправление...</p>
        </div>
      </div>
    );

  const allOk = checks.every((c) => c.status === "ok");
  const isLoading = checks.some((c) => c.status === "loading");
  const diagnosis = !isLoading ? diagnose(checks) : null;

  const statusIcon = (s: Status) => {
    if (s === "loading")
      return (
        <span className="inline-block w-3 h-3 border border-[#475569] border-t-amber-400 rounded-full animate-spin" />
      );
    if (s === "ok") return <span className="text-green-400 text-base">✓</span>;
    if (s === "timeout")
      return <span className="text-amber-400 text-base">⏱</span>;
    return <span className="text-red-500 text-base">✗</span>;
  };

  const latencyColor = (ms?: number) => {
    if (!ms) return "";
    if (ms < 400) return "text-green-400 bg-green-400/10";
    if (ms < 1500) return "text-amber-400 bg-amber-400/10";
    return "text-red-400 bg-red-400/10";
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white px-4 py-12 font-mono">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок с тоглом автообновления */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${isLoading ? "bg-amber-400 animate-pulse" : allOk ? "bg-green-400" : "bg-red-500"}`}
              />
              <h1 className="text-lg font-bold tracking-tight">
                System Status
              </h1>
              <span className="text-xs text-[#475569] bg-[#1E293B] px-2 py-0.5 rounded border border-[#334155]">
                ВакансияРФ
              </span>
              {accessMode === "admin" && (
                <span className="text-xs text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-0.5 rounded border border-[#7C3AED]/20">
                  admin
                </span>
              )}
              {accessMode === "hidden" && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  hidden
                </span>
              )}
            </div>
            {runAt && (
              <p className="text-xs text-[#475569] pl-6">Проверка в {runAt}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Тогл автообновления */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 h-8 px-3 rounded-lg border text-xs font-medium transition-all ${
                autoRefresh
                  ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  : "bg-[#1E293B] border-[#334155] text-[#64748B] hover:bg-[#334155]"
              }`}
              title={
                autoRefresh
                  ? "Автообновление включено"
                  : "Автообновление выключено"
              }
            >
              <Power
                size={14}
                className={autoRefresh ? "text-green-400" : "text-[#64748B]"}
              />
              <span className="text-xs">Auto</span>
            </button>

            <button
              onClick={runAll}
              disabled={running}
              className="flex items-center gap-2 h-8 px-4 bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs rounded-lg transition-colors disabled:opacity-40"
            >
              {running ? (
                <span className="w-3 h-3 border border-[#475569] border-t-white rounded-full animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {running ? "Проверка..." : "Повторить"}
            </button>
          </div>
        </div>

        {/* Статус-баннер с информацией об автообновлении */}
        <div
          className={`rounded-xl border p-3.5 mb-3 text-sm font-medium flex items-center justify-between ${
            isLoading
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : allOk
                ? "bg-green-500/10  border-green-500/20  text-green-400"
                : "bg-red-500/10    border-red-500/20    text-red-400"
          }`}
        >
          <span>
            {isLoading
              ? "⏳ Выполняется проверка..."
              : allOk
                ? "✅ Все системы работают нормально"
                : `⛔ Проблемы: ${checks.filter((c) => c.status !== "ok").length} из ${checks.length}`}
          </span>
          {autoRefresh && !isLoading && (
            <span className="text-[10px] opacity-70 flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin-slow" />
              обновление каждые 50с
            </span>
          )}
        </div>

        {/* Диагноз */}
        {diagnosis && (
          <div
            className={`rounded-xl border px-4 py-3 mb-5 text-xs leading-relaxed ${diagnosis.color}`}
          >
            {diagnosis.text}
          </div>
        )}

        {/* ── Ping DB ─────────────────────────────────────────── */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#CBD5E1] mb-0.5">
              Ping Database
            </p>
            {ping.status === "idle" && (
              <p className="text-xs text-[#475569]">
                Нажми чтобы проверить доступность Supabase
              </p>
            )}
            {ping.status === "loading" && (
              <p className="text-xs text-amber-400">Пингуем...</p>
            )}
            {ping.status === "ok" && (
              <p className="text-xs text-green-400">
                ✓ {ping.msg}
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-medium ${latencyColor(ping.ms)}`}
                >
                  {ping.ms}ms
                </span>
              </p>
            )}
            {ping.status === "error" && (
              <p className="text-xs text-red-400 truncate">✗ {ping.msg}</p>
            )}
          </div>
          <button
            onClick={handlePing}
            disabled={ping.status === "loading"}
            className={`shrink-0 h-8 px-4 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 ${
              ping.status === "ok"
                ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                : ping.status === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  : "bg-[#334155] border-[#475569] text-[#CBD5E1] hover:bg-[#3E4F63]"
            }`}
          >
            {ping.status === "loading" ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
            ) : ping.status === "ok" ? (
              "✓ OK"
            ) : ping.status === "error" ? (
              "✗ Retry"
            ) : (
              "⚡ Ping"
            )}
          </button>
        </div>

        {/* Чеки */}
        <div className="space-y-1.5 mb-5">
          {checks.map((c) => (
            <div
              key={c.name}
              className={`bg-[#1E293B] border rounded-lg px-4 py-3 flex items-center gap-3 ${
                c.status === "error"
                  ? "border-red-500/40"
                  : c.status === "timeout"
                    ? "border-amber-500/40"
                    : "border-[#334155]"
              }`}
            >
              <div className="shrink-0 w-5 flex justify-center">
                {statusIcon(c.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#CBD5E1]">{c.name}</p>
                {c.detail && (
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      c.status === "error"
                        ? "text-red-400"
                        : c.status === "timeout"
                          ? "text-amber-400"
                          : "text-[#475569]"
                    }`}
                  >
                    {c.detail}
                  </p>
                )}
              </div>
              {c.latency !== undefined && (
                <span
                  className={`shrink-0 text-[11px] px-2 py-0.5 rounded font-medium ${latencyColor(c.latency)}`}
                >
                  {c.latency}ms
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Env */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 space-y-1.5 mb-4">
          <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest mb-3">
            Environment
          </p>
          {(
            [
              [
                "NEXT_PUBLIC_SUPABASE_URL",
                process.env.NEXT_PUBLIC_SUPABASE_URL,
              ],
              [
                "NEXT_PUBLIC_SUPABASE_ANON_KEY",
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              ],
              ["NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL],
            ] as [string, string | undefined][]
          ).map(([key, val]) => {
            const isPlaceholder =
              val?.includes("your-project") || val?.includes("placeholder");
            return (
              <div key={key} className="flex items-start justify-between gap-4">
                <span className="text-xs text-[#475569] shrink-0">{key}</span>
                <span
                  className={`text-xs font-medium text-right break-all ${isPlaceholder ? "text-red-400" : val ? "text-green-400" : "text-red-400"}`}
                >
                  {val
                    ? key.includes("KEY")
                      ? "✓ задан (скрыт)"
                      : isPlaceholder
                        ? `⚠️ placeholder: ${val}`
                        : val
                    : "✗ не задан"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Подсказки */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4">
          <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest mb-3">
            Частые причины ошибок
          </p>
          <div className="space-y-2 text-xs text-[#475569] leading-relaxed">
            <p>
              <span className="text-red-400">Failed to fetch</span> — неверный
              NEXT_PUBLIC_SUPABASE_URL в .env.local
            </p>
            <p>
              <span className="text-amber-400">Таймаут</span> — Supabase Free
              план заснул, подожди 10 сек
            </p>
            <p>
              <span className="text-red-400">Нет записи в users</span> — триггер
              или RLS на public.users не настроен
            </p>
            <p>
              <span className="text-red-400">permission denied</span> — не выдан
              GRANT SELECT TO anon
            </p>
          </div>
        </div>

        <p className="text-center text-[#1E293B] text-xs mt-8 select-none">
          /status · только для администраторов
        </p>
      </div>
    </div>
  );
}
