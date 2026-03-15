"use client"

import { useEffect, useState } from "react"
import { SettingsModal } from "@/components/settings-modal"
import { Settings, Activity, Users, Calendar, CreditCard, Smartphone } from "lucide-react"

interface AnalyticsData {
  activeUsers: number
  todayVisitors: number
  totalVisitors: number
  visitorsWithCard: number
  visitorsWithPhone: number
  devices: Array<{ device: string; users: number }>
  countries: Array<{ country: string; users: number }>
}

export function DashboardHeader() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    activeUsers: 0,
    todayVisitors: 0,
    totalVisitors: 0,
    visitorsWithCard: 0,
    visitorsWithPhone: 0,
    devices: [],
    countries: [],
  })
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics')
        const data = await response.json()
        setAnalytics(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    {
      label: "نشط الآن",
      value: analytics.activeUsers,
      icon: <Activity className="w-3.5 h-3.5" />,
      accent: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.2)",
      pulse: true,
    },
    {
      label: "زوار اليوم",
      value: analytics.todayVisitors,
      icon: <Calendar className="w-3.5 h-3.5" />,
      accent: "#6366f1",
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.2)",
    },
    {
      label: "إجمالي (30 يوم)",
      value: analytics.totalVisitors,
      icon: <Users className="w-3.5 h-3.5" />,
      accent: "#06b6d4",
      bg: "rgba(6,182,212,0.08)",
      border: "rgba(6,182,212,0.2)",
    },
    {
      label: "لديهم بطاقة",
      value: analytics.visitorsWithCard,
      icon: <CreditCard className="w-3.5 h-3.5" />,
      accent: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "لديهم هاتف",
      value: analytics.visitorsWithPhone,
      icon: <Smartphone className="w-3.5 h-3.5" />,
      accent: "#ec4899",
      bg: "rgba(236,72,153,0.08)",
      border: "rgba(236,72,153,0.2)",
    },
  ]

  return (
    <div style={{ background: "rgba(9,14,28,0.98)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(6,182,212,0.4), transparent)" }} />

      {/* Main header row */}
      <div className="px-3 sm:px-4 md:px-5 py-2.5 md:py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center justify-between gap-3">
          {/* Title */}
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight" style={{ color: "#e2e8f0" }}>
              لوحة التحكم
            </h1>
            <p className="hidden sm:block text-[11px] md:text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>
              إدارة زوار BCare
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg transition-all duration-200"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.2)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.1)" }}
              title="إعدادات"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-3 sm:px-4 md:px-5 py-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 md:gap-2.5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col gap-0.5 rounded-xl p-2 md:p-2.5"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <div className="flex items-center gap-1.5">
                {stat.pulse ? (
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-3 h-3 rounded-full animate-ping" style={{ background: stat.accent, opacity: 0.3 }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: stat.accent }} />
                  </div>
                ) : (
                  <div style={{ color: stat.accent }}>{stat.icon}</div>
                )}
                <span className="text-[10px] md:text-[11px] font-medium" style={{ color: "rgba(148,163,184,0.8)" }}>{stat.label}</span>
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold" style={{ color: stat.accent }}>
                {loading ? <span className="text-sm opacity-40">...</span> : stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
