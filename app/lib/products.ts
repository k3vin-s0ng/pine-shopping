export interface Product {
  id?: string;          // unique id for UI lists
  name: string;
  cat: string;
  desc: string;
  price: string;
  num: number;
  rating: string;
  reviews: string;
  match: string;
  img: string;
  link: string;
}

export interface RankedProduct extends Product {
  score: number;
}

export interface Intent {
  kw: string[];
  db: keyof typeof DB;
  ack: string;
  clarify: string[];
}

const UNSPLASH = "https://images.unsplash.com/photo-";
const AMZ = "https://www.amazon.com/s?k=";

export const DB: Record<string, Product[]> = {
  headphones: [
    { name: "Sony WH-1000XM5", cat: "Audio", desc: "Industry-leading ANC, 30hr battery, Hi-Res audio, multipoint. The undisputed wireless king.", price: "$349", num: 349, rating: "4.8", reviews: "12.4k", match: "99%", img: UNSPLASH + "1505740420928-5e560c06d30e?w=80&h=80&fit=crop", link: "https://www.amazon.com/dp/B09XS7JWHH" },
    { name: "Bose QuietComfort 45", cat: "Audio", desc: "World-class ANC with legendary Bose comfort. Ideal for travel and all-day listening.", price: "$279", num: 279, rating: "4.7", reviews: "9.2k", match: "96%", img: UNSPLASH + "1546435770-a3e736abb34e?w=80&h=80&fit=crop", link: "https://www.amazon.com/dp/B098FKXT8L" },
    { name: "Sennheiser Momentum 4", cat: "Audio", desc: "60hr battery, adaptive ANC, Hi-Res certification. Warm audiophile sound in an everyday headphone.", price: "$349", num: 349, rating: "4.7", reviews: "6.1k", match: "94%", img: UNSPLASH + "1600294037681-c80b4cb5b434?w=80&h=80&fit=crop", link: AMZ + "Sennheiser+Momentum+4+Wireless" },
    { name: "Apple AirPods Max", cat: "Audio", desc: "Apple chip, Spatial Audio, anodized aluminum build. Premium over-ear for the Apple ecosystem.", price: "$449", num: 449, rating: "4.6", reviews: "8.1k", match: "91%", img: UNSPLASH + "1484704849700-f032a568e944?w=80&h=80&fit=crop", link: "https://www.amazon.com/dp/B08PZHYWJS" },
    { name: "Jabra Evolve2 85", cat: "Audio", desc: "Professional dual-mic array, Busylight for focus, all-day ergonomic comfort.", price: "$379", num: 379, rating: "4.5", reviews: "3.8k", match: "88%", img: UNSPLASH + "1505740420928-5e560c06d30e?w=80&h=80&fit=crop", link: AMZ + "Jabra+Evolve2+85" },
    { name: "Sony WH-CH720N", cat: "Audio", desc: "Lightweight ANC, 35hr battery, multipoint. Sony quality at a budget-friendly price.", price: "$149", num: 149, rating: "4.5", reviews: "7.2k", match: "82%", img: UNSPLASH + "1484704849700-f032a568e944?w=80&h=80&fit=crop", link: AMZ + "Sony+WH-CH720N" },
    { name: "JBL Tune 760NC", cat: "Audio", desc: "ANC, 35hr battery, foldable design. Reliable everyday noise canceler on a budget.", price: "$99", num: 99, rating: "4.4", reviews: "11k", match: "76%", img: UNSPLASH + "1505740420928-5e560c06d30e?w=80&h=80&fit=crop", link: AMZ + "JBL+Tune+760NC" },
    { name: "Anker Soundcore Q45", cat: "Audio", desc: "Hi-Res audio certified, multi-mode ANC, 50hr battery. Unbeatable value under $60.", price: "$59", num: 59, rating: "4.5", reviews: "22k", match: "71%", img: UNSPLASH + "1546435770-a3e736abb34e?w=80&h=80&fit=crop", link: AMZ + "Anker+Soundcore+Q45" },
  ],
  laptops: [
    { name: 'MacBook Pro 14" M3 Pro', cat: "Computing", desc: "ProRes video editing, 22hr battery, Liquid Retina XDR. The creator's gold standard.", price: "$1,999", num: 1999, rating: "4.9", reviews: "15.1k", match: "99%", img: UNSPLASH + "1517336714731-489689fd1ca8?w=80&h=80&fit=crop", link: "https://www.amazon.com/dp/B0CM5JV268" },
    { name: "ASUS ProArt Studiobook 16", cat: "Computing", desc: "OLED display, RTX 4070, 64GB RAM. Purpose-built for the most demanding creative workflows.", price: "$2,299", num: 2299, rating: "4.7", reviews: "4.3k", match: "96%", img: UNSPLASH + "1496181133206-80ce9b88a853?w=80&h=80&fit=crop", link: AMZ + "ASUS+ProArt+Studiobook+16" },
    { name: "Dell XPS 15 OLED", cat: "Computing", desc: "InfinityEdge OLED display, Core i9, premium aluminum chassis. Creator-ready powerhouse.", price: "$1,799", num: 1799, rating: "4.6", reviews: "6.7k", match: "93%", img: UNSPLASH + "1593642632559-0c6d3fc62b89?w=80&h=80&fit=crop", link: AMZ + "Dell+XPS+15+OLED" },
    { name: "Razer Blade 15 Studio", cat: "Computing", desc: "RTX 4080, 240Hz QHD, CNC aluminum unibody. Gamer-grade specs for serious creators.", price: "$2,499", num: 2499, rating: "4.5", reviews: "3.1k", match: "90%", img: UNSPLASH + "1525547719571-a2d4ac8945e2?w=80&h=80&fit=crop", link: AMZ + "Razer+Blade+15+Studio" },
    { name: "Acer Swift X 14", cat: "Computing", desc: "OLED display, RTX 4060, Ryzen 7. The best value creator laptop under $1,000.", price: "$899", num: 899, rating: "4.5", reviews: "9.1k", match: "77%", img: UNSPLASH + "1517336714731-489689fd1ca8?w=80&h=80&fit=crop", link: AMZ + "Acer+Swift+X+14" },
  ],
  skincare: [
    { name: "The Ordinary Niacinamide 10%", cat: "Beauty", desc: "Reduces blemishes, congestion, and pores. Vegan, cruelty-free. Globally beloved serum.", price: "$6", num: 6, rating: "4.8", reviews: "52k", match: "98%", img: UNSPLASH + "1556228578-8c89e6adf883?w=80&h=80&fit=crop", link: AMZ + "The+Ordinary+Niacinamide+10%25" },
    { name: "CeraVe Moisturizing Cream", cat: "Beauty", desc: "24hr hydration with ceramides and hyaluronic acid. The holy grail for dry, sensitive skin.", price: "$19", num: 19, rating: "4.9", reviews: "89k", match: "96%", img: UNSPLASH + "1571781926291-c477ebfd024b?w=80&h=80&fit=crop", link: "https://www.amazon.com/dp/B00TTD9BRC" },
    { name: "La Roche-Posay SPF 50+", cat: "Beauty", desc: "Ultra-light daily SPF moisturizer. Broad-spectrum, non-greasy. Dermatologist's top pick.", price: "$38", num: 38, rating: "4.8", reviews: "21k", match: "93%", img: UNSPLASH + "1620916566398-39f1143ab7be?w=80&h=80&fit=crop", link: AMZ + "La+Roche+Posay+SPF+50" },
    { name: "Paula's Choice 2% BHA", cat: "Beauty", desc: "2% salicylic acid exfoliant. Clears clogged pores, smooths texture, fades post-acne marks.", price: "$34", num: 34, rating: "4.7", reviews: "18k", match: "89%", img: UNSPLASH + "1556228578-8c89e6adf883?w=80&h=80&fit=crop", link: AMZ + "Paula%27s+Choice+BHA+Exfoliant+2%25" },
    { name: "Drunk Elephant Protini", cat: "Beauty", desc: "Signal peptides + growth factors. Firms, smooths, and improves skin clarity overnight.", price: "$68", num: 68, rating: "4.7", reviews: "12k", match: "84%", img: UNSPLASH + "1620916566398-39f1143ab7be?w=80&h=80&fit=crop", link: AMZ + "Drunk+Elephant+Protini+Polypeptide" },
  ],
  running: [
    { name: "Brooks Adrenaline GTS 23", cat: "Footwear", desc: "GuideRails® technology engineered for overpronation and flat arches. Voted best stability shoe.", price: "$140", num: 140, rating: "4.8", reviews: "22k", match: "99%", img: UNSPLASH + "1542291026-7eec264c27ff?w=80&h=80&fit=crop", link: AMZ + "Brooks+Adrenaline+GTS+23" },
    { name: "ASICS Gel-Kayano 30", cat: "Footwear", desc: "Maximum stability with LYTE TRUSSTIC technology and deep cushioning. Flat-foot standard.", price: "$160", num: 160, rating: "4.7", reviews: "18k", match: "97%", img: UNSPLASH + "1539185441755-769473a23570?w=80&h=80&fit=crop", link: AMZ + "ASICS+Gel+Kayano+30" },
    { name: "Hoka Arahi 7", cat: "Footwear", desc: "J-Frame™ stability with max cushioning for flat feet. Plush ride for everyday miles.", price: "$140", num: 140, rating: "4.7", reviews: "14k", match: "95%", img: UNSPLASH + "1608231387042-66d1773d3028?w=80&h=80&fit=crop", link: AMZ + "Hoka+Arahi+7" },
    { name: "New Balance 860v13", cat: "Footwear", desc: "ROLLBAR® stability post for moderate to severe overpronation. Motion control refined.", price: "$135", num: 135, rating: "4.6", reviews: "9.4k", match: "93%", img: UNSPLASH + "1587563871167-1ee9c731aefb?w=80&h=80&fit=crop", link: AMZ + "New+Balance+860v13" },
    { name: "Saucony Guide 16", cat: "Footwear", desc: "PWRRUN cushioning with medial post for stability. Lightweight daily trainer.", price: "$130", num: 130, rating: "4.5", reviews: "7.8k", match: "90%", img: UNSPLASH + "1542291026-7eec264c27ff?w=80&h=80&fit=crop", link: AMZ + "Saucony+Guide+16" },
  ],
  gaming: [
    { name: "ASUS ROG Strix G15", cat: "Gaming PC", desc: "RX 6800M, 300Hz display, MUX Switch, AMD Advantage Edition. Uncompromising performance.", price: "$1,299", num: 1299, rating: "4.7", reviews: "5.6k", match: "98%", img: UNSPLASH + "1593640408182-31c228b9e8d7?w=80&h=80&fit=crop", link: AMZ + "ASUS+ROG+Strix+G15+Advantage" },
    { name: "Razer DeathAdder V3 Pro", cat: "Gaming Mouse", desc: "Ultra-lightweight wireless, Focus Pro 30K sensor, 90hr battery. Esports benchmark.", price: "$159", num: 159, rating: "4.8", reviews: "11k", match: "95%", img: UNSPLASH + "1527814050087-3793815479db?w=80&h=80&fit=crop", link: AMZ + "Razer+DeathAdder+V3+Pro" },
    { name: "SteelSeries Arctis Nova Pro", cat: "Gaming Headset", desc: "Multi-system wireless, hot-swap battery, ANC, audiophile-grade drivers. Pro team favorite.", price: "$349", num: 349, rating: "4.6", reviews: "7.2k", match: "92%", img: UNSPLASH + "1618366712010-f4ae9c647dcb?w=80&h=80&fit=crop", link: AMZ + "SteelSeries+Arctis+Nova+Pro" },
    { name: "HyperX Cloud Alpha Wireless", cat: "Gaming Headset", desc: "300-hour battery life, dual-chamber drivers. The wireless endurance king.", price: "$199", num: 199, rating: "4.7", reviews: "15k", match: "86%", img: UNSPLASH + "1618366712010-f4ae9c647dcb?w=80&h=80&fit=crop", link: AMZ + "HyperX+Cloud+Alpha+Wireless" },
    { name: "Secretlab Titan Evo", cat: "Gaming Chair", desc: "Cold-cure foam, magnetic head pillow, 4-way lumbar support. Chosen by pro players worldwide.", price: "$549", num: 549, rating: "4.8", reviews: "32k", match: "80%", img: UNSPLASH + "1527443224154-c4a3942d3acf?w=80&h=80&fit=crop", link: AMZ + "Secretlab+Titan+Evo" },
  ],
  electronics: [
    { name: 'iPad Pro 13" M4', cat: "Tablet", desc: "Tandem OLED, M4 chip, Apple Pencil Pro support. The most capable tablet ever made.", price: "$1,299", num: 1299, rating: "4.9", reviews: "23k", match: "97%", img: UNSPLASH + "1544244015-0df4b3ffc6b0?w=80&h=80&fit=crop", link: AMZ + "iPad+Pro+M4+13+inch" },
    { name: "Samsung Galaxy Tab S9 Ultra", cat: "Tablet", desc: "14.6\" AMOLED, S Pen included, DeX desktop mode. Peak Android tablet productivity.", price: "$1,199", num: 1199, rating: "4.7", reviews: "14k", match: "93%", img: UNSPLASH + "1561154464-82e9adf32764?w=80&h=80&fit=crop", link: AMZ + "Samsung+Galaxy+Tab+S9+Ultra" },
    { name: "Apple Watch Ultra 2", cat: "Wearable", desc: "Titanium case, 60hr battery, dual-frequency GPS. Built for athletes and adventurers.", price: "$799", num: 799, rating: "4.8", reviews: "19k", match: "89%", img: UNSPLASH + "1544244015-0df4b3ffc6b0?w=80&h=80&fit=crop", link: AMZ + "Apple+Watch+Ultra+2" },
    { name: "Google Pixel 9 Pro", cat: "Smartphone", desc: "Tensor G4, 50MP camera array, 7 years of OS updates. Google AI built in.", price: "$999", num: 999, rating: "4.6", reviews: "16k", match: "77%", img: UNSPLASH + "1561154464-82e9adf32764?w=80&h=80&fit=crop", link: AMZ + "Google+Pixel+9+Pro" },
    { name: "Anker 140W GaN Charger", cat: "Accessories", desc: "3-port GaN charger. Laptop + phone + earbuds simultaneously. Pocket-sized travel essential.", price: "$55", num: 55, rating: "4.8", reviews: "67k", match: "73%", img: UNSPLASH + "1608043152269-423dbba4e7e1?w=80&h=80&fit=crop", link: AMZ + "Anker+140W+GaN+Charger" },
  ],
  home: [
    { name: "Dyson V15 Detect", cat: "Home", desc: "Laser reveals invisible dust. HEPA filtration and 60min runtime. Best cordless vacuum.", price: "$749", num: 749, rating: "4.8", reviews: "31k", match: "97%", img: UNSPLASH + "1558618666-fcd25c85cd64?w=80&h=80&fit=crop", link: AMZ + "Dyson+V15+Detect" },
    { name: "iRobot Roomba j9+", cat: "Home", desc: "Smart mapping, auto-empty base, obstacle avoidance. Fully autonomous floor care.", price: "$899", num: 899, rating: "4.6", reviews: "12k", match: "94%", img: UNSPLASH + "1557318041-1ce374d55ebf?w=80&h=80&fit=crop", link: AMZ + "iRobot+Roomba+j9%2B" },
    { name: "Philips Hue Starter Kit", cat: "Smart Home", desc: "16M colors, smart scenes, Alexa & Google Hub. Transform any room with smart lighting.", price: "$199", num: 199, rating: "4.7", reviews: "44k", match: "91%", img: UNSPLASH + "1545259742-f9a6fa5c5c7e?w=80&h=80&fit=crop", link: AMZ + "Philips+Hue+Starter+Kit" },
    { name: "KitchenAid Artisan Mixer", cat: "Kitchen", desc: "10 speeds, 5qt bowl, 59 optional attachments. The legendary kitchen workhorse.", price: "$449", num: 449, rating: "4.8", reviews: "78k", match: "82%", img: UNSPLASH + "1545259742-f9a6fa5c5c7e?w=80&h=80&fit=crop", link: AMZ + "KitchenAid+Artisan+Stand+Mixer" },
    { name: "Instant Pot Duo Plus 9-in-1", cat: "Kitchen", desc: "Pressure cooker, slow cooker, rice cooker, steamer, sauté and more in one pot.", price: "$99", num: 99, rating: "4.7", reviews: "120k", match: "79%", img: UNSPLASH + "1558618666-fcd25c85cd64?w=80&h=80&fit=crop", link: AMZ + "Instant+Pot+Duo+Plus+9+in+1" },
  ],
  travel: [
    { name: "Away Bigger Carry-On", cat: "Luggage", desc: "Polycarbonate shell, 360° spinners, TSA lock, ejectable USB-C charger. Carry-on gold standard.", price: "$325", num: 325, rating: "4.7", reviews: "18k", match: "97%", img: UNSPLASH + "1553062407-98eeb64c6a62?w=80&h=80&fit=crop", link: "https://www.awaytravel.com/luggage/bigger-carry-on" },
    { name: "Osprey Farpoint 40", cat: "Backpack", desc: "Award-winning travel pack with LightWire frame suspension. Fits carry-on on most airlines.", price: "$200", num: 200, rating: "4.8", reviews: "9.7k", match: "94%", img: UNSPLASH + "1622560480605-d83c853bc5c3?w=80&h=80&fit=crop", link: AMZ + "Osprey+Farpoint+40" },
    { name: "Tumi Alpha 3 Carry-On", cat: "Luggage", desc: "Ballistic nylon shell, self-compression packing, signature T-Pass security panel.", price: "$675", num: 675, rating: "4.8", reviews: "6.2k", match: "91%", img: UNSPLASH + "1548036328-c9fa89d128fa?w=80&h=80&fit=crop", link: AMZ + "Tumi+Alpha+3+Carry+On" },
    { name: "Peak Design Travel Backpack", cat: "Backpack", desc: "45L MagLatch closure, built-in packing system, carry-on compliant. Photographer's favorite.", price: "$299", num: 299, rating: "4.7", reviews: "5.8k", match: "88%", img: UNSPLASH + "1622560480605-d83c853bc5c3?w=80&h=80&fit=crop", link: AMZ + "Peak+Design+Travel+Backpack+45L" },
    { name: "Eagle Creek Pack-It Cubes", cat: "Accessories", desc: "Compression and organization system for any bag. The packing cubes standard.", price: "$45", num: 45, rating: "4.7", reviews: "31k", match: "74%", img: UNSPLASH + "1548036328-c9fa89d128fa?w=80&h=80&fit=crop", link: AMZ + "Eagle+Creek+Pack-It+Cubes" },
  ],
  fitness: [
    { name: "WHOOP 4.0", cat: "Wearable", desc: "24/7 strain, recovery, and sleep coaching with no screen. Just pure performance data.", price: "$239", num: 239, rating: "4.6", reviews: "28k", match: "96%", img: UNSPLASH + "1575311373937-040b8e1fd5b6?w=80&h=80&fit=crop", link: "https://www.whoop.com" },
    { name: "Garmin Forerunner 965", cat: "Wearable", desc: "AMOLED touchscreen, advanced training load metrics, trail maps. For serious athletes.", price: "$599", num: 599, rating: "4.7", reviews: "8.2k", match: "93%", img: UNSPLASH + "1601925260368-ae2f83cf8b7f?w=80&h=80&fit=crop", link: AMZ + "Garmin+Forerunner+965" },
    { name: "Bowflex SelectTech 552", cat: "Fitness", desc: "Replaces 15 dumbbell sets. Dials from 5–52.5 lbs. The smartest home gym investment.", price: "$429", num: 429, rating: "4.7", reviews: "43k", match: "90%", img: UNSPLASH + "1534438327276-14e5300c3a48?w=80&h=80&fit=crop", link: AMZ + "Bowflex+SelectTech+552" },
    { name: "Hyperice Hypervolt Go 2", cat: "Recovery", desc: "Compact percussion massager, 3 speed settings, 2.5hr battery. TSA-approved carry-on.", price: "$199", num: 199, rating: "4.6", reviews: "11k", match: "84%", img: UNSPLASH + "1601925260368-ae2f83cf8b7f?w=80&h=80&fit=crop", link: AMZ + "Hyperice+Hypervolt+Go+2" },
    { name: "Theragun PRO Gen 6", cat: "Recovery", desc: "60-lb force, 6 attachments, OLED screen, rotating arm. The recovery device pros trust.", price: "$599", num: 599, rating: "4.7", reviews: "9.6k", match: "74%", img: UNSPLASH + "1601925260368-ae2f83cf8b7f?w=80&h=80&fit=crop", link: AMZ + "Theragun+PRO+Gen+6" },
  ],
  services: [
    { name: "Fiverr Pro — Brand Design", cat: "Service", desc: "Vetted pro freelancers for logo and brand identity design. Money-back guarantee.", price: "From $500", num: 500, rating: "4.8", reviews: "8.3k", match: "96%", img: UNSPLASH + "1611080626919-7cf5a9dbab12?w=80&h=80&fit=crop", link: "https://www.fiverr.com/categories/graphics-design" },
    { name: "Notion Teams", cat: "SaaS", desc: "All-in-one workspace: docs, wikis, databases, projects. Scales with any team size.", price: "$16/mo", num: 16, rating: "4.7", reviews: "51k", match: "92%", img: UNSPLASH + "1586953208448-b95a79798f07?w=80&h=80&fit=crop", link: "https://www.notion.so/pricing" },
    { name: "Shopify Basic", cat: "SaaS", desc: "Full e-commerce storefront with built-in payments, shipping, and analytics.", price: "$29/mo", num: 29, rating: "4.6", reviews: "34k", match: "89%", img: UNSPLASH + "1467232004584-a241de8bcf5d?w=80&h=80&fit=crop", link: "https://www.shopify.com/pricing" },
    { name: "Adobe Creative Cloud", cat: "SaaS", desc: "Photoshop, Premiere Pro, Illustrator + 20 more apps. The industry-standard creative suite.", price: "$55/mo", num: 55, rating: "4.7", reviews: "42k", match: "86%", img: UNSPLASH + "1611080626919-7cf5a9dbab12?w=80&h=80&fit=crop", link: "https://www.adobe.com/creativecloud/plans.html" },
    { name: "Canva Pro", cat: "SaaS", desc: "Brand kit, Magic AI tools, 100M+ premium assets. Design made effortlessly fast.", price: "$15/mo", num: 15, rating: "4.8", reviews: "67k", match: "80%", img: UNSPLASH + "1467232004584-a241de8bcf5d?w=80&h=80&fit=crop", link: "https://www.canva.com/pricing/" },
  ],
};

export const INTENTS: Intent[] = [
  { kw: ["headphone", "audio", "wireless", "earphone", "earbuds", "music", "noise cancel", "speaker", "airpods"], db: "headphones", ack: "Got it — pulling top wireless audio picks for you 🎧", clarify: ["What's your budget?", "Over-ear or in-ear? Gaming, travel, or studio?"] },
  { kw: ["laptop", "computer", "video edit", "macbook", "pc", "notebook", "rendering", "blender", "premiere", "creative", "animation", "3d"], db: "laptops", ack: "On it — searching best laptops for your workflow 💻", clarify: ["What's your budget range?", "macOS or Windows preference?"] },
  { kw: ["skincare", "skin", "moisturizer", "serum", "cleanser", "organic", "beauty", "face", "routine", "acne", "pore"], db: "skincare", ack: "Curating your skincare picks ✨", clarify: ["What's your skin type — oily, dry, combination, or sensitive?", "Any specific concerns like acne, aging, or sensitivity?"] },
  { kw: ["running", "shoe", "flat feet", "overpronation", "sneaker", "jogging", "marathon", "trail", "foot support"], db: "running", ack: "Finding the best stability shoes for you 👟", clarify: ["Road, trail, or treadmill?", "What's your weekly mileage roughly?"] },
  { kw: ["gaming", "game", "fps", "esport", "rgb", "stream", "twitch", "console", "setup", "rig", "pc gaming"], db: "gaming", ack: "Building your gaming setup 🎮", clarify: ["PC or console?", "What games do you mainly play — FPS, RPG, or streaming?"] },
  { kw: ["electronic", "tech", "gadget", "tablet", "ipad", "phone", "device", "charger", "accessory"], db: "electronics", ack: "Scanning the tech catalog ⚡", clarify: ["Any specific brand preference?", "What will you mainly use it for?"] },
  { kw: ["home", "house", "living", "decor", "vacuum", "smart home", "kitchen", "furniture", "clean"], db: "home", ack: "Searching top home products 🏠", clarify: ["Looking for a specific room or smart home ecosystem?"] },
  { kw: ["travel", "luggage", "bag", "backpack", "trip", "vacation", "suitcase", "carry on", "pack"], db: "travel", ack: "Finding the best travel gear ✈️", clarify: ["How long are your typical trips?", "Light packer or full-bag traveler?"] },
  { kw: ["fitness", "workout", "gym", "health", "exercise", "yoga", "weight", "dumbbell", "tracker", "sport"], db: "fitness", ack: "Curating fitness gear for you 💪", clarify: ["Strength, cardio, flexibility, or recovery focus?"] },
  { kw: ["service", "freelancer", "business", "software", "tool", "saas", "professional", "agency", "b2b"], db: "services", ack: "Sourcing top services and tools 💼", clarify: ["What's your team size?", "Looking for a one-time service or monthly subscription?"] },
];