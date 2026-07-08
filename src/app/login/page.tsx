"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-800">Giriş Yap</h1>
        <p className="mt-1 text-sm text-slate-500">Orbi Life hesabınızla giriş yapın</p>
        {state.error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">E-posta</label>
            <input type="email" name="email" required autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Şifre</label>
            <input type="password" name="password" required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
          </div>
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#0071c2] py-3 font-bold text-white hover:bg-[#003580] disabled:opacity-50">
            {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="font-semibold text-[#0071c2] hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
