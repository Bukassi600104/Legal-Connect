/**
 * Firestore Seed Script
 * Run with: npx tsx scripts/seed.ts
 *
 * Seeds specializations and subscription plans into Firestore.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env variable to be set.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
);

const app = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(app);

async function seedSpecializations() {
  console.log("Seeding specializations...");

  const specializations = [
    { name: "Corporate Law", slug: "corporate-law" },
    { name: "Family Law", slug: "family-law" },
    { name: "Criminal Defense", slug: "criminal-defense" },
    { name: "Property Law", slug: "property-law" },
    { name: "Tax Law", slug: "tax-law" },
    { name: "IP Law", slug: "ip-law" },
    { name: "Employment Law", slug: "employment-law" },
    { name: "Maritime Law", slug: "maritime-law" },
    { name: "Immigration Law", slug: "immigration-law" },
    { name: "Constitutional Law", slug: "constitutional-law" },
    { name: "Banking & Finance", slug: "banking-finance" },
    { name: "Oil & Gas", slug: "oil-gas" },
    { name: "Human Rights", slug: "human-rights" },
    { name: "Arbitration", slug: "arbitration" },
    { name: "Real Estate", slug: "real-estate" },
    { name: "General Practice", slug: "general-practice" },
  ];

  const batch = db.batch();

  for (const spec of specializations) {
    const ref = db.collection("specializations").doc(spec.slug);
    batch.set(ref, {
      name: spec.name,
      slug: spec.slug,
      icon: null,
      created_at: new Date(),
    });
  }

  await batch.commit();
  console.log(`  Seeded ${specializations.length} specializations`);
}

async function seedSubscriptionPlans() {
  console.log("Seeding subscription plans...");

  const plans = [
    {
      slug: "free",
      name: "Free",
      price_monthly: 0,
      price_yearly: 0,
      features: {
        posts_per_month: 3,
        can_initiate_chat: false,
        analytics: false,
        verification_eligible: false,
        consultation_tools: false,
        search_ranking: "low",
        boosted_posts: false,
        video_consultation: false,
      },
      is_active: true,
    },
    {
      slug: "professional",
      name: "Professional",
      price_monthly: 500000, // N5,000 in kobo
      price_yearly: 4800000, // N48,000 in kobo
      features: {
        posts_per_month: -1, // unlimited
        can_initiate_chat: true,
        analytics: "basic",
        verification_eligible: true,
        consultation_tools: true,
        search_ranking: "priority",
        boosted_posts: false,
        video_consultation: false,
        featured_rotation: true,
      },
      is_active: true,
    },
    {
      slug: "elite",
      name: "Elite",
      price_monthly: 1500000, // N15,000 in kobo
      price_yearly: 14400000, // N144,000 in kobo
      features: {
        posts_per_month: -1, // unlimited
        can_initiate_chat: true,
        analytics: "advanced",
        verification_eligible: true,
        consultation_tools: true,
        search_ranking: "promoted",
        boosted_posts: true,
        video_consultation: true,
        featured_rotation: true,
        elite_badge: true,
        priority_support: true,
      },
      is_active: true,
    },
  ];

  const batch = db.batch();

  for (const plan of plans) {
    const ref = db.collection("subscription_plans").doc(plan.slug);
    batch.set(ref, {
      ...plan,
      created_at: new Date(),
    });
  }

  await batch.commit();
  console.log(`  Seeded ${plans.length} subscription plans`);
}

async function main() {
  console.log("Starting seed...\n");

  try {
    await seedSpecializations();
    await seedSubscriptionPlans();
    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
