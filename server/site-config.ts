/**
 * Centralized site configuration — single source of truth for the public URL,
 * brand identity, and asset paths used across emails, OG metadata, and APIs.
 *
 * Override per-environment via `PUBLIC_SITE_URL` env var (e.g. for staging).
 */

const RAW_URL = process.env.PUBLIC_SITE_URL || "https://fuji.cafe";

export const SITE = {
  /** Primary canonical URL — no trailing slash */
  URL: RAW_URL.replace(/\/+$/, ""),
  /** Bare domain, e.g. "fuji.cafe" — used for display in footers and copy */
  DOMAIN: RAW_URL.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
  /** Brand name (Arabic) */
  BRAND_AR: "فوجي كافيه",
  /** Brand name (English) */
  BRAND_EN: "Fuji Cafe",
  /** Support email shown to customers */
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || "info@fuji.cafe",
  /** No-reply sender used by SMTP2GO */
  NOREPLY_EMAIL: process.env.EMAIL_SENDER || "noreply@fuji.cafe",
  /** Internal-only emails (auto-generated for phone-only signups) */
  PHONE_EMAIL_DOMAIN: "fuji.cafe",
} as const;

export const ASSETS = {
  LOGO_SQUARE:  `${SITE.URL}/fuji-logo-transparent.png`,
  LOGO_LIGHT:   `${SITE.URL}/fuji-logo-transparent.png`,
  LOGO_DARK:    `${SITE.URL}/fuji-logo-transparent.png`,
  BRAND_LOGO:   `${SITE.URL}/fuji-logo-transparent.png`,
  EMAIL_BANNER: `${SITE.URL}/fuji-interior-opt.jpg`,
  OG_COVER:     `${SITE.URL}/fuji-logo.png`,
} as const;

export const ROUTES = {
  HOME:     `${SITE.URL}/`,
  PRODUCTS: `${SITE.URL}/products`,
  ORDERS:   `${SITE.URL}/orders`,
  ADMIN:    `${SITE.URL}/admin`,
  LOGIN:    `${SITE.URL}/login`,
} as const;
