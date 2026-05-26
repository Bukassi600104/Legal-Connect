import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SUBSCRIPTION_PLANS } from "@/lib/paystack";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

type PlanId = keyof typeof SUBSCRIPTION_PLANS;
type BillingCycle = "monthly" | "yearly";

function isPlanId(value: unknown): value is PlanId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(SUBSCRIPTION_PLANS, value)
  );
}

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

function expectedAmount(planId: PlanId, cycle: BillingCycle) {
  const plan = SUBSCRIPTION_PLANS[planId];
  return cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
}

function toSafeDocumentId(value: string): string {
  return value.replace(/\//g, "_");
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");
    if (!reference) {
      return NextResponse.json(
        { status: "error", error: "Missing payment reference" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) {
      return NextResponse.json(
        { status: "error", error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { status: "error", error: "Payment provider is not configured" },
        { status: 500 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
        cache: "no-store",
      }
    );
    const result = await response.json();

    if (!response.ok || !result.status || result.data?.status !== "success") {
      return NextResponse.json({ status: "pending" });
    }

    const data = result.data;
    const metadata = data.metadata || {};
    const { plan_id, billing_cycle, lawyer_id, source } = metadata;

    if (
      source !== "lawyer_subscription" ||
      !isPlanId(plan_id) ||
      !isBillingCycle(billing_cycle) ||
      lawyer_id !== decoded.uid ||
      Number(data.amount) !== expectedAmount(plan_id, billing_cycle)
    ) {
      return NextResponse.json(
        { status: "error", error: "Payment reference did not match this account" },
        { status: 403 }
      );
    }

    const subscription = await adminDb
      .collection("subscriptions")
      .doc(toSafeDocumentId(reference))
      .get();

    if (subscription.exists && subscription.data()?.status === "active") {
      return NextResponse.json({ status: "success" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { status: "error", error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
