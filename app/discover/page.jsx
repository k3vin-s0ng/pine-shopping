"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/header";
import ProductCard from "../components/conversation/ProductCard";

const SECTIONS = [
  { label: "Trending in Tech",    query: "best tech gadgets 2024" },
  { label: "Popular in Home",     query: "best home decor products" },
  { label: "Top Picks in Style",  query: "best sneakers and footwear" },
  { label: "Trending in Wellness", query: "best wellness and fitness products" },
];

function SkeletonCard() {
  return (
    <div className="prod-skeleton">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line full" />
        <div className="skeleton-line full" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [sections, setSections] = useState(
    SECTIONS.map(s => ({ ...s, products: [], loading: true, error: false }))
  );

  useEffect(() => {
    Promise.all(
      SECTIONS.map((section, i) =>
        fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: section.query, history: [], accumulatedIntent: null, skipClarification: true }),
        })
          .then(r => r.json())
          .then(data => ({ i, products: data.products || [], error: false }))
          .catch(() => ({ i, products: [], error: true }))
      )
    ).then(results => {
      setSections(prev =>
        prev.map((s, i) => {
          const result = results.find(r => r.i === i);
          return result ? { ...s, loading: false, products: result.products, error: result.error } : s;
        })
      );
    });
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 58, background: "var(--cream)", minHeight: "100vh" }}>

        {/* Page header */}
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "64px 44px 48px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10.5,
              fontWeight: 400,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
              margin: "0 0 12px",
            }}>
              Browse &amp; Discover
            </p>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: 52,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--pine-dark)",
              margin: 0,
            }}>
              What&apos;s <em style={{ fontStyle: "italic", color: "var(--pine-mid)" }}>trending</em>
            </h1>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 300,
              color: "var(--muted)",
              margin: "14px 0 0",
              letterSpacing: "0.01em",
            }}>
              Curated picks across categories — want something specific? Let Pine find it for you.
            </p>
          </div>

          {/* Primary CTA */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "var(--warm-white)",
              textDecoration: "none",
              background: "var(--pine)",
              padding: "12px 26px",
              borderRadius: 100,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Talk to Pine →
          </Link>
        </div>

        {/* Divider */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 44px" }}>
          <div style={{ height: 1, background: "var(--stone)" }} />
        </div>

        {/* Sections */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 44px 96px" }}>
          {sections.map((section, si) => (
            <section key={si} style={{ marginTop: 56 }}>

              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 400,
                  fontSize: 21,
                  color: "var(--pine)",
                  margin: 0,
                  whiteSpace: "nowrap",
                }}>
                  {section.label}
                </h2>
                <div style={{ flex: 1, height: 1, background: "var(--stone)" }} />
              </div>

              {/* State: error */}
              {section.error && (
                <div style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                }}>
                  Couldn&apos;t load products right now — try refreshing the page.
                </div>
              )}

              {/* State: loading */}
              {!section.error && section.loading && (
                <div className="prod-grid">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {/* State: empty */}
              {!section.error && !section.loading && section.products.length === 0 && (
                <div style={{
                  padding: "40px 0",
                  textAlign: "center",
                  color: "var(--muted)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                }}>
                  No results found for this category.
                </div>
              )}

              {/* State: results */}
              {!section.error && !section.loading && section.products.length > 0 && (
                <div className="prod-grid">
                  {section.products.slice(0, 3).map((product, i) => (
                    <ProductCard
                      key={product.link || i}
                      product={product}
                      rank={i + 1}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

      </main>
    </>
  );
}
