export interface Evidence {
  label: string;
  status: "fact" | "inferred" | "unknown";
  value: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviewCount: number;
  isPrime: boolean;
  image: string;
  reason: string;
  evidence: Evidence[];
  features: string[];
  shippingEta: string;
  amazonUrl: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "Keychron K8 Pro QMK/VIA Wireless Mechanical Keyboard",
    price: 109,
    rating: 4.6,
    reviewCount: 2847,
    isPrime: true,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop",
    reason: "Best overall match - wireless, hot-swappable switches for quiet customization, under budget, highly rated for office use.",
    evidence: [
      { label: "Budget", status: "fact", value: "✓ $109 (under $120)" },
      { label: "Prime", status: "fact", value: "✓ Available" },
      { label: "Quiet", status: "inferred", value: "⚠️ Hot-swappable (can install quiet switches)" },
      { label: "Mechanical", status: "fact", value: "✓ Confirmed" },
      { label: "Noise level", status: "unknown", value: "Depends on switch choice" },
    ],
    features: [
      "Hot-swappable switches",
      "Wireless Bluetooth + wired",
      "Mac & Windows compatible",
      "QMK/VIA programmable",
      "RGB backlight",
    ],
    shippingEta: "2 days",
    amazonUrl: "https://www.amazon.com",
  },
  {
    id: "2",
    title: "Logitech MX Keys Mini Wireless Keyboard - Quiet Typing",
    price: 99,
    rating: 4.5,
    reviewCount: 5234,
    isPrime: true,
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=300&h=300&fit=crop",
    reason: "Explicitly designed for quiet typing, compact layout, excellent reviews for productivity and multi-device pairing.",
    evidence: [
      { label: "Budget", status: "fact", value: "✓ $99 (under $120)" },
      { label: "Prime", status: "fact", value: "✓ Available" },
      { label: "Quiet", status: "fact", value: "✓ 'Quiet Typing' in product name" },
      { label: "Mechanical", status: "fact", value: "✗ Low-profile scissor switches" },
      { label: "Noise level", status: "fact", value: "Quiet typing confirmed" },
    ],
    features: [
      "Perfect stroke keys for quiet typing",
      "Wireless multi-device pairing",
      "Backlit keys with smart illumination",
      "USB-C rechargeable",
      "Compact minimalist design",
    ],
    shippingEta: "1-2 days",
    amazonUrl: "https://www.amazon.com",
  },
  {
    id: "3",
    title: "Royal Kludge RK61 Mechanical Keyboard with Brown Switches",
    price: 54,
    rating: 4.3,
    reviewCount: 8192,
    isPrime: true,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=300&h=300&fit=crop",
    reason: "Best value option - comes with quiet brown tactile switches, wireless, well under budget with strong ratings.",
    evidence: [
      { label: "Budget", status: "fact", value: "✓ $54 (well under $120)" },
      { label: "Prime", status: "fact", value: "✓ Available" },
      { label: "Quiet", status: "fact", value: "✓ Brown tactile switches (quiet)" },
      { label: "Mechanical", status: "fact", value: "✓ Confirmed" },
      { label: "Noise level", status: "fact", value: "Brown switches are quiet" },
    ],
    features: [
      "Gateron Brown switches (quiet tactile)",
      "Wireless + wired dual mode",
      "Compact 60% layout",
      "RGB backlight",
      "Long battery life (10 hours)",
    ],
    shippingEta: "2-3 days",
    amazonUrl: "https://www.amazon.com",
  },
];

export const exampleQueries = [
  "gift for mom who likes cooking under $40",
  "dorm vacuum small but strong under $80",
  "noise cancelling headphones under $150 prime",
  "laptop stand for neck pain",
  "waterproof bluetooth speaker under $60",
  "ergonomic office chair under $300",
  "running shoes for flat feet under $120",
  "portable phone charger fast charging prime",
];
