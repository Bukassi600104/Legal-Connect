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

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment provider is not configured" },
        { status: 500 }
      );
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;
    const body = await request.json();
    const { plan_id, billing_cycle } = body;

    if (!isPlanId(plan_id)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const cycle: BillingCycle = isBillingCycle(billing_cycle)
      ? billing_cycle
      : "monthly";

    const [userDoc, lawyerDoc] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("lawyer_profiles").doc(uid).get(),
    ]);

    if (
      !userDoc.exists ||
      userDoc.data()?.role !== "lawyer" ||
      !lawyerDoc.exists
    ) {
      return NextResponse.json(
        { error: "Only lawyer accounts can subscribe" },
        { status: 403 }
      );
    }

    const userData = userDoc.data()!;
    const email = userData.email || decoded.email;

    if (!email) {
      return NextResponse.json(
        { error: "A verified account email is required for payment" },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[plan_id];
    const amount =
      cycle === "yearly" ? plan.price_yearly : plan.price_monthly;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          callback_url: `${getAppUrl()}/dashboard/subscription/callback`,
          metadata: {
            plan_id,
            billing_cycle: cycle,
            lawyer_id: uid,
            source: "lawyer_subscription",
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Payment initialization failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("Paystack init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
