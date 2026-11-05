import { NextResponse } from "next/server";
import {
  adminGetSettings,
  adminListOrders,
  adminListProducts,
  adminUpdateOrderStatus,
  adminUpdateSettings,
} from "@/lib/admin-store";
import type { GatewayName, OrderStatus } from "@/types/database";

export async function GET() {
  const [orders, products, settings] = await Promise.all([
    adminListOrders(),
    adminListProducts(),
    adminGetSettings(),
  ]);

  const validOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded"
  );
  const totalSales = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
  const ordersCount = orders.length;
  const activeProductsCount = products.filter((p) => p.stock > 0).length;
  const averageTicket =
    validOrders.length > 0 ? totalSales / validOrders.length : 0;

  return NextResponse.json({
    ok: true,
    metrics: {
      totalSales,
      ordersCount,
      activeProductsCount,
      totalProductsCount: products.length,
      averageTicket,
    },
    activeGateway: settings.active_gateway,
    orders: orders.slice(0, 25),
  });
}

export async function PATCH(request: Request) {
  let body: {
    orderId?: string;
    status?: OrderStatus;
    activeGateway?: GatewayName;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payload inválido." },
      { status: 400 }
    );
  }

  if (body.activeGateway) {
    const updated = await adminUpdateSettings({
      active_gateway: body.activeGateway,
    });
    return NextResponse.json({
      ok: true,
      activeGateway: updated.active_gateway,
    });
  }

  if (body.orderId && body.status) {
    const order = await adminUpdateOrderStatus(body.orderId, body.status);
    return NextResponse.json({
      ok: true,
      order,
    });
  }

  return NextResponse.json(
    { ok: false, error: "Nenhuma operação informada." },
    { status: 400 }
  );
}

