import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  productSchema?: {
    name: string;
    nameEn?: string;
    description?: string;
    image?: string;
    price?: string | number;
    sku?: string;
    brand?: string;
    availability?: "InStock" | "OutOfStock" | "PreOrder";
  };
}

const BASE_URL = "https://fuji.cafe";
const BRAND = "فوجي كافيه | Fuji Cafe";
const DEFAULT_IMG = `${BASE_URL}/og-cover.png`;

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id) as HTMLScriptElement;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function SEO({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType = "website",
  productSchema,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${BRAND}` : `${BRAND} — حبوب قهوة فاخرة`;
  const fullDescription = description ||
    "فوجي كافيه — متجر حبوب القهوة المتخصص في المملكة العربية السعودية. اكتشف أجود أنواع حبوب القهوة الإثيوبية والبرازيلية والكولومبية واليمنية. جودة استثنائية وتوصيل سريع.";
  const img = ogImage || DEFAULT_IMG;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  useEffect(() => {
    document.title = fullTitle;

    setMeta("description", fullDescription);
    setMeta("keywords", keywords || "قهوة, حبوب قهوة, فوجي كافيه, قهوة إثيوبية, قهوة برازيلية, قهوة يمنية, متجر قهوة, coffee beans, Fuji Cafe, specialty coffee, Saudi Arabia");
    setLink("canonical", url);

    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", fullDescription, "property");
    setMeta("og:image", img, "property");
    setMeta("og:url", url, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:site_name", BRAND, "property");
    setMeta("og:locale", "ar_SA", "property");

    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", fullTitle, "name");
    setMeta("twitter:description", fullDescription, "name");
    setMeta("twitter:image", img, "name");
    setMeta("twitter:site", "@fujicafe", "name");

    setMeta("robots", "index, follow", "name");
    setMeta("theme-color", "#E8637A", "name");

    setJsonLd("ld-org", {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "فوجي كافيه",
      "alternateName": "Fuji Cafe",
      "url": BASE_URL,
      "logo": `${BASE_URL}/fuji-logo.png`,
      "email": "fugi2030@outlook.com",
      "areaServed": "SA",
      "description": fullDescription,
    });

    if (productSchema) {
      setJsonLd("ld-product", {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": productSchema.name,
        "alternateName": productSchema.nameEn,
        "description": productSchema.description,
        "image": productSchema.image || img,
        "brand": {
          "@type": "Brand",
          "name": productSchema.brand || "Fuji Cafe",
        },
        "sku": productSchema.sku,
        "offers": {
          "@type": "Offer",
          "url": url,
          "priceCurrency": "SAR",
          "price": productSchema.price?.toString() || "0",
          "availability": `https://schema.org/${productSchema.availability || "InStock"}`,
          "seller": {
            "@type": "Organization",
            "name": "فوجي كافيه | Fuji Cafe",
          },
        },
      });
    }

    return () => {
      document.title = `${BRAND} — حبوب قهوة فاخرة`;
    };
  }, [fullTitle, fullDescription, keywords, url, img, ogType, productSchema]);

  return null;
}
