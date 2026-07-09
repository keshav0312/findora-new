"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { LiveMap } from "./live-map";
import { LocationSearch, GeoResult } from "./location-search";

export function ReportForm({ kind }: { kind: "lost" | "found" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    color: "",
    brand: "",
    location: "",
    city: "",
    contactPhone: "",
    date: "",
    reward: "",
  });
  const [questions, setQuestions] = useState<{ question: string; answer: string }[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onGeoSelect = (r: GeoResult) => {
    setPickedLocation({ lat: r.lat, lng: r.lng });
    setMapCenter({ lat: r.lat, lng: r.lng });
    setForm((f) => ({
      ...f,
      location: r.label,
      city: f.city || r.city || "",
    }));
  };

  const addQuestion = () => setQuestions([...questions, { question: "", answer: "" }]);
  const updateQuestion = (i: number, key: "question" | "answer", value: string) => {
    const next = [...questions];
    next[i] = { ...next[i], [key]: value };
    setQuestions(next);
  };
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, 5));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (pickedLocation) {
        fd.append("lat", String(pickedLocation.lat));
        fd.append("lng", String(pickedLocation.lng));
      }
      if (kind === "lost" && questions.length) {
        fd.append("verificationQuestions", JSON.stringify(questions.filter((q) => q.question)));
      }
      photos.forEach((p) => fd.append("photos", p));

      const res = await api.post<{ data: { _id: string }; matches: number }>(
        `/${kind}`,
        fd
      );
      router.push(`/items/${kind}/${res.data._id}?justSubmitted=1`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong submitting your report.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
        <h1 className="font-heading text-xl font-bold text-slate-900">
          Report {kind === "lost" ? "Lost" : "Found"} Item
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Item name" required value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Black Wallet" />
          <SelectField
            label="Category"
            required
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            options={CATEGORIES}
          />
          <TextField label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="e.g. Black" />
          <TextField label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} placeholder="e.g. Wildcraft" />
        </div>

        <TextArea
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="Any distinguishing details that would help identify it..."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Location" required value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. DB Mall, Food Court" />
          <TextField label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="e.g. Bhopal" />
          <TextField label={`Date ${kind}`} required type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          {kind === "lost" && (
            <TextField label="Reward (₹, optional)" type="number" value={form.reward} onChange={(v) => setForm({ ...form, reward: v })} placeholder="1000" />
          )}
        </div>

        <div>
          <TextField
            label="Mobile number"
            required
            type="tel"
            value={form.contactPhone}
            onChange={(v) => setForm({ ...form, contactPhone: v })}
            placeholder="e.g. 9876543210"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">
            Used to alert you by WhatsApp if a match turns up within 5 km, and shown to the other
            party once you're matched so you can coordinate the handover.
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Photos (up to 5)</span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-8 text-slate-400 hover:border-brand-indigo hover:text-brand-indigo">
            <Upload className="size-6" />
            <span className="text-xs">Click to upload photos</span>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </label>
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {p.name.slice(0, 18)}
                  <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}>
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {kind === "lost" && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Verification questions (only you'll see the answers)
              </span>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 text-xs font-semibold text-brand-indigo hover:underline"
              >
                <Plus className="size-3.5" /> Add question
              </button>
            </div>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input-plain"
                    placeholder="Question (e.g. What brand?)"
                    value={q.question}
                    onChange={(e) => updateQuestion(i, "question", e.target.value)}
                  />
                  <input
                    className="input-plain"
                    placeholder="Answer"
                    value={q.answer}
                    onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                  />
                  <button type="button" onClick={() => removeQuestion(i)} className="shrink-0 text-slate-400 hover:text-brand-red">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-brand-red">{error}</p>}

        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-indigo py-3 text-sm font-semibold text-white shadow-sm shadow-brand-indigo/30 hover:bg-brand-indigo-dark disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Submit Report
        </button>
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">Tips for a faster match</p>
          <ul className="mt-3 space-y-2 text-xs text-slate-500">
            <li>• Be specific about color, brand, and any unique marks.</li>
            <li>• Pin the closest landmark, not just the city.</li>
            <li>• Add a photo whenever possible — it boosts your match score.</li>
            <li>• Report as soon as possible; matches use recent reports first.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-heading text-sm font-semibold text-slate-900">Pin the exact spot</p>
          <p className="mt-1 text-xs text-slate-500">
            Search for the place where you {kind === "lost" ? "lost" : "found"} the item, or tap the
            map to drop a pin — this powers location-based AI matching.
          </p>
          <div className="mt-3">
            <LocationSearch
              onSelect={onGeoSelect}
              placeholder={`Search where you ${kind === "lost" ? "lost" : "found"} it…`}
            />
          </div>
          <div className="mt-3">
            <LiveMap
              className="aspect-square w-full"
              pickable
              center={mapCenter}
              pickedLocation={pickedLocation}
              onPick={setPickedLocation}
            />
          </div>
          {pickedLocation && (
            <p className="mt-2 text-xs text-slate-400">
              📍 {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-plain"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-plain resize-none"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-plain"
      >
        <option value="">Select category</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}