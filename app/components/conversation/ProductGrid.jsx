import ProductCard from "./ProductCard";

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

export default function ProductGrid({ products = [], loading, chatResponse, clarificationNeeded }) {
  // Clarification path: LLM explicitly flagged clarification_needed — show Pine's question
  if (!loading && clarificationNeeded) {
    return (
      <div>
        <div className="prod-grid-header">
          <span className="prod-grid-label">Pine says</span>
        </div>
        <div className="clarification-wrap">
          <div className="clarification-bubble">
            <div className="clarification-icon">🌲</div>
            <div className="clarification-text">{chatResponse}</div>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeletons
  if (loading) {
    return (
      <div>
        <div className="prod-grid-header">
          <span className="prod-grid-label">Curated for this conversation</span>
          <span className="prod-count">searching…</span>
        </div>
        <div className="prod-grid">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Empty (no results, no clarification message)
  if (products.length === 0) {
    return (
      <div>
        <div className="prod-grid-header">
          <span className="prod-grid-label">Curated for this conversation</span>
        </div>
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <span className="empty-text">No results found — try refining your search</span>
        </div>
      </div>
    );
  }

  const visible = products.slice(0, 3);

  return (
    <div>
      <div className="prod-grid-header">
        <span className="prod-grid-label">Curated for this conversation</span>
        <span className="prod-count">{visible.length} of {products.length}</span>
      </div>
      <div className="prod-grid">
        {visible.map((product, i) => (
          <ProductCard
            key={product.link || i}
            product={product}
            rank={i + 1}
            // TODO D6: pass `reason` from Reasoning Agent explanation generation
          />
        ))}
      </div>
    </div>
  );
}
