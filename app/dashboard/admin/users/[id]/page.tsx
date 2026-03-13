"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Briefcase,
  FileText,
  MapPin,
  Phone,
  Globe,
  Github,
  Linkedin,
  Edit,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { formatDate, cn } from "@/lib/utils";

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedRole, setEditedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Проверяем авторизацию
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.push("/auth/login");
          return;
        }

        // Проверяем, что текущий пользователь - админ
        const { data: adminUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (!adminUser || adminUser.role !== "admin") {
          router.push("/");
          return;
        }

        // Получаем данные пользователя
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", params.id)
          .single();

        if (userError || !userData) {
          console.error("User not found:", userError);
          router.push("/dashboard/admin?tab=users");
          return;
        }

        setUser(userData);
        setEditedRole(userData.role);

        // Получаем профиль пользователя (если есть отдельная таблица)
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", params.id)
          .single();

        setUserProfile(profileData || {});
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleRoleChange = async () => {
    if (editedRole === user.role) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: editedRole })
        .eq("id", params.id);

      if (error) throw error;

      setUser({ ...user, role: editedRole });
      setEditing(false);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Ошибка при обновлении роли");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border-red-200";
      case "hr":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "candidate":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "Администратор";
      case "hr":
        return "HR / Рекрутер";
      case "candidate":
        return "Соискатель";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#7C3AED] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-[#64748B]">Пользователь не найден</p>
        <Link
          href="/dashboard/admin?tab=users"
          className="inline-flex items-center gap-2 mt-4 text-[#7C3AED] hover:underline"
        >
          <ArrowLeft size={16} />
          Вернуться к списку пользователей
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with back button */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin?tab=users"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#7C3AED] transition-colors"
        >
          <ArrowLeft size={16} />
          Назад к пользователям
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="h-32 bg-gradient-to-r from-[#7C3AED] to-[#C084FC]"></div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar and Actions */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-[#7C3AED]">
                {user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="mb-1">
                <h1 className="text-xl font-bold text-[#0F172A]">
                  {user.email}
                </h1>
                <p className="text-sm text-[#64748B]">ID: {user.id}</p>
              </div>
            </div>

            {/* Edit Button or Save/Cancel */}
            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleRoleChange}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] text-white text-sm rounded-[8px] hover:bg-[#059669] transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditedRole(user.role);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] text-[#64748B] text-sm rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
                >
                  <X size={14} />
                  Отмена
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] text-[#64748B] text-sm rounded-[8px] hover:bg-[#F8FAFC] transition-colors"
              >
                <Edit size={14} />
                Редактировать
              </button>
            )}
          </div>

          {/* User Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Role */}
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-[#64748B] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#94A3B8] mb-1">Роль</p>
                  {editing ? (
                    <select
                      value={editedRole}
                      onChange={(e) => setEditedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                    >
                      <option value="admin">Администратор</option>
                      <option value="hr">HR / Рекрутер</option>
                      <option value="candidate">Соискатель</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "inline-block px-2.5 py-1 text-xs font-semibold rounded-full border",
                        getRoleBadgeColor(user.role),
                      )}
                    >
                      {getRoleName(user.role)}
                    </span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#64748B] mt-0.5" />
                <div>
                  <p className="text-xs text-[#94A3B8] mb-1">Email</p>
                  <a
                    href={`mailto:${user.email}`}
                    className="text-sm text-[#0F172A] hover:text-[#7C3AED] transition-colors"
                  >
                    {user.email}
                  </a>
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-[#64748B] mt-0.5" />
                <div>
                  <p className="text-xs text-[#94A3B8] mb-1">
                    Дата регистрации
                  </p>
                  <p className="text-sm text-[#0F172A]">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>

              {/* Location (if available) */}
              {userProfile?.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">Локация</p>
                    <p className="text-sm text-[#0F172A]">
                      {userProfile.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone (if available) */}
              {userProfile?.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">Телефон</p>
                    <a
                      href={`tel:${userProfile.phone}`}
                      className="text-sm text-[#0F172A] hover:text-[#7C3AED] transition-colors"
                    >
                      {userProfile.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Website (if available) */}
              {userProfile?.website && (
                <div className="flex items-start gap-3">
                  <Globe size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">Веб-сайт</p>
                    <a
                      href={userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0F172A] hover:text-[#7C3AED] transition-colors"
                    >
                      {userProfile.website}
                    </a>
                  </div>
                </div>
              )}

              {/* GitHub (if available) */}
              {userProfile?.github && (
                <div className="flex items-start gap-3">
                  <Github size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">GitHub</p>
                    <a
                      href={userProfile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0F172A] hover:text-[#7C3AED] transition-colors"
                    >
                      {userProfile.github.replace("https://github.com/", "")}
                    </a>
                  </div>
                </div>
              )}

              {/* LinkedIn (if available) */}
              {userProfile?.linkedin && (
                <div className="flex items-start gap-3">
                  <Linkedin size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">LinkedIn</p>
                    <a
                      href={userProfile.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#0F172A] hover:text-[#7C3AED] transition-colors"
                    >
                      {userProfile.linkedin.replace(
                        "https://linkedin.com/in/",
                        "",
                      )}
                    </a>
                  </div>
                </div>
              )}

              {/* Bio (if available) */}
              {userProfile?.bio && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-xs text-[#94A3B8] mb-1">О себе</p>
                    <p className="text-sm text-[#0F172A]">{userProfile.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-4">
              Статистика
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F8FAFC] rounded-[12px] p-4">
                <Briefcase size={18} className="text-[#7C3AED] mb-2" />
                <p className="text-xl font-bold text-[#0F172A]">0</p>
                <p className="text-xs text-[#64748B]">Вакансий</p>
              </div>
              <div className="bg-[#F8FAFC] rounded-[12px] p-4">
                <FileText size={18} className="text-[#10B981] mb-2" />
                <p className="text-xl font-bold text-[#0F172A]">0</p>
                <p className="text-xs text-[#64748B]">Резюме</p>
              </div>
              <div className="bg-[#F8FAFC] rounded-[12px] p-4">
                <Calendar size={18} className="text-[#F59E0B] mb-2" />
                <p className="text-xl font-bold text-[#0F172A]">0</p>
                <p className="text-xs text-[#64748B]">Откликов</p>
              </div>
              <div className="bg-[#F8FAFC] rounded-[12px] p-4">
                <Shield size={18} className="text-[#EF4444] mb-2" />
                <p className="text-xl font-bold text-[#0F172A]">0</p>
                <p className="text-xs text-[#64748B]">Активность</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
