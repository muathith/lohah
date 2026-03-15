"use client";
import React, { useState, useEffect } from "react";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  ShieldCheck,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldAlert,
  Fingerprint,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface StarProps { w: number; h: number; top: number; left: number; opacity: number; dur: number; delay: number; }
interface ParticleProps { size: number; left: number; bg: string; dur: number; delay: number; shadow: string; }

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [stars, setStars] = useState<StarProps[]>([]);
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const navigate = useRouter();
  const { sessionBlocked } = useAuth();

  useEffect(() => {
    const rng = (min: number, max: number) => Math.random() * (max - min) + min;
    setStars(Array.from({ length: 60 }, () => ({
      w: rng(1, 3), h: rng(1, 3),
      top: rng(0, 100), left: rng(0, 100),
      opacity: rng(0.1, 0.7), dur: rng(2, 6), delay: rng(0, 4),
    })));
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      size: rng(2, 8), left: rng(0, 100),
      bg: i % 2 === 0 ? `rgba(99,102,241,${rng(0.2, 0.6)})` : `rgba(6,182,212,${rng(0.2, 0.6)})`,
      dur: rng(10, 25), delay: rng(0, 10),
      shadow: i % 2 === 0 ? "0 0 6px rgba(99,102,241,0.8)" : "0 0 6px rgba(6,182,212,0.8)",
    })));
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.href,
        handleCodeInApp: true,
      });
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
      setMessage("تم إرسال رابط تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني.");
    } catch {
      setError("حدث خطأ أثناء إرسال الرابط. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailToUse = window.localStorage.getItem("emailForSignIn");
      if (!emailToUse) {
        emailToUse = window.prompt("يرجى إدخال بريدك الإلكتروني للتأكيد:");
      }
      if (emailToUse) {
        setLoading(true);
        signInWithEmailLink(auth, emailToUse, window.location.href)
          .then(() => {
            window.localStorage.removeItem("emailForSignIn");
            navigate.push("/");
          })
          .catch(() => {
            setError("رابط تسجيل الدخول غير صالح أو منتهي الصلاحية.");
            setLoading(false);
          });
      }
    }
  }, [navigate]);

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes float-up {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes border-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        .spin-slow { animation: spin-slow 8s linear infinite; }
        .spin-reverse { animation: spin-reverse 12s linear infinite; }
        .pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
        }
        .border-glow { animation: border-glow 2s ease-in-out infinite; }
        .fade-in-up { animation: fade-in-up 0.6s ease-out both; }
        .particle {
          position: absolute;
          border-radius: 50%;
          animation: float-up linear infinite;
          pointer-events: none;
        }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #e2e8f0;
          -webkit-box-shadow: 0 0 0px 1000px rgba(15,23,42,0.9) inset;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center font-sans overflow-hidden relative"
        dir="rtl"
        style={{ background: "radial-gradient(ellipse at 20% 50%, #0a0f1e 0%, #050810 40%, #030508 100%)" }}
      >
        {/* Stars */}
        {stars.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: s.w + "px", height: s.h + "px",
              top: s.top + "%", left: s.left + "%",
              background: "#fff", opacity: s.opacity,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}

        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={`p-${i}`}
            className="particle"
            style={{
              width: p.size + "px", height: p.size + "px",
              left: p.left + "%", bottom: "-20px",
              background: p.bg,
              animationDuration: p.dur + "s",
              animationDelay: p.delay + "s",
              boxShadow: p.shadow,
            }}
          />
        ))}

        {/* Large ambient orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)" }} />
        <div className="absolute top-[40%] left-[40%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)", transform: "translate(-50%,-50%)" }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
            backgroundSize: "80px 80px"
          }} />

        {/* Card container */}
        <div className="relative z-10 w-full max-w-[440px] mx-4 fade-in-up">

          {/* Animated outer glow ring */}
          <div className="absolute -inset-[2px] rounded-[28px] pointer-events-none border-glow"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.3), rgba(139,92,246,0.4), rgba(99,102,241,0.1))",
              filter: "blur(8px)",
            }} />

          {/* Main card */}
          <div className="relative rounded-[26px] overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(15,23,42,0.95) 0%, rgba(9,14,28,0.98) 100%)",
              border: "1px solid rgba(99,102,241,0.2)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}>

            {/* Top shimmer line */}
            <div className="h-[1px] w-full overflow-hidden"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.8) 30%, rgba(99,102,241,1) 50%, rgba(139,92,246,0.8) 70%, transparent 100%)" }}>
              <div style={{
                height: "100%",
                width: "50%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                animation: "shimmer 3s ease-in-out infinite",
              }} />
            </div>

            <div className="px-8 pt-10 pb-8 sm:px-10">

              {/* Icon area */}
              <div className="flex flex-col items-center mb-9">
                <div className="relative mb-6">
                  {/* Outer ring */}
                  <div className="absolute -inset-5 rounded-full spin-slow"
                    style={{
                      background: "conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.6) 60deg, transparent 120deg, rgba(6,182,212,0.4) 180deg, transparent 240deg, rgba(139,92,246,0.5) 300deg, transparent 360deg)",
                    }} />
                  {/* Middle ring */}
                  <div className="absolute -inset-3 rounded-full spin-reverse"
                    style={{
                      background: "conic-gradient(from 180deg, transparent 0deg, rgba(6,182,212,0.4) 60deg, transparent 120deg, rgba(99,102,241,0.3) 200deg, transparent 260deg)",
                    }} />
                  {/* Glow backdrop */}
                  <div className="absolute inset-0 rounded-2xl pulse-glow"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                      filter: "blur(18px)",
                      transform: "scale(1.4)",
                    }} />
                  {/* Icon box */}
                  <div className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                      boxShadow: "0 8px 40px rgba(99,102,241,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset",
                    }}>
                    <ShieldCheck className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={1.6} />
                  </div>
                </div>

                <h1 className="text-[1.6rem] font-bold mb-2 tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #fff 30%, rgba(148,163,184,0.9) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                  مرحباً بعودتك
                </h1>
                <p className="text-sm text-center leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                  أدخل بريدك الإلكتروني لتلقّي رابط الدخول الآمن
                </p>
              </div>

              {/* Session blocked banner */}
              {sessionBlocked && (
                <div className="flex items-start gap-3 px-4 py-4 rounded-2xl mb-6"
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(185,28,28,0.08))",
                    border: "1px solid rgba(239,68,68,0.3)",
                    boxShadow: "0 4px 20px rgba(239,68,68,0.1)",
                  }}>
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#f87171" }} />
                  <div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: "#fca5a5" }}>
                      جلسة نشطة بالفعل
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(252,165,165,0.7)" }}>
                      المدير مسجّل الدخول بالفعل من جهاز آخر. لا يُسمح بأكثر من جلسة واحدة في نفس الوقت.
                    </p>
                  </div>
                </div>
              )}

              {!sent ? (
                <form
                  onSubmit={handleSendLink}
                  className="space-y-5"
                  style={sessionBlocked ? { pointerEvents: "none", opacity: 0.35 } : {}}
                >
                  <div className="space-y-2">
                    <label htmlFor="email" className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase"
                      style={{ color: "rgba(99,102,241,0.8)" }}>
                      <Fingerprint className="w-3.5 h-3.5" />
                      البريد الإلكتروني
                    </label>
                    <div className="relative group">
                      {/* Input glow on focus */}
                      <div className="absolute -inset-[1px] rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.3))", filter: "blur(4px)" }} />
                      <div className="relative">
                        <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
                          style={{ color: "rgba(99,102,241,0.6)" }} />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={loading}
                          placeholder="admin@example.com"
                          className="login-input w-full pr-10 pl-4 py-3.5 text-sm rounded-xl outline-none transition-all duration-300 disabled:opacity-40"
                          style={{
                            background: "rgba(15,23,42,0.8)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            color: "#e2e8f0",
                            caretColor: "#6366f1",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "rgba(99,102,241,0.6)";
                            e.target.style.background = "rgba(15,23,42,0.95)";
                            e.target.style.boxShadow = "0 0 20px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.2) inset";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "rgba(99,102,241,0.2)";
                            e.target.style.background = "rgba(15,23,42,0.8)";
                            e.target.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#fca5a5",
                      }}>
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
                      backgroundSize: "200% 200%",
                      boxShadow: "0 4px 30px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.12) inset",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 40px rgba(99,102,241,0.65), 0 1px 0 rgba(255,255,255,0.12) inset";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 30px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.12) inset";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    {/* Shimmer sweep */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                      }} />
                    {loading ? (
                      <span className="relative flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        جاري الإرسال...
                      </span>
                    ) : (
                      <span className="relative flex items-center gap-2">
                        إرسال رابط الدخول
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                      </span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-5">
                  {/* Success icon */}
                  <div className="relative flex items-center justify-center mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full pulse-glow"
                      style={{ background: "rgba(34,197,94,0.15)", filter: "blur(8px)" }} />
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))",
                        border: "1px solid rgba(34,197,94,0.3)",
                        boxShadow: "0 0 30px rgba(34,197,94,0.2)",
                      }}>
                      <CheckCircle2 className="w-8 h-8" style={{ color: "#4ade80" }} />
                    </div>
                  </div>

                  <div>
                    <p className="text-white font-bold text-lg mb-1.5">تم إرسال الرابط!</p>
                    <p className="text-sm mb-2" style={{ color: "rgba(148,163,184,0.7)" }}>
                      تحقق من بريدك الإلكتروني
                    </p>
                    <p className="text-xs font-semibold px-3 py-1.5 rounded-full inline-block"
                      style={{
                        color: "rgba(99,102,241,0.9)",
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}>
                      {email}
                    </p>
                  </div>

                  <div className="px-4 py-3.5 rounded-xl text-sm text-right leading-relaxed"
                    style={{
                      background: "rgba(34,197,94,0.05)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "rgba(134,239,172,0.85)",
                    }}>
                    {message}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setSent(false); setEmail(""); setMessage(""); }}
                    className="text-xs transition-all duration-200 hover:opacity-100"
                    style={{ color: "rgba(148,163,184,0.4)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.8)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.4)"; }}
                  >
                    ← إرسال إلى بريد آخر
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <p className="text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>
                  © 2026 BCare — جميع الحقوق محفوظة
                </p>
              </div>
            </div>

            {/* Bottom shimmer line */}
            <div className="h-[1px] w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.3), transparent)" }} />
          </div>
        </div>
      </div>
    </>
  );
}
