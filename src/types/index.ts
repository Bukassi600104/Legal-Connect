// ============================================================
// LegalConnect NG - TypeScript Type Definitions (Firebase/Firestore)
// ============================================================

import type { Timestamp } from "firebase/firestore";

// ============ ENUMS ============

export type UserRole = "client" | "lawyer" | "admin";
export type AccountType = "individual" | "corporate";
export type AvailabilityStatus = "accepting" | "busy" | "on_break";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type SubscriptionTier = "free" | "professional" | "elite";
export type PostCategory = "legal_tip" | "case_study" | "know_your_rights" | "opinion" | "legal_news" | "general";
export type ConversationStatus = "active" | "consultation_started" | "archived";
export type MessageType = "text" | "file" | "image" | "system";
export type ConsultationType = "video" | "phone" | "in_person";
export type ConsultationStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type VerificationRequestStatus = "pending" | "approved" | "rejected";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type BillingCycle = "monthly" | "yearly";
export type CorporateRole = "admin" | "member";
export type CaseDiscussionStatus = "open" | "closed";

export type NotificationType =
  | "new_message"
  | "new_follower"
  | "post_like"
  | "post_comment"
  | "post_share"
  | "consultation_booking"
  | "consultation_reminder"
  | "verification_update"
  | "subscription_renewal"
  | "subscription_expired"
  | "case_discussion_invite";

// ============ CORE MODELS ============

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  handle: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  role: UserRole;
  account_type: AccountType;
  is_active: boolean;
  is_premium: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface LawyerProfile {
  id: string; // same as user id
  user_id: string;
  slug: string;
  bio?: string;
  cover_image_url?: string;
  years_of_experience?: number;
  scn?: string; // Supreme Court Enrollment Number
  nba_branch?: string;
  location_state: string;
  location_city?: string;
  education?: Education[];
  languages: string[];
  specialization_ids: string[];
  specializations?: Specialization[]; // populated on read
  fee_range_min?: number;
  fee_range_max?: number;
  availability_status: AvailabilityStatus;
  verification_status: VerificationStatus;
  verification_date?: Timestamp | string;
  follower_count: number;
  post_count: number;
  rating_avg: number;
  rating_count: number;
  subscription_tier: SubscriptionTier;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
}

export interface Specialization {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

// ============ CORPORATE ============

export interface CorporateProfile {
  id: string;
  user_id: string;
  company_name: string;
  rc_number?: string; // CAC Registration Number
  industry?: string;
  company_size?: string;
  created_at: Timestamp | string;
}

export interface CorporateMember {
  id: string;
  corporate_profile_id: string;
  user_id: string;
  role: CorporateRole;
  created_at: Timestamp | string;
}

// ============ SOCIAL / CONTENT ============

export interface PollData {
  options: { text: string; vote_count: number }[];
  total_votes: number;
  ends_at: Timestamp | string;
}

export interface PollVote {
  id: string;
  post_id: string;
  user_id: string;
  option_index: number;
  created_at: Timestamp | string;
}

export interface HashtagCount {
  tag: string;
  count: number;
  last_used_at: Timestamp | string;
}

export interface Post {
  id: string;
  author_id: string;
  author?: UserProfile; // populated on read
  author_profile?: LawyerProfile; // populated on read
  content: string;
  category?: PostCategory;
  media_urls?: string[];
  is_pinned: boolean;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  is_boosted: boolean;
  thread_id?: string;
  thread_position?: number;
  is_thread_starter?: boolean;
  hashtags?: string[];
  poll?: PollData;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
  // Client-side state (not stored)
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: UserProfile; // populated on read
  parent_comment_id?: string;
  content: string;
  like_count: number;
  created_at: Timestamp | string;
  replies?: PostComment[]; // nested on read
}

export interface PostShare {
  id: string;
  post_id: string;
  user_id: string;
  created_at: Timestamp | string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: Timestamp | string;
}

// ============ MESSAGING ============

export interface Conversation {
  id: string;
  participant_client_id?: string;
  participant_lawyer_id?: string;
  participants: string[]; // array of both user IDs for querying
  participant_names?: Record<string, string>;
  participant_avatars?: Record<string, string>;
  status?: ConversationStatus;
  last_message_at?: Timestamp | string;
  last_message_preview?: string;
  last_message?: string;
  last_sender_id?: string;
  created_at: Timestamp | string;
  // Populated on read
  other_user?: UserProfile;
  unread_count?: Record<string, number> | number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: Timestamp | string;
  // Populated on read
  sender?: UserProfile;
}

// ============ LAWYER CASE CIRCLES ============

export interface CaseDiscussion {
  id: string;
  title: string;
  summary: string;
  practice_area?: string | null;
  urgency: string;
  creator_id: string;
  creator_name: string;
  creator_slug?: string | null;
  member_ids: string[];
  participant_count: number;
  status: CaseDiscussionStatus;
  last_message_preview?: string;
  last_message_at?: Timestamp | string;
  created_at: Timestamp | string;
  updated_at: Timestamp | string;
}

export interface CaseDiscussionMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: MessageType;
  created_at: Timestamp | string;
}

// ============ CONSULTATIONS ============

export interface Consultation {
  id: string;
  lawyer_id: string;
  client_id: string;
  conversation_id?: string;
  consultation_type?: ConsultationType;
  scheduled_at: Timestamp | string;
  duration_minutes: number;
  status: ConsultationStatus;
  topic?: string;
  notes?: string;
  created_at: Timestamp | string;
  // Populated on read
  lawyer?: UserProfile;
  client?: UserProfile;
}

export interface LawyerAvailability {
  id: string;
  lawyer_id: string;
  day_of_week: number; // 0-6 (Sun-Sat)
  start_time: string; // "09:00"
  end_time: string; // "17:00"
  is_active: boolean;
}

// ============ REVIEWS ============

export interface Review {
  id: string;
  lawyer_id: string;
  client_id: string;
  consultation_id: string;
  rating: number; // 1-5
  content?: string;
  lawyer_response?: string;
  created_at: Timestamp | string;
  // Populated on read
  client?: UserProfile;
}

// ============ SUBSCRIPTIONS ============

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number; // in kobo (NGN * 100)
  price_yearly: number;
  features: Record<string, boolean | string | number>;
  is_active: boolean;
  created_at: Timestamp | string;
}

export interface Subscription {
  id: string;
  lawyer_id: string;
  plan_id: string;
  paystack_subscription_code?: string;
  paystack_customer_code?: string;
  billing_cycle?: BillingCycle;
  status: SubscriptionStatus;
  current_period_start?: Timestamp | string;
  current_period_end?: Timestamp | string;
  created_at: Timestamp | string;
}

// ============ VERIFICATION ============

export interface VerificationRequest {
  id: string;
  lawyer_id: string;
  scn: string;
  call_to_bar_cert_url: string;
  practicing_fee_receipt_url: string;
  id_document_url: string;
  additional_docs_urls?: string[];
  status: VerificationRequestStatus;
  reviewed_by?: string;
  review_notes?: string;
  submitted_at: Timestamp | string;
  reviewed_at?: Timestamp | string;
  // Populated on read
  lawyer?: UserProfile;
}

// ============ NOTIFICATIONS ============

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, string>;
  is_read: boolean;
  created_at: Timestamp | string;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============ NIGERIAN STATES ============

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = typeof NIGERIAN_STATES[number];

// ============ SPECIALIZATION SEEDS ============

export const SPECIALIZATION_SEEDS: Omit<Specialization, "id">[] = [
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
