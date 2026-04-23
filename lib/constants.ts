export const BRANDS = [
  "Hot Wheels", "Mini GT", "Pop Race", "Tarmac Works",
  "Matchbox", "Bburago", "CM Model", "Inno64", "Kaido House"
] as const;

export const SCALES = ["1/64", "1/43", "1/24", "1/18"] as const;

export const CATEGORIES = [
  "JDM Legends", "Exotics & Hypercars", "Motorsport", "Normal", "Bundle"
] as const;

export const CONDITIONS = [
  "Mint / Sealed", "Opened", "Loose"
] as const;

export const TYPE_OPTIONS = ["Box", "Blister", "Acrylic Case"] as const;

export const LISTING_TYPES = ["in-stock", "pre-order"] as const;

export const PRE_ORDER_STATUSES = [
  "deposit_submitted",
  "deposit_verified",
  "waiting_for_stock",
  "stock_arrived",
  "balance_submitted",
  "balance_verified",
  "shipped",
  "delivered",
  "fully_paid_shipped",
  "cancelled",
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
export type PreOrderStatus = (typeof PRE_ORDER_STATUSES)[number];

export const FLAT_SHIPPING_RATE = 100;
export const PREMIUM_BRAND_SHIPPING_RATE = 120;
export const PREMIUM_SHIPPING_BRANDS = ["Hot Wheels", "Matchbox"] as const;

export const PO_SHIPPING_NOTE =
  "Shipping (₹100) will be collected with your final payment when the product arrives.";

export const PO_STATUS_DISPLAY: Record<
  string,
  { label: string; adminLabel: string; color: string; bg: string; border: string }
> = {
  deposit_submitted: {
    label: "Deposit Under Review",
    adminLabel: "Verify Deposit",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  deposit_verified: {
    label: "Confirmed - Waiting for Stock",
    adminLabel: "Waiting for Stock",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  waiting_for_stock: {
    label: "Confirmed - Waiting for Stock",
    adminLabel: "Waiting for Stock",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  stock_arrived: {
    label: "Stock Arrived - Pay Balance",
    adminLabel: "Send Payment Link",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  balance_submitted: {
    label: "Balance Under Review",
    adminLabel: "Verify Balance",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  balance_verified: {
    label: "Ready to Ship",
    adminLabel: "Ship Now",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  shipped: {
    label: "Shipped",
    adminLabel: "Shipped",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  delivered: {
    label: "Delivered",
    adminLabel: "Delivered",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  fully_paid_shipped: {
    label: "Fully Paid / Shipped",
    adminLabel: "Fully Paid / Shipped",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  cancelled: {
    label: "Cancelled",
    adminLabel: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export const ORDER_STATUS_DISPLAY: Record<
  string,
  { label: string; adminLabel: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Payment Under Review",
    adminLabel: "Verify Payment",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  verified: {
    label: "Order Confirmed",
    adminLabel: "Mark as Shipped",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  processing: {
    label: "Order Confirmed",
    adminLabel: "Mark as Shipped",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  shipped: {
    label: "Shipped",
    adminLabel: "Mark as Completed",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  completed: {
    label: "Delivered",
    adminLabel: "Completed",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  cancelled: {
    label: "Cancelled",
    adminLabel: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

// WhatsApp community link for announcements (set to your community invite link)
export const WHATSAPP_COMMUNITY_LINK = '';
