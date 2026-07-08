"use client";

import { useActionState, useState } from "react";
import { createReviewAction, type FormState } from "@/lib/actions";

export function ReviewForm({ apartmentId, canReview }: { apartmentId: number; canReview: boolean }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createReviewAction, {});
  const [rating, setRating] = useState(5);

  if (!canReview) {
    return (
      <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
        Değerlendirme yapmak için lütfen <a className="font-semibold text-[#0071c2]" href="/login">giriş yapın</a>.
      </p>
    );
  }

  if (state.ok) {
    return <p className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700">Yorumunuz için teşekkürler! 🎉</p>;
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-slate-200 p-4">
      <input type="hidden" name="apartmentId" value={apartmentId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            className={`text-2xl ${i <= rating ? "text-amber-400" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        required
        rows={3}
        placeholder="Konaklamanız nasıldı?"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0071c2]"
      />
      {state.error && <div className="text-sm text-red-600">{state.error}</div>}
      <button
        disabled={pending}
        className="rounded-lg bg-[#0071c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003580] disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Değerlendirme Gönder"}
      </button>
    </form>
  );
}
