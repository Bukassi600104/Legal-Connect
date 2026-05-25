export function getDefaultAvatarUrl(name: string): string {
  const seed = encodeURIComponent(name.trim() || "User");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=d1e8ff&textColor=1a8cd8`;
}

export function getDefaultBannerUrl(name: string): string {
  const seed = encodeURIComponent(name.trim() || "Banner");
  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=1a8cd8,0d6ebd,2ba3f7`;
}
