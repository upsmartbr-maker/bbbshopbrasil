"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  GripVertical,
  Heading3,
  ImagePlus,
  Italic,
  List,
  Package,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { formatBRL, slugify } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { ColorVariant, ProductWithImages } from "@/types/database";

interface EditableImage {
  id: string;
  image_url: string;
  order_index: number;
}

const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: "Preto", hex: "#1A1A1A" },
  { name: "Golden Rose", hex: "#C58C72" },
  { name: "Cereja Gourmet", hex: "#9E2A2B" },
  { name: "Crema Marfim", hex: "#E8DEC8" },
  { name: "Inox Escovado", hex: "#B8BDC4" },
];

const PAGE_SIZE = 6;

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = React.useState<ProductWithImages[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [stockFilter, setStockFilter] = React.useState<
    "all" | "in_stock" | "low" | "out"
  >("all");
  const [page, setPage] = React.useState(1);

  // Estado do Modal / Formulário de Criação/Edição
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [previewDesc, setPreviewDesc] = React.useState(false);
  const [price, setPrice] = React.useState("");
  const [compareAtPrice, setCompareAtPrice] = React.useState("");
  const [stock, setStock] = React.useState("10");
  const [isFeatured, setIsFeatured] = React.useState(true);
  const [images, setImages] = React.useState<EditableImage[]>([]);
  const [imageUrlInput, setImageUrlInput] = React.useState("");
  const [variants, setVariants] = React.useState<ColorVariant[]>([]);
  const [newColorName, setNewColorName] = React.useState("");
  const [newColorHex, setNewColorHex] = React.useState("#1A1A1A");
  const [uploadingVariantIdx, setUploadingVariantIdx] = React.useState<
    number | null
  >(null);
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const descRef = React.useRef<HTMLTextAreaElement | null>(null);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Busca + filtro de estoque
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (stockFilter === "in_stock") return p.stock > 5;
      if (stockFilter === "low") return p.stock > 0 && p.stock <= 5;
      if (stockFilter === "out") return p.stock <= 0;
      return true;
    });
  }, [products, search, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const openCreateForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setSlugManuallyEdited(false);
    setDescription("");
    setPreviewDesc(false);
    setPrice("");
    setCompareAtPrice("");
    setStock("15");
    setIsFeatured(true);
    setImages([]);
    setImageUrlInput("");
    setVariants([]);
    setNewColorName("");
    setNewColorHex("#1A1A1A");
    setErrorMsg(null);
    setFormOpen(true);
  };

  const openEditForm = (product: ProductWithImages) => {
    setEditingId(product.id);
    setName(product.name);
    setSlug(product.slug);
    setSlugManuallyEdited(true);
    setDescription(product.description ?? "");
    setPreviewDesc(false);
    setPrice(String(product.price));
    setCompareAtPrice(
      product.compare_at_price ? String(product.compare_at_price) : ""
    );
    setStock(String(product.stock));
    setIsFeatured(Boolean(product.is_featured));
    const initialImgs =
      product.product_images && product.product_images.length > 0
        ? [...product.product_images].sort(
            (a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0)
          )
        : product.image_url
          ? [
              {
                id: `main-${product.id}`,
                product_id: product.id,
                image_url: product.image_url,
                order_index: 0,
              },
            ]
          : [];

    setImages(
      initialImgs.slice(0, 8).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        image_url: img.image_url,
        order_index: idx,
      }))
    );
    setVariants(
      Array.isArray(product.variants)
        ? product.variants.map((v) => ({
            name: v.name,
            hex: v.hex || "#1A1A1A",
            images: Array.isArray(v.images) ? [...v.images] : [],
          }))
        : []
    );
    setNewColorName("");
    setNewColorHex("#1A1A1A");
    setImageUrlInput("");
    setErrorMsg(null);
    setFormOpen(true);
  };

  const handleNameChange = (nextName: string) => {
    setName(nextName);
    if (!slugManuallyEdited) {
      setSlug(slugify(nextName));
    }
  };

  // Barra de ferramentas de Rich Text / Markdown básico
  const insertMarkdown = (prefix: string, suffix = "") => {
    const el = descRef.current;
    if (!el) {
      setDescription((prev) => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart ?? description.length;
    const end = el.selectionEnd ?? description.length;
    const selected = description.slice(start, end) || "texto";
    const next =
      description.slice(0, start) +
      prefix +
      selected +
      suffix +
      description.slice(end);
    setDescription(next);
  };

  // Upload múltiplo direto para o bucket 'products' do Supabase Storage (até 8 imagens por produto)
  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const remainingSlots = 8 - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg("O limite máximo de 8 imagens por produto já foi atingido.");
      e.target.value = "";
      return;
    }

    const filesToUpload = Array.from(fileList).slice(0, remainingSlots);
    const startIndex = images.length;
    setUploadingImages(true);
    setErrorMsg(null);

    try {
      const uploaded: EditableImage[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const explicitOrderIndex = startIndex + i;
        // Nome do arquivo sem espaços ou caracteres especiais
        const cleanFileName = file.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "");
        const filePath = `${Date.now()}-${explicitOrderIndex}-${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro no upload do Storage:", uploadError);
          alert("Erro ao enviar imagem: " + uploadError.message);
          setErrorMsg("Erro ao enviar imagem: " + uploadError.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(filePath);

        if (publicUrl) {
          uploaded.push({
            id: `up-${Date.now()}-${explicitOrderIndex}-${Math.random().toString(36).slice(2, 7)}`,
            image_url: publicUrl,
            order_index: explicitOrderIndex,
          });
        }
      }

      if (uploaded.length > 0) {
        setImages((prev) =>
          [...prev, ...uploaded].slice(0, 8).map((img, idx) => ({
            ...img,
            order_index: idx,
          }))
        );
      }
    } catch (err) {
      console.error("Erro no upload do Storage:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao enviar imagens para o Supabase Storage.";
      alert("Erro ao enviar imagem: " + message);
      setErrorMsg("Erro ao enviar imagem: " + message);
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleAddImageUrl = () => {
    const clean = imageUrlInput.trim();
    if (!clean) return;
    if (images.length >= 8) {
      setErrorMsg("Limite de 8 imagens por produto atingido.");
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        image_url: clean,
        order_index: prev.length,
      },
    ]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((img, idx) => ({ ...img, order_index: idx }))
    );
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    setImages((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy.map((img, idx) => ({ ...img, order_index: idx }));
    });
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDropOn = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    moveImage(dragIndex, targetIndex);
    setDragIndex(null);
  };

  // Gerenciamento de Variações de Cores (variants JSONB)
  const handleAddColorVariant = (presetName?: string, presetHex?: string) => {
    const cleanName = (presetName ?? newColorName).trim();
    const cleanHex = (presetHex ?? newColorHex).trim() || "#1A1A1A";
    if (!cleanName) {
      setErrorMsg("Informe o nome da cor (ex: Preto, Golden Rose).");
      return;
    }
    if (
      variants.some((v) => v.name.toLowerCase() === cleanName.toLowerCase())
    ) {
      setErrorMsg(`A cor "${cleanName}" já foi adicionada.`);
      return;
    }

    setVariants((prev) => [
      ...prev,
      {
        name: cleanName,
        hex: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleanHex)
          ? cleanHex
          : "#1A1A1A",
        images: [],
      },
    ]);
    if (!presetName) {
      setNewColorName("");
    }
    setErrorMsg(null);
  };

  const handleRemoveColorVariant = (variantIdx: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== variantIdx));
  };

  const handleUpdateVariantMeta = (
    variantIdx: number,
    patch: Partial<Pick<ColorVariant, "name" | "hex">>
  ) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === variantIdx ? { ...v, ...patch } : v))
    );
  };

  const handleToggleVariantImage = (variantIdx: number, imageUrl: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIdx) return v;
        const exists = v.images.includes(imageUrl);
        return {
          ...v,
          images: exists
            ? v.images.filter((u) => u !== imageUrl)
            : [...v.images, imageUrl],
        };
      })
    );
  };

  const handleUploadVariantFiles = async (
    variantIdx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesToUpload = Array.from(fileList).slice(0, 8);
    setUploadingVariantIdx(variantIdx);
    setErrorMsg(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const cleanFileName = file.name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9._-]/g, "");
        const filePath = `${Date.now()}-${cleanFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          console.error("Erro no upload do Storage:", uploadError);
          alert("Erro ao enviar imagem: " + uploadError.message);
          setErrorMsg("Erro ao enviar imagem: " + uploadError.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(filePath);

        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setVariants((prev) =>
          prev.map((v, idx) =>
            idx === variantIdx
              ? {
                  ...v,
                  images: Array.from(new Set([...v.images, ...uploadedUrls])),
                }
              : v
          )
        );

        // Também sincroniza com a galeria principal do produto se houver espaço (até 8 fotos)
        setImages((prev) => {
          const existingUrls = new Set(prev.map((img) => img.image_url));
          const additions: EditableImage[] = [];
          for (const url of uploadedUrls) {
            if (!existingUrls.has(url) && prev.length + additions.length < 8) {
              additions.push({
                id: `var-up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                image_url: url,
                order_index: prev.length + additions.length,
              });
              existingUrls.add(url);
            }
          }
          return [...prev, ...additions].map((img, i) => ({
            ...img,
            order_index: i,
          }));
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao enviar fotos da cor.";
      alert("Erro ao enviar imagem: " + msg);
      setErrorMsg("Erro ao enviar imagem: " + msg);
    } finally {
      setUploadingVariantIdx(null);
      e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (uploadingImages || uploadingVariantIdx !== null) {
      setErrorMsg("Aguarde a conclusão do envio das imagens antes de salvar.");
      return;
    }

    const parsedPrice = Number(String(price).replace(",", "."));
    const parsedCompare = compareAtPrice
      ? Number(String(compareAtPrice).replace(",", "."))
      : null;
    const parsedStock = Math.max(0, Math.floor(Number(stock || 0)));

    if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg("Preencha o nome do produto e um preço de venda válido.");
      return;
    }

    // Se o usuário digitou uma cor nova nos campos e não clicou em "Adicionar Cor", inclui automaticamente
    const finalVariants = [...variants];
    if (
      newColorName.trim() &&
      !finalVariants.some(
        (v) => v.name.toLowerCase() === newColorName.trim().toLowerCase()
      )
    ) {
      finalVariants.push({
        name: newColorName.trim(),
        hex: newColorHex.trim() || "#1A1A1A",
        images: [],
      });
    }

    // Se o usuário digitou/colou uma URL no campo de imagem sem clicar em "Adicionar URL", inclui automaticamente
    const finalImages = [...images];
    if (imageUrlInput.trim() && finalImages.length < 8) {
      finalImages.push({
        id: `url-${Date.now()}`,
        image_url: imageUrlInput.trim(),
        order_index: finalImages.length,
      });
    }

    // Caso o produto possua fotos nas variações de cor mas a galeria principal esteja vazia, usa as fotos das cores
    if (finalImages.length === 0 && finalVariants.length > 0) {
      for (const v of finalVariants) {
        for (const url of v.images) {
          if (
            finalImages.length < 8 &&
            !finalImages.some((i) => i.image_url === url)
          ) {
            finalImages.push({
              id: `vimg-${finalImages.length}`,
              image_url: url,
              order_index: finalImages.length,
            });
          }
        }
      }
    }

    const orderedImages = finalImages.slice(0, 8).map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      order_index: idx,
    }));

    // A foto com order_index: 0 é obrigatoriamente a capa principal do produto
    const primaryImageUrl =
      orderedImages[0]?.image_url ?? finalVariants[0]?.images?.[0] ?? null;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId ?? undefined,
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          description: description.trim() || null,
          price: parsedPrice,
          compare_at_price: parsedCompare,
          is_featured: isFeatured,
          stock: parsedStock,
          image_url: primaryImageUrl,
          images: orderedImages,
          variants: finalVariants,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Não foi possível salvar o produto.");
        setSaving(false);
        return;
      }

      setFormOpen(false);
      await fetchProducts();
      router.refresh();
      showToast(
        editingId
          ? `Produto "${name.trim()}" atualizado com sucesso!`
          : `Produto "${name.trim()}" criado com sucesso!`
      );
    } catch {
      setErrorMsg("Erro de comunicação ao salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product: ProductWithImages) => {
    const res = await fetch(
      `/api/admin/products?id=${encodeURIComponent(product.id)}`,
      { method: "DELETE", cache: "no-store" }
    );
    if (res.ok) {
      await fetchProducts();
      router.refresh();
      showToast(`Produto "${product.name}" removido.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Módulo de Produtos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie o catálogo, preços, estoque, destaques da vitrine e galeria
            de até 8 fotos no Supabase Storage.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Produto</span>
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

      {/* Barra de Busca e Filtro de Estoque */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar produto por nome, slug ou descrição..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Todos" },
              { id: "in_stock", label: "Em Estoque" },
              { id: "low", label: "Estoque Baixo" },
              { id: "out", label: "Sem Estoque" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setStockFilter(f.id);
                setPage(1);
              }}
              className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors ${
                stockFilter === f.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Produtos com Paginação */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Produto</th>
                <th className="px-6 py-3.5">Preço ("De / Por")</th>
                <th className="px-6 py-3.5">Status de Estoque</th>
                <th className="px-6 py-3.5">Fotos</th>
                <th className="px-6 py-3.5">Destaque Home</th>
                <th className="px-6 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Carregando produtos...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum produto encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                paginated.map((product) => {
                  const sortedImgs = Array.isArray(product.product_images)
                    ? [...product.product_images].sort(
                        (a, b) =>
                          Number(a.order_index ?? 0) -
                          Number(b.order_index ?? 0)
                      )
                    : [];
                  const cover =
                    sortedImgs[0]?.image_url || product.image_url || undefined;
                  const imgCount = sortedImgs.length;

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC]">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="truncate font-mono text-xs text-slate-400">
                              /{product.slug}
                            </p>
                            {Array.isArray(product.variants) &&
                              product.variants.length > 0 && (
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {product.variants.map((v, vIdx) => (
                                    <span
                                      key={`${v.name}-${vIdx}`}
                                      className="inline-flex items-center gap-1 rounded border border-slate-200 bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                                    >
                                      <span
                                        style={{ backgroundColor: v.hex }}
                                        className="h-2.5 w-2.5 rounded-xs border border-black/20"
                                      />
                                      {v.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="font-bold text-slate-900">
                          {formatBRL(product.price)}
                        </p>
                        {product.compare_at_price &&
                          product.compare_at_price > product.price && (
                            <p className="text-xs text-slate-400 line-through">
                              De {formatBRL(product.compare_at_price)}
                            </p>
                          )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {product.stock <= 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            Sem estoque (0 un.)
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Estoque baixo ({product.stock} un.)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Em estoque ({product.stock} un.)
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600">
                        <span className="rounded-md border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 font-medium">
                          {imgCount}/8 fotos
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {product.is_featured ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            Destaque
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Padrão</span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditForm(product)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            aria-label={`Excluir ${product.name}`}
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50/50 px-2 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé de Paginação */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-[#F8FAFC] px-6 py-4 sm:flex-row">
          <p className="text-xs text-slate-500">
            Mostrando <strong>{paginated.length}</strong> de{" "}
            <strong>{filtered.length}</strong> produtos • Página{" "}
            <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold ${
                    pageNum === currentPage
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <span>Próxima</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Criação / Edição de Produto */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingId ? "Editar Produto" : "Novo Produto"}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-xs sm:p-6"
        >
          <div className="my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#F8FAFC] px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
                </h2>
                <p className="text-xs text-slate-500">
                  Preencha as informações do produto e organize até 8 fotos por
                  drag-and-drop.
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

            <form onSubmit={handleSaveProduct} className="space-y-6 p-6">
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700"
                >
                  {errorMsg}
                </div>
              )}

              {/* Nome e Slug Automático */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex.: Caçarola Gourmet Revestimento Cerâmico 28 cm"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Slug da URL (Automático)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setSlug(slugify(name));
                        setSlugManuallyEdited(false);
                      }}
                      className="text-[11px] font-semibold text-slate-500 underline hover:text-slate-900"
                    >
                      Regerar do nome
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="cacarola-gourmet-revestimento-ceramico-28-cm"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 font-mono text-xs text-slate-700 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Preço de Venda, Preço Comparativo, Estoque e Destaque */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="389.90"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Preço "De" (Comparativo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="459.90"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-700 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Estoque (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isFeatured}
                    onClick={() => setIsFeatured((v) => !v)}
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-left transition-colors ${
                      isFeatured
                        ? "border-amber-300 bg-amber-50/70 text-slate-900"
                        : "border-slate-200 bg-[#F8FAFC] text-slate-600"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      Destaque na Home
                    </span>
                    <span
                      className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
                        isFeatured ? "bg-slate-900" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white transition-transform ${
                          isFeatured ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>

              {/* Descrição Detalhada com Rich Text Básico / Markdown */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Descrição Detalhada (Rich Text / Markdown)
                  </label>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-[#F8FAFC] p-1">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("**", "**")}
                      title="Negrito"
                      className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("*", "*")}
                      title="Itálico"
                      className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n### ")}
                      title="Subtítulo"
                      className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <Heading3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("\n- ")}
                      title="Lista de benefícios"
                      className="rounded p-1.5 text-slate-600 hover:bg-white hover:text-slate-900"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDesc((v) => !v)}
                      className={`ml-1 inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${
                        previewDesc
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:bg-white"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>{previewDesc ? "Editar" : "Pré-visualizar"}</span>
                    </button>
                  </div>
                </div>

                {previewDesc ? (
                  <div className="mt-1.5 min-h-32 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {description || "Nenhuma descrição informada."}
                  </div>
                ) : (
                  <textarea
                    ref={descRef}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o revestimento antiaderente, espessura do alumínio, compatibilidade com fogão de indução e itens inclusos..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                )}
              </div>

              {/* Upload Múltiplo de até 8 Imagens com Drag-and-Drop e Exclusão Individual */}
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Galeria de Imagens do Produto ({images.length}/8)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Suba até 8 fotos (Supabase Storage bucket{" "}
                      <code>products</code>). Arraste os cards para reordenar; a
                      1ª foto é a capa principal.
                    </p>
                  </div>

                  <label
                    className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors ${
                      images.length >= 8 || uploadingImages
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>
                      {uploadingImages
                        ? "Enviando..."
                        : "Selecionar Fotos (até 8)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={images.length >= 8 || uploadingImages}
                      onChange={handleFilesSelected}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Adição opcional por URL direta */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Ou cole a URL direta de uma imagem (https://...)"
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={images.length >= 8 || !imageUrlInput.trim()}
                    onClick={handleAddImageUrl}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>Adicionar URL</span>
                  </button>
                </div>

                {/* Grid de Imagens com Drag-and-Drop */}
                {images.length === 0 ? (
                  <div className="mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-8 text-center">
                    <ImagePlus className="h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Nenhuma imagem adicionada. Clique em "Selecionar Fotos"
                      acima para enviar até 8 imagens.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropOn(idx)}
                        className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-2xs transition-all ${
                          dragIndex === idx
                            ? "border-slate-900 opacity-50 ring-2 ring-slate-900"
                            : idx === 0
                              ? "border-amber-400 ring-1 ring-amber-400"
                              : "border-slate-200"
                        }`}
                      >
                        <div className="relative aspect-square w-full bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.image_url}
                            alt={`Foto ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-2xs">
                            <GripVertical className="h-3 w-3 cursor-grab text-slate-400" />
                            <span>
                              {idx === 0 ? "1 • Principal" : `#${idx + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            aria-label={`Remover foto ${idx + 1}`}
                            className="absolute right-2 top-2 rounded-md bg-white/95 p-1 text-rose-600 shadow-2xs hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 bg-[#F8FAFC] px-2 py-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveImage(idx, idx - 1)}
                            title="Mover para esquerda"
                            className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowLeft className="h-3 w-3" />
                          </button>
                          <span className="text-[10px] font-medium text-slate-400">
                            Arraste p/ ordenar
                          </span>
                          <button
                            type="button"
                            disabled={idx === images.length - 1}
                            onClick={() => moveImage(idx, idx + 1)}
                            title="Mover para direita"
                            className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Módulo de Variações de Cores (Nome + Hex + Fotos por Cor) */}
              <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Variações de Cores e Galeria por Cor ({variants.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cadastre as cores disponíveis (ex: Preto, Golden Rose) e
                      associe as fotos específicas de cada cor. Ao selecionar a
                      cor na vitrine, a galeria troca automaticamente.
                    </p>
                  </div>
                </div>

                {/* Atalhos rápidos de cores da linha BBB Shop Brasil */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Cores rápidas:
                  </span>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        handleAddColorVariant(preset.name, preset.hex)
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-900"
                    >
                      <span
                        style={{ backgroundColor: preset.hex }}
                        className="h-3 w-3 rounded-xs border border-black/20"
                      />
                      <span>+ {preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Campos para adicionar nova cor personalizada */}
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Nome da cor (ex: Preto, Golden Rose)"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-4">
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(newColorHex)
                          ? newColorHex
                          : "#1A1A1A"
                      }
                      onChange={(e) => setNewColorHex(e.target.value)}
                      aria-label="Seletor visual de cor hexadecimal"
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#1A1A1A"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-xs uppercase text-slate-800 focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => handleAddColorVariant()}
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar Cor</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Cores Cadastradas e Fotos Associadas */}
                {variants.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {variants.map((variant, vIdx) => (
                      <div
                        key={`${variant.name}-${vIdx}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <input
                              type="color"
                              value={
                                /^#[0-9a-fA-F]{6}$/.test(variant.hex)
                                  ? variant.hex
                                  : "#1A1A1A"
                              }
                              onChange={(e) =>
                                handleUpdateVariantMeta(vIdx, {
                                  hex: e.target.value,
                                })
                              }
                              className="h-8 w-8 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                            />
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) =>
                                handleUpdateVariantMeta(vIdx, {
                                  name: e.target.value,
                                })
                              }
                              className="h-8 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2.5 text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
                            />
                            <input
                              type="text"
                              value={variant.hex}
                              onChange={(e) =>
                                handleUpdateVariantMeta(vIdx, {
                                  hex: e.target.value,
                                })
                              }
                              className="h-8 w-24 rounded-lg border border-slate-200 bg-[#F8FAFC] px-2 font-mono text-xs uppercase text-slate-600 focus:border-slate-900 focus:bg-white focus:outline-none"
                            />
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                              {variant.images.length}{" "}
                              {variant.images.length === 1
                                ? "foto associada"
                                : "fotos associadas"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-[11px] font-semibold text-white transition hover:bg-slate-800">
                              <Upload className="h-3.5 w-3.5" />
                              <span>
                                {uploadingVariantIdx === vIdx
                                  ? "Enviando..."
                                  : "Subir fotos desta cor"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploadingVariantIdx !== null}
                                onChange={(e) =>
                                  handleUploadVariantFiles(vIdx, e)
                                }
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveColorVariant(vIdx)}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remover Cor</span>
                            </button>
                          </div>
                        </div>

                        {/* Seleção com 1 clique das fotos já enviadas na galeria do produto */}
                        {images.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[11px] font-semibold text-slate-500">
                              Clique nas fotos da galeria abaixo para vincular /
                              desvincular da cor{" "}
                              <strong className="text-slate-800">
                                {variant.name}
                              </strong>
                              :
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {images.map((img, iIdx) => {
                                const isLinked = variant.images.includes(
                                  img.image_url
                                );
                                return (
                                  <button
                                    key={`${variant.name}-link-${img.id}-${iIdx}`}
                                    type="button"
                                    onClick={() =>
                                      handleToggleVariantImage(
                                        vIdx,
                                        img.image_url
                                      )
                                    }
                                    className={`relative h-14 w-14 overflow-hidden rounded-lg border-2 transition ${
                                      isLinked
                                        ? "border-emerald-600 ring-2 ring-emerald-500/30"
                                        : "border-slate-200 opacity-60 hover:opacity-100"
                                    }`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={img.image_url}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                    {isLinked && (
                                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Fotos exclusivas já associadas a esta cor */}
                        {variant.images.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            <p className="text-[11px] font-semibold text-slate-500">
                              Ordem das fotos da cor {variant.name}:
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {variant.images.map((url, uIdx) => (
                                <div
                                  key={`${url}-${uIdx}`}
                                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleVariantImage(vIdx, url)
                                    }
                                    title="Desvincular foto desta cor"
                                    className="absolute right-1 top-1 rounded bg-white/90 p-0.5 text-rose-600 shadow-2xs hover:bg-rose-50"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões do Formulário */}
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
                  disabled={saving || uploadingImages}
                  className="h-11 rounded-xl bg-slate-900 px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  {uploadingImages
                    ? "Enviando fotos..."
                    : saving
                      ? "Salvando..."
                      : editingId
                        ? "Salvar Alterações"
                        : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

