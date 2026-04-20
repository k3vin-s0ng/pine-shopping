/**
 * catalog-ingest.js
 *
 * Batch ingestion pipeline: DataForSEO Google Shopping -> Supabase.
 *
 * Execution flow per query:
 *   1. POST  /merchant/google/products/task_post    -> submit keyword search
 *   2. POLL  /merchant/google/products/task_get     -> retrieve product list + product_ids
 *   3. POST  /merchant/google/sellers/task_post     -> submit sellers lookup per product_id
 *   4. POLL  /merchant/google/sellers/task_get      -> retrieve direct retailer URLs
 *   5. Embed title + context via OpenAI text-embedding-3-small
 *   6. Upsert into Supabase: products, product_pricing, price_history
 *
 * Usage:
 *   node scripts/catalog-ingest.js
 *
 * Required environment variables (set in .env.local):
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import crypto from 'crypto';


// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  dataforseo: {
    login: process.env.DATAFORSEO_LOGIN,
    password: process.env.DATAFORSEO_PASSWORD,
    baseUrl: 'https://api.dataforseo.com/v3',
    locationCode: 2840,   // United States
    languageCode: 'en',
    device: 'desktop',
    os: 'windows',
  },
  polling: {
    intervalMs: 15_000,   // 15 seconds between poll attempts
    maxAttempts: 20,      // give up after ~5 minutes per task
  },
  ingestion: {
    delayBetweenProductsMs: 2_000,
    delayBetweenQueriesMs: 3_000,
  },
  embedding: {
    model: 'text-embedding-3-small',
    dimensions: 1536,
  },
};

// Retailers ranked by affiliate priority for fashion.
// The ingestion pipeline picks the highest-ranked retailer that returns
// a valid direct URL and marks it as the primary affiliate_url.
const RETAILER_PRIORITY = [
  'amazon.com',
  'nordstrom.com',
  'macys.com',
  'zappos.com',
  'asos.com',
  'revolve.com',
  'abercrombie.com',
  'anthropologie.com',
  'urbanoutfitters.com',
  'gap.com',
  'hm.com',
  'zara.com',
  'target.com',
  'walmart.com',
];

// ---------------------------------------------------------------------------
// Seed queries — fashion only
// Organized by sub-category. Uncomment the full batch once the small batch
// (first 3) has been validated in Supabase Table Editor.
// Estimated cost: ~$0.01/query DataForSEO + ~$0.002/query OpenAI embeddings.
// ---------------------------------------------------------------------------

const SEED_QUERIES = [
  // Small batch — validate first before scaling
  "women's summer dress under $100",
  "men's slim fit chinos",
  "white sneakers women",

  // Women's apparel
  // "midi skirt women",
  // "oversized blazer women",
  // "linen top women",
  // "wide leg jeans women",
  // "bodycon dress women",
  // "women's trench coat",
  // "slip dress women",
  // "women's cashmere sweater",
  // "floral wrap dress women",
  // "women's cargo pants",

  // Men's apparel
  // "men's linen shirt",
  // "men's casual button down shirt",
  // "men's polo shirt",
  // "men's wool coat",
  // "men's joggers",
  // "men's slim fit suit",
  // "men's oxford shirt",
  // "men's bomber jacket",
  // "men's chore coat",

  // Footwear — women
  // "loafers women",
  // "women's ankle boots",
  // "women's sandals summer",
  // "platform sneakers women",
  // "ballet flats women",
  // "women's knee high boots",

  // Footwear — men
  // "chelsea boots men",
  // "men's leather sneakers",
  // "men's loafers",
  // "white sneakers men",
  // "men's dress shoes under $200",

  // Accessories
  // "crossbody bag under $100",
  // "tote bag women",
  // "leather belt men",
  // "sunglasses women",
  // "women's gold hoop earrings",
  // "minimalist watch men",
  // "baseball cap women",
  // "silk scarf women",

  // Outerwear
  // "women's puffer jacket",
  // "men's peacoat",
  // "women's leather jacket",
  // "men's rain jacket",
  // "denim jacket women",
];

// ---------------------------------------------------------------------------
// Client initialization
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const dataforseoAuthHeader = Buffer
  .from(`${CONFIG.dataforseo.login}:${CONFIG.dataforseo.password}`)
  .toString('base64');

// ---------------------------------------------------------------------------
// DataForSEO API client
// ---------------------------------------------------------------------------

async function dfsPost(endpoint, body) {
  const response = await fetch(`${CONFIG.dataforseo.baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${dataforseoAuthHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO POST ${endpoint} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function dfsGet(endpoint) {
  const response = await fetch(`${CONFIG.dataforseo.baseUrl}${endpoint}`, {
    headers: { 'Authorization': `Basic ${dataforseoAuthHeader}` },
  });

  if (!response.ok) {
    throw new Error(`DataForSEO GET ${endpoint} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Poll a task endpoint until result_count > 0 or max attempts exceeded.
// Returns the first result object, or null on timeout.
async function pollTask(endpoint, taskId) {
  for (let attempt = 1; attempt <= CONFIG.polling.maxAttempts; attempt++) {
    await sleep(CONFIG.polling.intervalMs);

    const response = await dfsGet(`${endpoint}/${taskId}`);
    const task = response.tasks?.[0];

    if (task?.status_code === 20000 && task?.result_count > 0) {
      return task.result?.[0] ?? null;
    }

    console.log(`  [poll] attempt ${attempt}/${CONFIG.polling.maxAttempts} — task ${taskId} not ready`);
  }

  console.warn(`  [warn] task ${taskId} timed out after ${CONFIG.polling.maxAttempts} attempts`);
  return null;
}

// ---------------------------------------------------------------------------
// DataForSEO task submission
// ---------------------------------------------------------------------------

async function submitProductsTask(keyword) {
  const response = await dfsPost('/merchant/google/products/task_post', [{
    keyword,
    location_code: CONFIG.dataforseo.locationCode,
    language_code: CONFIG.dataforseo.languageCode,
    device: CONFIG.dataforseo.device,
    os: CONFIG.dataforseo.os,
  }]);

  const task = response.tasks?.[0];
  if (!task?.id) {
    throw new Error(`Failed to create products task for keyword: "${keyword}"`);
  }

  console.log(`  [products] task submitted: ${task.id} (cost: $${task.cost ?? 0})`);
  return task.id;
}

async function submitSellersTask(productId) {
  const response = await dfsPost('/merchant/google/sellers/task_post', [{
    product_id: productId,
    location_code: CONFIG.dataforseo.locationCode,
    language_code: CONFIG.dataforseo.languageCode,
  }]);

  const task = response.tasks?.[0];
  if (!task?.id) {
    throw new Error(`Failed to create sellers task for product_id: ${productId}`);
  }

  return task.id;
}

// ---------------------------------------------------------------------------
// Data transformation
// ---------------------------------------------------------------------------

// Flatten and deduplicate product items from a Products result.
// The Products endpoint returns carousels containing nested items;
// the same product_id can appear across multiple carousels.
function extractUniqueProducts(result) {
  const seen = new Set();
  const items = [];

  for (const topItem of result.items ?? []) {
    const candidates = topItem.type === 'google_shopping_carousel'
      ? (topItem.items ?? [])
      : [topItem];

    for (const item of candidates) {
      if (item.product_id && !seen.has(item.product_id)) {
        seen.add(item.product_id);
        items.push(item);
      }
    }
  }

  return items;
}

// Select the highest-priority retailer with a valid direct URL.
// Falls back to the first available direct URL if no preferred retailer matches.
function selectPrimaryRetailer(sellers) {
  const valid = sellers.filter(s =>
    s.url &&
    !s.url.includes('google.com') &&
    s.product_availability !== 'out_of_stock'
  );

  if (!valid.length) return null;

  for (const domain of RETAILER_PRIORITY) {
    const match = valid.find(s => s.domain?.includes(domain));
    if (match) return match;
  }

  return valid[0];
}

// Map all valid sellers to product_pricing rows.
function mapSellersTopricing(sellers, productId) {
  return sellers
    .filter(s => s.url && !s.url.includes('google.com'))
    .map(s => ({
      product_id: productId,
      merchant: s.seller_name ?? s.domain,
      affiliate_url: s.url,
      price_cents: s.base_price != null ? Math.round(s.base_price * 100) : null,
      sale_price_cents: (s.total_price != null && s.total_price < s.base_price)
        ? Math.round(s.total_price * 100)
        : null,
      availability: s.product_availability ?? 'unknown',
      retailer_sku: null,  // populated downstream by retailer scraping layer
      refreshed_at: new Date().toISOString(),
    }));
}

// SHA-256 hash of stable product fields.
// Used to determine whether re-embedding is necessary on re-ingest.
function computeContentHash(title, brand, description) {
  const input = `${title}|${brand ?? ''}|${description ?? ''}`;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ---------------------------------------------------------------------------
// OpenAI embeddings
// ---------------------------------------------------------------------------

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: CONFIG.embedding.model,
    input: text,
    dimensions: CONFIG.embedding.dimensions,
  });

  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Supabase writes
// ---------------------------------------------------------------------------

// Upsert on external_id — safe to re-run; updates existing rows in place.
async function upsertProduct(row) {
  const { data, error } = await supabase
    .from('products')
    .upsert(row, { onConflict: 'external_id' })
    .select('id')
    .single();

  if (error) {
    throw new Error(`products upsert failed for external_id ${row.external_id}: ${error.message}`);
  }

  return data.id;
}

// Upsert on (product_id, merchant) unique constraint.
async function upsertPricing(row) {
  const { error } = await supabase
    .from('product_pricing')
    .upsert(row, { onConflict: 'product_id,merchant' });

  if (error) {
    throw new Error(`product_pricing upsert failed for product ${row.product_id} / ${row.merchant}: ${error.message}`);
  }
}

// Append-only — price_history is never updated, only inserted into.
async function insertPriceHistory(row) {
  const { error } = await supabase
    .from('price_history')
    .insert(row);

  if (error) {
    // Non-critical — log and continue rather than aborting the pipeline.
    console.warn(`  [warn] price_history insert failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Core pipeline
// ---------------------------------------------------------------------------

async function processProduct(item, query) {
  const { title, product_id: externalId, product_images: images } = item;
  const imageUrl = images?.[0] ?? null;

  console.log(`  [product] ${title} (${externalId})`);

  // Sellers lookup
  const sellersTaskId = await submitSellersTask(externalId);
  const sellersResult = await pollTask(
    '/merchant/google/sellers/task_get/advanced',
    sellersTaskId
  );

  if (!sellersResult) {
    console.warn(`  [skip] no sellers result for ${externalId}`);
    return;
  }

  const sellers = sellersResult.items ?? [];
  const primarySeller = selectPrimaryRetailer(sellers);

  if (!primarySeller) {
    console.warn(`  [skip] no valid direct URL for "${title}"`);
    return;
  }

  // Embedding — concatenate title, seller name, and originating query
  // for richer semantic representation
  const embeddingInput = [title, primarySeller.seller_name, query]
    .filter(Boolean)
    .join(' ');

  const embedding = await generateEmbedding(embeddingInput);

  // Upsert product row (stable content)
const productRow = {
    external_id: externalId,
    title,
    brand: primarySeller.seller_name ?? null,
    image_urls: imageUrl ? [imageUrl] : [],
    attributes: {
        rating: item.product_rating?.value ?? null,
        review_count: item.product_rating?.votes_count ?? null,
    },
    embedding,
    content_hash: computeContentHash(title, primarySeller.seller_name, null),
    last_verified_at: new Date().toISOString(),
};

  const internalId = await upsertProduct(productRow);

  // Write all valid sellers to product_pricing
  const pricingRows = mapSellersTopricing(sellers, internalId);

  for (const pricingRow of pricingRows) {
    await upsertPricing(pricingRow);

    if (pricingRow.price_cents != null) {
      await insertPriceHistory({
        product_id: internalId,
        merchant: pricingRow.merchant,
        price_cents: pricingRow.price_cents,
        recorded_at: new Date().toISOString(),
      });
    }
  }

  console.log(`  [ok] "${title}" — ${pricingRows.length} sellers, primary: ${primarySeller.seller_name}`);
}

async function processQuery(query) {
  console.log(`\n[query] "${query}"`);

  const productsTaskId = await submitProductsTask(query);
  const productsResult = await pollTask(
    '/merchant/google/products/task_get/advanced',
    productsTaskId
  );

  if (!productsResult) {
    console.error(`[error] no products result for query: "${query}"`);
    return;
  }

  const products = extractUniqueProducts(productsResult);
  console.log(`  [products] ${products.length} unique products found`);

  for (const item of products) {
    try {
      await processProduct(item, query);
    } catch (err) {
      // Log and continue — one failed product should not abort the query
      console.error(`  [error] failed to process product ${item.product_id}: ${err.message}`);
    }
    await sleep(CONFIG.ingestion.delayBetweenProductsMs);
  }

  console.log(`[done] query: "${query}"`);
}

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

function validateEnvironment() {
  const required = [
    'DATAFORSEO_LOGIN',
    'DATAFORSEO_PASSWORD',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  validateEnvironment();

  console.log('[pine] catalog ingestion starting');
  console.log(`[pine] queries: ${SEED_QUERIES.length}`);

  for (const query of SEED_QUERIES) {
    try {
      await processQuery(query);
    } catch (err) {
      // Log and continue — one failed query should not abort the pipeline
      console.error(`[error] query "${query}" failed: ${err.message}`);
    }
    await sleep(CONFIG.ingestion.delayBetweenQueriesMs);
  }

  console.log('\n[pine] ingestion complete');
  console.log('[pine] verify results in Supabase Table Editor: products, product_pricing, price_history');
}

main().catch(err => {
  console.error('[fatal]', err.message);
  process.exit(1);
});