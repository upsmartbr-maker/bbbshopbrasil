"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  ExternalLink,
  GripVertical,
  Images,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Banner } from "@/types/database";

export default function AdminBannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [subtitle, setSubtitle] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [buttonText, setButtonText] = React.useState("Conhecer coleção");
  const [link, setLink] = React.useState("/produtos");
  const [orderIndex, setOrderIndex] = React.useState("1");
  const [isActive, setIsActive] = React.useState(true);

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const fetchBanners = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banners", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data.banners) ? data.banners : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setButtonText("Conhecer coleção");
    setLink("/produtos");
    setOrderIndex(String(banners.length + 1));
    setIsActive(true);
    setErrorMsg(null);
    setFormOpen(true);
  };

  const openEditForm = (banner: Banner) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle ?? "");
    setImageUrl(banner.image_url);
    setButtonText(banner.button_text ?? "");
    setLink(banner.link ?? "/produtos");
    setOrderIndex(String(banner.order_index));
    setIsActive(Boolean(banner.is_active));
    setErrorMsg(null);
    setFormOpen(true);
  };

  const handleBannerFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "banners");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        setImageUrl(data.url);
      } else {
        setErrorMsg(data.error || "Falha ao enviar imagem do banner.");
      }
    } catch {
      setErrorMsg("Erro ao enviar imagem para o Supabase Storage.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveBanner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Informe o título do banner.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          image_url: imageUrl.trim(),
          button_text: buttonText.trim() || null,
          link: link.trim() || "/produtos",
          order_index: Number(orderIndex || 1),
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Erro ao salvar banner.");
        setSaving(false);
        return;
      }

      setFormOpen(false);
      await fetchBanners();
      showToast(
        editingId
          ? `Banner "${title.trim()}" atualizado!`
          : `Banner "${title.trim()}" adicionado ao carrossel!`
      );
    } catch {
      setErrorMsg("Erro de comunicação ao salvar o banner.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBannerActive = async (banner: Banner) => {
    await fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...banner,
        is_active: !banner.is_active,
      }),
    });
    await fetchBanners();
    showToast(
      `Banner "${banner.title}" ${
        !banner.is_active ? "ativado" : "ocultado"
      } na vitrine.`
    );
  };

  const handleDeleteBanner = async (banner: Banner) => {
    const res = await fetch(
      `/api/admin/banners?id=${encodeURIComponent(banner.id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      await fetchBanners();
      showToast(`Banner "${banner.title}" removido.`);
    }
  };

  const reorderList = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= banners.length || fromIndex === toIndex)
      return;
    const next = [...banners];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setBanners(next.map((b, i) => ({ ...b, order_index: i + 1 })));

    await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderedIds: next.map((b) => b.id),
      }),
    });
    showToast("Ordem de exibição do carrossel atualizada!");
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Carrossel e Banners da Home
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Suba imagens para o carrossel principal, defina a ordem de exibição,
            textos e botões de chamada para ação.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Banner</span>
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Lista Visual de Banners */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Carregando banners do carrossel...
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Images className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              Nenhum banner cadastrado no carrossel
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Adicione seu primeiro destaque promocional para a página inicial.
            </p>
          </div>
        ) : (
          banners.map((banner, idx) => (
            <div
              key={banner.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx !== null && dragIdx !== idx) {
                  reorderList(dragIdx, idx);
                }
                setDragIdx(null);
              }}
              className={`flex flex-col justify-between gap-5 rounded-2xl border bg-white p-5 shadow-2xs transition-all md:flex-row md:items-center ${
                dragIdx === idx
                  ? "border-slate-900 opacity-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                {/* Controles de Ordem */}
                <div className="flex items-center gap-2 sm:flex-col">
                  <GripVertical className="h-4 w-4 cursor-grab text-slate-400" />
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F8FAFC] border border-slate-200 text-xs font-bold text-slate-800">
                    {idx + 1}º
                  </span>
                  <div className="flex gap-1 sm:flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderList(idx, idx - 1)}
                      title="Subir posição"
                      className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === banners.length - 1}
                      onClick={() => reorderList(idx, idx + 1)}
                      title="Descer posição"
                      className="rounded border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Preview da Imagem */}
                <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC] sm:w-52">
                  {banner.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Images className="h-6 w-6" />
                      <span className="mt-1 text-[10px]">
                        Fundo tipográfico elegante
                      </span>
                    </div>
                  )}
                </div>

                {/* Textos e Link */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      {banner.title}
                    </h2>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        banner.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {banner.is_active ? "Ativo no site" : "Inativo"}
                    </span>
                  </div>
                  {banner.subtitle && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    {banner.button_text && (
                      <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 font-medium">
                        Botão: "{banner.button_text}"
                      </span>
                    )}
                    {banner.link && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                        <ExternalLink className="h-3 w-3" />
                        {banner.link}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                <button
                  type="button"
                  onClick={() => handleToggleBannerActive(banner)}
                  className="h-9 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {banner.is_active ? "Ocultar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => openEditForm(banner)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBanner(banner)}
                  aria-label={`Excluir banner ${banner.title}`}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 text-rose-600 hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Criação / Edição de Banner */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Editar Banner" : "Novo Banner"}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs sm:p-6"
        >
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#F8FAFC] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Editar Banner" : "Novo Banner para o Carrossel"}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure a imagem, textos e botão de ação do slide.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-5 p-6">
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700"
                >
                  {errorMsg}
                </div>
              )}

              {/* Upload de Imagem */}
              <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Imagem do Banner (Supabase Storage `banners`)
                    </label>
                    <p className="text-xs text-slate-500">
                      Recomendado: 1600×600px (JPG, PNG ou WebP).
                    </p>
                  </div>

                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploading ? "Enviando..." : "Subir Imagem"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleBannerFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Ou informe a URL da imagem (ex.: https://...)"
                  className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                />

                {imageUrl && (
                  <div className="mt-3 h-36 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Prévia do banner"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Título Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex.: Coleção Gourmet Antiaderente"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Ex.: Alta condução térmica e design elegante para a sua cozinha."
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Texto do Botão (CTA)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Ver produtos"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Link de Destino
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="/produtos"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((v) => !v)}
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-xs font-semibold ${
                      isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-[#F8FAFC] text-slate-600"
                    }`}
                  >
                    <span>Banner Ativo na Home</span>
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${
                        isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${
                          isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-xl bg-slate-900 px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

