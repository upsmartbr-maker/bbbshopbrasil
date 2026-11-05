"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Truck,
  XCircle,
} from "lucide-react";
import { formatBRL } from "@/lib/utils";
import type { GatewayName, Order, OrderStatus } from "@/types/database";

interface OverviewResponse {
  ok: boolean;
  metrics: {
    totalSales: number;
    ordersCount: number;
    activeProductsCount: number;
    totalProductsCount: number;
    averageTicket: number;
  };
  activeGateway: GatewayName;
  orders: Order[];
}

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Aguardando Pagamento",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock,
  },
  paid: {
    label: "Pago",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  shipped: {
    label: "Enviado",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-800",
    icon: Truck,
  },
  delivered: {
    label: "Entregue",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    icon: XCircle,
  },
  refunded: {
    label: "Reembolsado",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    icon: XCircle,
  },
};

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<OverviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [switchingGateway, setSwitchingGateway] = React.useState(false);
  const [updatingOrderId, setUpdatingOrderId] = React.useState<string | null>(
    null
  );
  const [feedback, setFeedback] = React.useState<string | null>(null);

  const fetchOverview = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as OverviewResponse;
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleGateway = async (nextGateway: GatewayName) => {
    if (!data || data.activeGateway === nextGateway || switchingGateway) return;
    setSwitchingGateway(true);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeGateway: nextGateway }),
      });
      if (res.ok) {
        setData((prev) =>
          prev ? { ...prev, activeGateway: nextGateway } : prev
        );
        showToast(
          `Gateway ativo alterado para ${
            nextGateway === "pagseguro" ? "PagSeguro (PagBank)" : "Mercado Pago"
          }.`
        );
      }
    } finally {
      setSwitchingGateway(false);
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    status: OrderStatus
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch("/api/admin/overview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        await fetchOverview();
        showToast(
          `Status do pedido #${orderId.slice(0, 8).toUpperCase()} atualizado para "${STATUS_META[status].label}".`
        );
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const metrics = data?.metrics ?? {
    totalSales: 0,
    ordersCount: 0,
    activeProductsCount: 0,
    totalProductsCount: 0,
    averageTicket: 0,
  };
  const activeGateway = data?.activeGateway ?? "mercadopago";
  const orders = data?.orders ?? [];

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Principal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral de vendas, pedidos recentes e controle rápido do gateway
            de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </button>
          <Link
            href="/admin/produtos"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-slate-800"
          >
            <span>Gerenciar Produtos</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 Cards de Métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total de Vendas (R$)
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {formatBRL(metrics.totalSales)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Receita acumulada (pedidos válidos)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pedidos Realizados
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {metrics.ordersCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Total de pedidos registrados na loja
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Produtos Ativos
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {metrics.activeProductsCount}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Com estoque disponível de {metrics.totalProductsCount} cadastrados
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ticket Médio
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {formatBRL(metrics.averageTicket)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Valor médio por pedido confirmado
          </p>
        </div>
      </div>

      {/* Seletor Rápido de Gateway de Pagamento Ativo (Switch Mercado Pago vs PagSeguro) */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#F8FAFC] text-slate-800">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Seletor Rápido de Gateway de Pagamento
                </h2>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Ativo no Checkout:{" "}
                  {activeGateway === "pagseguro" ? "PagSeguro" : "Mercado Pago"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Alterne instantaneamente qual provedor processa os pagamentos de
                Pix e Cartão de Crédito na página de checkout (`/api/checkout`).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch Segmentado + Toggle */}
            <div
              role="group"
              aria-label="Selecionar Gateway de Pagamento Ativo"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-[#F8FAFC] p-1"
            >
              <button
                type="button"
                disabled={switchingGateway}
                onClick={() => handleToggleGateway("mercadopago")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeGateway === "mercadopago"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeGateway === "mercadopago"
                      ? "bg-emerald-400"
                      : "bg-slate-300"
                  }`}
                />
                <span>Mercado Pago</span>
              </button>

              <button
                type="button"
                disabled={switchingGateway}
                onClick={() => handleToggleGateway("pagseguro")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                  activeGateway === "pagseguro"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    activeGateway === "pagseguro"
                      ? "bg-emerald-400"
                      : "bg-slate-300"
                  }`}
                />
                <span>PagSeguro (PagBank)</span>
              </button>
            </div>

            <Link
              href="/admin/configuracoes"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span>Chaves de API</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tabela de Últimos Pedidos */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Últimos Pedidos Realizados
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe e atualize o status dos pedidos em tempo real.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Exibindo {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Pedido</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5">Itens</th>
                <th className="px-6 py-3.5">Gateway</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum pedido registrado até o momento.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.pending;
                  const StatusIcon = meta.icon;
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce(
                        (n, i) => n + Number(i.quantity || 1),
                        0
                      )
                    : 1;

                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {new Date(order.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer_email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {itemCount} {itemCount === 1 ? "item" : "itens"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-md border border-slate-200 bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-slate-700">
                          {order.gateway === "pagseguro"
                            ? "PagSeguro"
                            : "Mercado Pago"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                        {formatBRL(Number(order.total))}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <select
                          aria-label={`Alterar status do pedido ${order.id.slice(0, 8)}`}
                          disabled={updatingOrderId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleOrderStatusChange(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none disabled:opacity-50"
                        >
                          <option value="pending">Aguardando Pagamento</option>
                          <option value="paid">Pago</option>
                          <option value="shipped">Enviado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
