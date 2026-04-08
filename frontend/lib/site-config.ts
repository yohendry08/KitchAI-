export const siteConfig = {
  restaurantName: process.env.NEXT_PUBLIC_RESTAURANT_NAME || "",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || "",
  openTime: process.env.NEXT_PUBLIC_OPEN_TIME || "",
  closeTime: process.env.NEXT_PUBLIC_CLOSE_TIME || "",
  copyrightYear: process.env.NEXT_PUBLIC_COPYRIGHT_YEAR || "",
  mapEmbedUrl: process.env.NEXT_PUBLIC_MAP_EMBED_URL || "",
}
