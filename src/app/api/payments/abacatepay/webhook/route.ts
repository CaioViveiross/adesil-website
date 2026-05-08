import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/supabase/orders";

function getStringValue(obj: unknown, paths: string[]): string | undefined {
	if (!obj || typeof obj !== "object") return undefined;

	for (const path of paths) {
		const value = path.split(".").reduce<unknown>((acc, key) => {
			if (!acc || typeof acc !== "object") return undefined;
			return (acc as Record<string, unknown>)[key];
		}, obj);

		if (typeof value === "string" && value.trim()) {
			return value;
		}
	}

	return undefined;
}

function mapPaymentEventToOrderStatus(event: string): "processing" | "pending" | undefined {
	const normalized = event.toLowerCase();
	if (
		normalized.includes("paid") ||
		normalized.includes("approved") ||
		normalized.includes("confirmed")
	) {
		return "processing";
	}

	if (
		normalized.includes("expired") ||
		normalized.includes("canceled") ||
		normalized.includes("cancelled") ||
		normalized.includes("failed")
	) {
		return "pending";
	}

	return undefined;
}

function safeCompare(a: string, b: string): boolean {
	const left = Buffer.from(a, "utf8");
	const right = Buffer.from(b, "utf8");

	if (left.length !== right.length) return false;
	return crypto.timingSafeEqual(left, right);
}

function validateWebhookSignature(rawBody: string, signature?: string | null): boolean {
	const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
	if (!secret) return true;
	if (!signature) return false;

	const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
	return safeCompare(expected, signature);
}

export async function POST(request: NextRequest) {
	try {
		const signature =
			request.headers.get("x-abacatepay-signature") ||
			request.headers.get("x-signature") ||
			request.headers.get("abacatepay-signature");

		const rawBody = await request.text();
		if (!validateWebhookSignature(rawBody, signature)) {
			return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
		}

		const payload = rawBody ? JSON.parse(rawBody) : {};

		const event = getStringValue(payload, ["event", "type", "data.event", "data.type"]);
		const orderId = getStringValue(payload, [
			"data.metadata.order_id",
			"metadata.order_id",
			"data.billing.metadata.order_id",
			"billing.metadata.order_id",
		]);

		if (!event || !orderId) {
			return NextResponse.json({ received: true, skipped: true });
		}

		const nextStatus = mapPaymentEventToOrderStatus(event);
		if (!nextStatus) {
			return NextResponse.json({ received: true, ignored: true });
		}

		await updateOrderStatus(orderId, nextStatus);
		return NextResponse.json({ received: true, updated: true });
	} catch (error) {
		console.error("Error handling Abacate Pay webhook:", error);
		return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
	}
}
