import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabaseAdmin";

function startOf(monthsAgo = 0) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toISOString();
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();
  const thisMonth = startOf(0);
  const lastMonth = startOf(1);
  const last14Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [allOrdersRes, topItemsRes, recentRes, customersRes] = await Promise.all([
    db.from("orders").select("id, ordered_at, created_at, customer_name, status, total, items, shipping_cost"),
    db.from("order_items").select("product_name_snapshot, quantity, total_price"),
    db.from("orders")
      .select("id, ordered_at, created_at, customer_name, status, total, items")
      .order("ordered_at", { ascending: false })
      .limit(8),
    db.from("profiles").select("id, created_at").eq("role", "customer"),
  ]);

  const orders   = (allOrdersRes.data ?? []) as {
    id: string; ordered_at: string; created_at: string;
    status: string; total: string | number; shipping_cost?: string | number;
  }[];

  // ── Revenue ──────────────────────────────────────────────────────────────
  const revenue = {
    total:     orders.reduce((s, o) => s + Number(o.total), 0),
    thisMonth: orders.filter((o) => (o.ordered_at || o.created_at) >= thisMonth)
                     .reduce((s, o) => s + Number(o.total), 0),
    lastMonth: orders.filter((o) => {
      const d = o.ordered_at || o.created_at;
      return d >= lastMonth && d < thisMonth;
    }).reduce((s, o) => s + Number(o.total), 0),
  };

  // ── Orders by status ──────────────────────────────────────────────────────
  const byStatus: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
  }

  // ── Daily (last 14 days) ──────────────────────────────────────────────────
  const dailyMap: Record<string, { revenue: number; count: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = { revenue: 0, count: 0 };
  }
  for (const o of orders.filter((o) => (o.ordered_at || o.created_at) >= last14Days)) {
    const key = (o.ordered_at || o.created_at).slice(0, 10);
    if (dailyMap[key]) {
      dailyMap[key].revenue += Number(o.total);
      dailyMap[key].count   += 1;
    }
  }
  const daily = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

  // ── Top products ──────────────────────────────────────────────────────────
  const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const item of (topItemsRes.data ?? []) as {
    product_name_snapshot: string; quantity: number; total_price: string | number;
  }[]) {
    const k = item.product_name_snapshot;
    if (!productMap[k]) productMap[k] = { name: k, count: 0, revenue: 0 };
    productMap[k].count   += Number(item.quantity);
    productMap[k].revenue += Number(item.total_price);
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Customers ─────────────────────────────────────────────────────────────
  const customers = (customersRes.data ?? []) as { created_at: string }[];

  const totalOrders = orders.length;
  const paidOrders  = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled" && o.status !== "failed");
  const avgTicket   = paidOrders.length > 0
    ? paidOrders.reduce((s, o) => s + Number(o.total), 0) / paidOrders.length
    : 0;

  return NextResponse.json({
    revenue,
    orders: {
      total: totalOrders,
      thisMonth: orders.filter((o) => (o.ordered_at || o.created_at) >= thisMonth).length,
      lastMonth: orders.filter((o) => {
        const d = o.ordered_at || o.created_at;
        return d >= lastMonth && d < thisMonth;
      }).length,
      byStatus,
      pending: byStatus["pending"] ?? 0,
    },
    avgTicket,
    daily,
    topProducts,
    recentOrders: recentRes.data ?? [],
    customers: {
      total:        customers.length,
      newThisMonth: customers.filter((c) => c.created_at >= thisMonth).length,
    },
  });
}
