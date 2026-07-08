"use client";
import { useActionState } from "react";
import { resetPasswordAction, type FormState } from "@/lib/actions";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-800">Yeni Şifre Belirle</h1>
        <p className="mt-1 text-sm text-slate-500">Hesabınız için yeni bir şifre oluşturun.</p>

        {state.error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</div>
        )}

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Yeni Şifre</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[#0071c2] py-3 font-bold text-white hover:bg-[#003580] disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Şifreyi Güncelle"}
          </button>
        </form>
      </div>
    </div>
  );
}
