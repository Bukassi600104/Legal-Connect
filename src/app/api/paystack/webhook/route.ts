import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// Lazy-load admin SDK to avoid build-time errors
async function getAdminFirestore() {
  const { adminDb } = await import("@/lib/firebase/admin");
  return adminDb;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Verify webhook signature
    if (PAYSTACK_SECRET_KEY) {
      const hash = createHmac("sha512", PAYSTACK_SECRET_KEY)
        .update(body)
        .digest("hex");

      if (hash !== signature) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case "charge.success": {
        const { metadata, customer } = event.data;
        const { plan_id, billing_cycle, lawyer_id } = metadata || {};

        if (!lawyer_id || !plan_id) break;

        const db = await getAdminFirestore();

        // Determine subscription tier
        const tier =
          plan_id === "elite" ? "elite" : "professional";

        // Calculate period
        const now = new Date();
        const periodEnd = new Date(now);
        if (billing_cycle === "yearly") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create/update subscription doc
        const subRef = db.collection("subscriptions").doc();
        await subRef.set({
          lawyer_id,
          plan_id,
          paystack_customer_code: customer?.customer_code || null,
          billing_cycle: billing_cycle || "monthly",
          status: "active",
          current_period_start: now,
          current_period_end: periodEnd,
          created_at: now,
        });

        // Update lawyer profile tier
        await db.collection("lawyer_profiles").doc(lawyer_id).update({
          subscription_tier: tier,
          updated_at: now,
        });

        break;
      }

      case "subscription.disable":
      case "subscription.not_renew": {
        const { subscription_code } = event.data;

        if (!subscription_code) break;

        const db = await getAdminFirestore();

        // Find subscription by paystack code
        const subSnap = await db
          .collection("subscriptions")
          .where(
            "paystack_subscription_code",
            "==",
            subscription_code
          )
          .limit(1)
          .get();

        if (!subSnap.empty) {
          const subDoc = subSnap.docs[0];
          const subData = subDoc.data();

          await subDoc.ref.update({
            status: "cancelled",
          });

          // Downgrade to free
          if (subData.lawyer_id) {
            await db
              .collection("lawyer_profiles")
              .doc(subData.lawyer_id)
              .update({
                subscription_tier: "free",
                updated_at: new Date(),
              });
          }
        }

        break;
      }

      default:
        // Unhandled event type
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
