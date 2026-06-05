import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import {
  NIGERIAN_STATES,
  SPECIALIZATION_SEEDS,
  type AvailabilityStatus,
  type Education,
} from "@/types";

const AVAILABILITY: AvailabilityStatus[] = ["accepting", "busy", "on_break"];
const SPECIALIZATION_IDS = new Set(SPECIALIZATION_SEEDS.map((spec) => spec.slug));

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function normalizeScn(value: unknown) {
  const scn = normalizeText(value, 40)?.toUpperCase();
  return scn && /^[A-Z0-9/.\- ]{3,40}$/.test(scn) ? scn : null;
}

function normalizeOptionalNumber(
  value: unknown,
  min: number,
  max: number
): number | null {
  if (value == null || value === "") return null;
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    return null;
  }
  return numberValue;
}

function normalizeStringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.slice(0, maxLength))
    ),
  ].slice(0, maxItems);
}

function normalizeEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const institution = normalizeText(record.institution, 120);
      const degree = normalizeText(record.degree, 80);
      const year = normalizeOptionalNumber(record.year, 1900, 2100);

      if (!institution || !degree || !year) return null;
      return { institution, degree, year };
    })
    .filter((item): item is Education => item !== null)
    .slice(0, 10);
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

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;
    const body = await request.json();

    const [userDoc, lawyerProfileDoc] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("lawyer_profiles").doc(uid).get(),
    ]);

    if (
      !userDoc.exists ||
      userDoc.data()?.role !== "lawyer" ||
      userDoc.data()?.is_active === false ||
      !lawyerProfileDoc.exists
    ) {
      return NextResponse.json(
        { error: "Active lawyer profile required" },
        { status: 403 }
      );
    }

    const locationState =
      typeof body.location_state === "string" &&
      NIGERIAN_STATES.includes(body.location_state)
        ? body.location_state
        : "";
    const availability =
      typeof body.availability_status === "string" &&
      AVAILABILITY.includes(body.availability_status as AvailabilityStatus)
        ? (body.availability_status as AvailabilityStatus)
        : null;
    const specializationIds = normalizeStringList(
      body.specialization_ids,
      8,
      80
    ).filter((id) => SPECIALIZATION_IDS.has(id));
    const feeMin = normalizeOptionalNumber(body.fee_range_min, 0, 100000000);
    const feeMax = normalizeOptionalNumber(body.fee_range_max, 0, 100000000);
    const scn = normalizeScn(body.scn);

    if (!locationState || !availability || !scn) {
      return NextResponse.json(
        { error: "Valid SCN, location, and availability are required" },
        { status: 400 }
      );
    }

    if (feeMin != null && feeMax != null && feeMin > feeMax) {
      return NextResponse.json(
        { error: "Minimum fee cannot exceed maximum fee" },
        { status: 400 }
      );
    }

    await adminDb.collection("lawyer_profiles").doc(uid).update({
      bio: normalizeText(body.bio, 1000),
      location_state: locationState,
      location_city: normalizeText(body.location_city, 80),
      years_of_experience: normalizeOptionalNumber(
        body.years_of_experience,
        0,
        60
      ),
      scn,
      nba_branch: normalizeText(body.nba_branch, 80),
      languages: normalizeStringList(body.languages, 10, 40),
      specialization_ids: specializationIds,
      fee_range_min: feeMin,
      fee_range_max: feeMax,
      availability_status: availability,
      education: normalizeEducation(body.education),
      updated_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Lawyer profile update error:", error);
    return NextResponse.json(
      { error: "Lawyer profile update failed" },
      { status: 500 }
    );
  }
}
