export const BRANDS = [
  "Hot Wheels", "Mini GT", "Pop Race", "Tarmac Works",
  "Matchbox", "Bburago", "CM Model", "Inno64", "Kaido House"
] as const;

export const SCALES = ["1/64", "1/43", "1/18"] as const;

export const CATEGORIES = [
  "JDM Legends", "Exotics & Hypercars", "Motorsport", "Normal"
] as const;

export const CONDITIONS = [
  "Mint / Sealed", "Opened", "Loose"
] as const;

export const MATERIALS = ["Diecast Metal", "Resin"] as const;

export const LISTING_TYPES = ["in-stock", "pre-order"] as const;

export const PRE_ORDER_STATUSES = [
  "waiting_for_stock",
  "stock_arrived",
  "fully_paid_shipped",
  "cancelled",
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
export type PreOrderStatus = (typeof PRE_ORDER_STATUSES)[number];

export const FLAT_SHIPPING_RATE = 80;

// WhatsApp community link for announcements (set to your community invite link)
export const WHATSAPP_COMMUNITY_LINK = '';
