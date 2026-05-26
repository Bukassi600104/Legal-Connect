import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
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

function getExpectedAmount(planId: PlanId, cycle: BillingCycle): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  return cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
}

function toSafeDocumentId(value: string): string {
  return value.replace(/\//g, "_");
}

async function getAdminFirestore() {
  const { adminDb } = await import("@/lib/firebase/admin");
  return adminDb;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: "Webhook secret is not configured" },
        { status: 500 }
      );
    }

    const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const db = await getAdminFirestore();

    switch (event.event) {
      case "charge.success": {
        const {
          metadata,
          customer,
          reference,
          amount,
          paid_at,
          subscription,
          authorization,
          status,
        } = event.data || {};
        const { plan_id, billing_cycle, lawyer_id, source } = metadata || {};

        if (
          source !== "lawyer_subscription" ||
          !isPlanId(plan_id) ||
          !isBillingCycle(billing_cycle) ||
          typeof lawyer_id !== "string" ||
          !reference
        ) {
          break;
        }

        const expectedAmount = getExpectedAmount(plan_id, billing_cycle);
        if (Number(amount) !== expectedAmount) {
          console.error("Paystack amount mismatch", {
            reference,
            amount,
            expectedAmount,
          });
          break;
        }

        const lawyerDoc = await db
          .collection("lawyer_profiles")
          .doc(lawyer_id)
          .get();
        if (!lawyerDoc.exists) {
          console.error("Paystack webhook lawyer profile missing", {
            lawyer_id,
            reference,
          });
          break;
        }

        const now = new Date();
        const periodStart = paid_at ? new Date(paid_at) : now;
        const periodEnd = new Date(periodStart);
        if (billing_cycle === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const subscriptionCode =
          typeof subscription === "string"
            ? subscription
            : subscription?.subscription_code || null;
        const subRef = db
          .collection("subscriptions")
          .doc(toSafeDocumentId(reference));
        const existingSub = await subRef.get();

        await subRef.set(
          {
            lawyer_id,
            plan_id,
            paystack_reference: reference,
            paystack_customer_code: customer?.customer_code || null,
            paystack_subscription_code: subscriptionCode,
            paystack_authorization_code:
              authorization?.authorization_code || null,
            billing_cycle,
            status: "active",
            paystack_status: status || null,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: now,
            created_at: existingSub.exists
              ? existingSub.data()?.created_at || periodStart
              : periodStart,
          },
          { merge: true }
        );

        await db.collection("lawyer_profiles").doc(lawyer_id).update({
          subscription_tier: plan_id,
          updated_at: now,
        });

        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const { subscription_code } = event.data || {};

        if (!subscription_code) break;

        const subSnap = await db
          .collection("subscriptions")
          .where("paystack_subscription_code", "==", subscription_code)
          .limit(1)
          .get();

        if (!subSnap.empty) {
          const subDoc = subSnap.docs[0];
          const subData = subDoc.data();
          const now = new Date();

          await subDoc.ref.update({
            status: "cancelled",
            updated_at: now,
          });

          if (subData.lawyer_id) {
            await db
              .collection("lawyer_profiles")
              .doc(subData.lawyer_id)
              .update({
                subscription_tier: "free",
                updated_at: now,
              });
          }
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
