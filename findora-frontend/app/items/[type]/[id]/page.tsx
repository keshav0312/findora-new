"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Tag,
  Palette,
  Gift,
  MessageCircle,
  Phone,
  CheckCircle2,
  ImageOff,
  Pencil,
  Trash2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusPill, Avatar } from "@/components/ui-bits";
import { LiveMap } from "@/components/live-map";
import { TrackingStepper, DEFAULT_TRACKING_STEPS } from "@/components/tracking-stepper";
import { api, ApiError } from "@/lib/api";
import { Report } from "@/lib/types";
import { formatDate, resolveImage, currency } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

export default function ItemDetailsPage() {
  const params = useParams<{ type: string; id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const kind = params.type === "found" ? "found" : "lost";

  const [item, setItem] = useState<Report | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ data: Report }>(`/${kind}/${params.id}`)
      .then((r) => setItem(r.data))
      .finally(() => setLoading(false));
  }, [kind, params.id]);

  const isOwner = item && user && (typeof item.owner === "string" ? item.owner : item.owner._id) === user.id;

  const resolve = async () => {
    if (!item) return;
    setBusy(true);
    try {
      const res = await api.patch<{ data: Report }>(`/${kind}/${item._id}/resolve`);
      setItem(res.data);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update this report.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!item || !confirm("Delete this report? This can't be undone.")) return;
    setBusy(true);
    try {
      await api.delete(`/${kind}/${item._id}`);
      router.push("/my-reports");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not delete this report.");
      setBusy(false);
    }
  };

  return (
    <DashboardShell>
      {search.get("justSubmitted") === "1" && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-brand-green">
          <CheckCircle2 className="size-4.5" />
          Report submitted! We'll notify you the moment a likely match comes in.
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">Loading report...</p>}

      {!loading && !item && <p className="text-sm text-slate-400">Report not found.</p>}

      {item && (
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-heading text-xl font-bold text-slate-900">{item.title}</h1>
                    <StatusPill status={kind} />
                    <StatusPill status={item.status} />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <Tag className="size-3.5" /> {item.category}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Link href={`/report/${kind}`} className="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-brand-indigo">
                      <Pencil className="size-4" />
                    </Link>
                    <button onClick={remove} disabled={busy} className="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-brand-red">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                {item.photos?.length ? (
                  <Image
                    src={resolveImage(item.photos[activePhoto])!}
                    alt={item.title}
                    width={800}
                    height={450}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-slate-300">
                    <ImageOff className="size-10" />
                  </div>
                )}
              </div>
              {item.photos?.length > 1 && (
                <div className="mt-2 flex gap-2">
                  {item.photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`size-14 overflow-hidden rounded-lg border-2 ${
                        activePhoto === i ? "border-brand-indigo" : "border-transparent"
                      }`}
                    >
                      <Image src={resolveImage(p)!} alt="" width={56} height={56} unoptimized className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-5 text-sm leading-relaxed text-slate-600">
                {item.description || "No additional description provided."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <Detail icon={Palette} label="Color" value={item.color || "—"} />
                <Detail icon={Tag} label="Brand" value={item.brand || "—"} />
                <Detail icon={Calendar} label={`Date ${kind}`} value={formatDate(item.date)} />
                <Detail icon={MapPin} label="Location" value={`${item.location}${item.city ? ", " + item.city : ""}`} />
                {kind === "lost" && item.reward > 0 && (
                  <Detail icon={Gift} label="Reward" value={currency(item.reward)} />
                )}
              </div>

              {isOwner && item.verificationQuestions?.length > 0 && (
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-600">Your verification questions</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-500">
                    {item.verificationQuestions.map((q, i) => (
                      <li key={i}>
                        <span className="font-medium text-slate-700">{q.question}</span>
                        {q.answer ? ` — ${q.answer}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isOwner && item.status !== "closed" && (
                <button
                  onClick={resolve}
                  disabled={busy}
                  className="mt-6 flex items-center gap-2 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  <CheckCircle2 className="size-4" /> Mark as returned / resolved
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-4 font-heading text-sm font-semibold text-slate-900 dark:text-slate-100">
                Item journey
              </p>
              <TrackingStepper
                steps={DEFAULT_TRACKING_STEPS.map((s, i) => ({
                  ...s,
                  date: i === 0 ? formatDate(item.createdAt) : null,
                }))}
                activeIndex={item.status === "closed" ? 5 : item.status === "matched" ? 3 : 1}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 font-heading text-sm font-semibold text-slate-900">Reported by</p>
              <div className="flex items-center gap-3">
                <Avatar
                  name={typeof item.owner === "string" ? "User" : item.owner.name}
                  src={typeof item.owner === "string" ? null : item.owner.avatar}
                  size={10}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {typeof item.owner === "string" ? "Findora user" : item.owner.name}
                  </p>
                  <p className="text-xs text-slate-500">Member since {formatDate(item.createdAt)}</p>
                </div>
              </div>

              {isOwner && item.contactPhone && (
                <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Phone className="size-3.5" /> Your contact number: {item.contactPhone}
                </p>
              )}

              {!isOwner && (
                <>
                  {item.contactPhone && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${item.contactPhone}`}
                        className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Phone className="size-4" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${item.contactPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-brand-green transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                      >
                        <MessageCircle className="size-4" /> WhatsApp
                      </a>
                    </div>
                  )}
                  <Link
                    href="/matches"
                    className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand-indigo py-2.5 text-sm font-semibold text-white hover:bg-brand-indigo-dark"
                  >
                    <MessageCircle className="size-4" /> Contact via matches
                  </Link>
                </>
              )}
            </div>
            <LiveMap
              className="aspect-square w-full"
              pins={
                item.coordinates?.lat && item.coordinates?.lng
                  ? [
                      {
                        id: item._id,
                        lat: item.coordinates.lat,
                        lng: item.coordinates.lng,
                        label: item.title,
                        sublabel: item.location,
                      },
                    ]
                  : []
              }
              center={
                item.coordinates?.lat && item.coordinates?.lng
                  ? { lat: item.coordinates.lat, lng: item.coordinates.lng }
                  : undefined
              }
              zoom={15}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Detail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}