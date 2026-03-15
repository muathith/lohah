"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2, CreditCard, Globe } from "lucide-react"
import {
  getSettings,
  addBlockedCardBin,
  removeBlockedCardBin,
  addAllowedCountry,
  removeAllowedCountry,
  type Settings
} from "@/lib/firebase/settings"
import { toast } from "sonner"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const COUNTRIES = [
  { code: "SAU", name: "السعودية", flag: "🇸🇦" },
  { code: "ARE", name: "الإمارات", flag: "🇦🇪" },
  { code: "KWT", name: "الكويت", flag: "🇰🇼" },
  { code: "BHR", name: "البحرين", flag: "🇧🇭" },
  { code: "OMN", name: "عمان", flag: "🇴🇲" },
  { code: "QAT", name: "قطر", flag: "🇶🇦" },
  { code: "JOR", name: "الأردن", flag: "🇯🇴" },
  { code: "EGY", name: "مصر", flag: "🇪🇬" },
  { code: "LBN", name: "لبنان", flag: "🇱🇧" },
  { code: "IRQ", name: "العراق", flag: "🇮🇶" },
  { code: "SYR", name: "سوريا", flag: "🇸🇾" },
  { code: "YEM", name: "اليمن", flag: "🇾🇪" },
  { code: "PSE", name: "فلسطين", flag: "🇵🇸" },
  { code: "MAR", name: "المغرب", flag: "🇲🇦" },
  { code: "DZA", name: "الجزائر", flag: "🇩🇿" },
  { code: "TUN", name: "تونس", flag: "🇹🇳" },
  { code: "LBY", name: "ليبيا", flag: "🇱🇾" },
  { code: "SDN", name: "السودان", flag: "🇸🇩" },
]

const DARK = "rgba(9,14,28,0.98)"
const DARK_CARD = "rgba(13,20,44,0.97)"
const BORDER = "rgba(99,102,241,0.18)"
const BORDER_SUB = "rgba(255,255,255,0.06)"
const TEXT = "#e2e8f0"
const TEXT_MUT = "rgba(148,163,184,0.7)"

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings>({ blockedCardBins: [], allowedCountries: [] })
  const [newBinsInput, setNewBinsInput] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"cards" | "countries">("cards")

  useEffect(() => { if (isOpen) loadSettings() }, [isOpen])

  const loadSettings = async () => {
    try {
      const data = await getSettings()
      setSettings(data)
    } catch {
      toast.error("فشل تحميل الإعدادات")
    }
  }

  const handleAddBins = async () => {
    const bins = newBinsInput
      .split(/[\s,\n]+/)
      .map(b => b.trim())
      .filter(b => b.length === 4 && /^\d+$/.test(b))

    if (bins.length === 0) { toast.error("يجب إدخال أرقام صحيحة (4 أرقام لكل بطاقة)"); return }

    setLoading(true)
    try {
      for (const bin of bins) await addBlockedCardBin(bin)
      await loadSettings()
      setNewBinsInput("")
      toast.success(`تم إضافة ${bins.length} بطاقة محظورة`)
    } catch {
      toast.error("فشل إضافة البطاقات")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBin = async (bin: string) => {
    setLoading(true)
    try {
      await removeBlockedCardBin(bin)
      await loadSettings()
      toast.success("تم إزالة البطاقة المحظورة")
    } catch {
      toast.error("فشل إزالة البطاقة")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCountry = async () => {
    if (!selectedCountry) { toast.error("يرجى اختيار دولة"); return }
    setLoading(true)
    try {
      await addAllowedCountry(selectedCountry)
      await loadSettings()
      setSelectedCountry("")
      toast.success("تم إضافة الدولة المسموحة")
    } catch {
      toast.error("فشل إضافة الدولة")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCountry = async (country: string) => {
    setLoading(true)
    try {
      await removeAllowedCountry(country)
      await loadSettings()
      toast.success("تم إزالة الدولة المسموحة")
    } catch {
      toast.error("فشل إزالة الدولة")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { key: "cards" as const, label: "حجب بطاقات الدفع", icon: <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />, accent: "#6366f1" },
    { key: "countries" as const, label: "تقييد الوصول حسب الدولة", icon: <Globe className="h-4 w-4 sm:h-5 sm:w-5" />, accent: "#8b5cf6" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>

      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)" }} />

      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: DARK_CARD, border: `1px solid ${BORDER}`, fontFamily: "Cairo, Tajawal, sans-serif" }}>

        {/* Top accent */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(139,92,246,0.5), transparent)" }} />

        {/* Header */}
        <div className="p-4 sm:p-6" style={{ borderBottom: `1px solid ${BORDER_SUB}`, background: "rgba(99,102,241,0.06)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: TEXT }}>⚙️ إعدادات النظام</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: TEXT_MUT, border: `1px solid ${BORDER_SUB}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUT }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2" style={{ borderBottom: `1px solid ${BORDER_SUB}` }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-2 py-3 text-xs font-semibold transition-all sm:px-6 sm:py-4 sm:text-sm"
              style={{
                color: activeTab === tab.key ? tab.accent : TEXT_MUT,
                background: activeTab === tab.key ? `rgba(99,102,241,0.07)` : "transparent",
                borderBottom: activeTab === tab.key ? `2px solid ${tab.accent}` : "2px solid transparent",
              }}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[55vh] overflow-y-auto p-4 sm:p-6" style={{ background: DARK }}>
          {activeTab === "cards" ? (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="mb-1.5 text-base font-bold sm:text-lg" style={{ color: TEXT }}>قائمة حجب بطاقات الدفع</h3>
                <p className="text-xs sm:text-sm" style={{ color: TEXT_MUT }}>
                  أضف أرقام البطاقات التي تريد حجبها. مفصولة بفاصلة أو سطر جديد.
                </p>
              </div>

              {/* Input area */}
              <div className="rounded-xl p-4" style={{ background: "rgba(99,102,241,0.06)", border: `1px solid rgba(99,102,241,0.2)` }}>
                <textarea
                  value={newBinsInput}
                  onChange={(e) => setNewBinsInput(e.target.value)}
                  placeholder={"مثال: 4890, 4458, 4909\nأو كل رقم في سطر منفصل"}
                  rows={4}
                  dir="ltr"
                  className="w-full resize-none rounded-lg px-4 py-3 text-sm font-mono outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid rgba(99,102,241,0.25)`,
                    color: TEXT,
                  }}
                  onFocus={e => { e.target.style.borderColor = "#6366f1" }}
                  onBlur={e => { e.target.style.borderColor = "rgba(99,102,241,0.25)" }}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={handleAddBins}
                    disabled={loading || !newBinsInput.trim()}
                    className="flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                  >
                    <Plus className="w-4 h-4" />
                    حفظ
                  </button>
                  <button
                    onClick={() => setNewBinsInput("")}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ color: TEXT_MUT }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = TEXT }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUT }}
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* Blocked BINs list */}
              <div>
                {settings.blockedCardBins.length === 0 ? (
                  <div className="py-8 text-center">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: TEXT_MUT }} />
                    <p className="text-sm" style={{ color: TEXT_MUT }}>لا توجد بطاقات محظورة</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.blockedCardBins.map((bin) => (
                      <div
                        key={bin}
                        className="flex items-center gap-2 rounded-full px-3 py-1.5"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER_SUB}` }}
                      >
                        <span className="font-mono text-sm font-semibold" style={{ color: TEXT }}>{bin}</span>
                        <button
                          onClick={() => handleRemoveBin(bin)}
                          disabled={loading}
                          style={{ color: "rgba(148,163,184,0.4)" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171" }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.4)" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center">
                <h3 className="mb-1.5 text-base font-bold sm:text-lg" style={{ color: TEXT }}>تقييد الوصول حسب الدولة</h3>
                <p className="text-xs sm:text-sm" style={{ color: TEXT_MUT }}>
                  تحكم في الدول المسموح لها بالوصول. سيُمنع الوصول من أي دولة غير مدرجة.
                </p>
              </div>

              {/* Country dropdown */}
              <div className="rounded-xl p-4" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: TEXT_MUT }}>
                  - الدول المسموح لها بالوصول -
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: TEXT,
                    }}
                    dir="rtl"
                  >
                    <option value="" style={{ background: "#0d1528" }}>اختر دولة...</option>
                    {COUNTRIES.filter(c => !settings.allowedCountries.includes(c.code)).map((country) => (
                      <option key={country.code} value={country.code} style={{ background: "#0d1528" }}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddCountry}
                    disabled={loading || !selectedCountry}
                    className="rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  >
                    حفظ
                  </button>
                </div>
              </div>

              {/* Allowed countries list */}
              <div>
                {settings.allowedCountries.length === 0 ? (
                  <div className="py-8 text-center">
                    <Globe className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: TEXT_MUT }} />
                    <p className="text-sm" style={{ color: TEXT_MUT }}>جميع الدول مسموحة (لم يتم تحديد قيود)</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {settings.allowedCountries.map((countryCode) => {
                      const country = COUNTRIES.find(c => c.code === countryCode)
                      return (
                        <div
                          key={countryCode}
                          className="flex items-center gap-2 rounded-full px-3 py-1.5"
                          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                        >
                          <span className="text-base">{country?.flag || "🌍"}</span>
                          <span className="text-sm font-semibold" style={{ color: "#6ee7b7" }}>
                            {country?.name || countryCode}
                          </span>
                          <button
                            onClick={() => handleRemoveCountry(countryCode)}
                            disabled={loading}
                            style={{ color: "rgba(148,163,184,0.4)" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.4)" }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4" style={{ borderTop: `1px solid ${BORDER_SUB}`, background: DARK_CARD }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: TEXT_MUT, border: `1px solid ${BORDER_SUB}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = TEXT }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUT }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}
