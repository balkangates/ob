"use client";
import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/lib/actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(registerAction, {});
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-800">Kayıt Ol</h1>
        <p className="mt-1 text-sm text-slate-500">Ücretsiz hesap oluşturun, anında Genius avantajlarını kazanın</p>
        {state.error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</div>}
        <form action={formAction} className="mt-6 space-y-4">
          {[
            { name: "fullName", label: "Ad Soyad", type: "text",     autocomplete: "name",  required: true },
            { name: "email",    label: "E-posta",  type: "email",    autocomplete: "email", required: true },
            { name: "phone",    label: "Telefon",  type: "tel",      autocomplete: "tel",   required: false },
            { name: "password", label: "Şifre",    type: "password", autocomplete: "new-password", required: true },
          ].map((f) => (
            <div key={f.name}>
              <label className="mb-1 block text-sm font-semibold text-slate-700">{f.label}{f.required && " *"}</label>
              <input type={f.type} name={f.name} required={f.required} autoComplete={f.autocomplete}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]" />
            </div>
          ))}
          <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#0071c2] py-3 font-bold text-white hover:bg-[#003580] disabled:opacity-50">
            {pending ? "Kaydediliyor..." : "Kayıt Ol"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="font-semibold text-[#0071c2] hover:underline">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
