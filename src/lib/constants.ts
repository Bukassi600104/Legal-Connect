import {
  Home,
  Search,
  MessageCircle,
  Calendar,
  LayoutDashboard,
  Shield,
  Scale,
  Users,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ============ NAVIGATION ============

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  requiresAuth?: boolean;
  roles?: ("client" | "lawyer" | "admin")[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Feed", href: "/feed", icon: Home, requiresAuth: true },
  { label: "Explore", href: "/explore", icon: Search, requiresAuth: true },
  { label: "Messages", href: "/messages", icon: MessageCircle, requiresAuth: true },
  { label: "Consultations", href: "/consultations", icon: Calendar, requiresAuth: true },
];

export const LAWYER_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["lawyer"] },
];

export const CLIENT_NAV_ITEMS: NavItem[] = [
  { label: "My Cases", href: "/client-dashboard", icon: Scale, roles: ["client"] },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin", href: "/admin", icon: Shield, roles: ["admin"] },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings, requiresAuth: true },
];

// ============ POST CATEGORIES ============

export const POST_CATEGORY_LABELS: Record<string, string> = {
  legal_tip: "Legal Tip",
  case_study: "Case Study",
  know_your_rights: "Know Your Rights",
  opinion: "Opinion",
  legal_news: "Legal News",
  general: "General",
};

export const POST_CATEGORY_COLORS: Record<string, string> = {
  legal_tip: "bg-[#00BA7C]/10 text-[#00BA7C]",
  case_study: "bg-[#7856FF]/10 text-[#7856FF]",
  know_your_rights: "bg-[#FFD700]/10 text-[#FFD700]",
  opinion: "bg-brand/10 text-brand",
  legal_news: "bg-[#F4212E]/10 text-[#F4212E]",
  general: "bg-[#EFF3F4] text-muted-text",
};

// ============ SUBSCRIPTION TIERS ============

export const TIER_LABELS: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  elite: "Elite",
  premium: "Premium",
};

export const TIER_COLORS: Record<string, string> = {
  free: "bg-[#EFF3F4] text-muted-text border-border-custom",
  professional: "bg-brand/10 text-brand border-brand/30",
  elite: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30",
  premium: "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30",
};

// ============ VERIFICATION STATUS ============

export const VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Unverified",
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
};

export const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "bg-[#EFF3F4] text-muted-text",
  pending: "bg-[#FFD700]/10 text-[#FFD700]",
  verified: "bg-[#00BA7C]/10 text-[#00BA7C]",
  rejected: "bg-[#F4212E]/10 text-[#F4212E]",
};
