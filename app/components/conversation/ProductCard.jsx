// ProductCard — accepts the Product shape returned by /api/search
// Fields: { name, cat, desc, price, img, link, match, rating, reviews }
// TODO: when Kevin's Data Agent ships (K5), map to enriched result object:
//   product_name → name, image_url → img, url → link, retailer → cat,
//   review_signals.quality_signal → desc, soft_preference_score → match

const CATEGORY_EMOJI = {
  Audio: "🎧",
  Computing: "💻",
  Beauty: "✨",
  Footwear: "👟",
  "Gaming PC": "🖥",
  "Gaming Mouse": "🖱",
  "Gaming Headset": "🎧",
  "Gaming Chair": "🪑",
  Tablet: "📱",
  Wearable: "⌚",
  Smartphone: "📱",
  Accessories: "⚡",
  Home: "🏠",
  Kitchen: "🍳",
  "Smart Home": "💡",
  Luggage: "🧳",
  Backpack: "🎒",
  Recovery: "💆",
  Fitness: "💪",
  Service: "💼",
  SaaS: "⚙️",
};

export default function ProductCard({ product, rank, reason }) {
  const { name, cat, desc, price, img, link } = product;

  const displayReason = reason || desc;
  const emoji = CATEGORY_EMOJI[cat] || "🛍";

  return (
    <div className="prod-card">
      {/* Image area */}
      <div className="prod-image">
        {img ? (
          <img src={img} alt={name} />
        ) : (
          <span className="prod-image-placeholder">{emoji}</span>
        )}
        <div className="prod-rank-badge">{rank}</div>
        <div className="prod-price-badge">{price}</div>
        {/* TODO: implement image carousel when multiple images available per product */}
      </div>

      {/* Card body */}
      <div className="prod-body">
        <div className="prod-category">{cat}</div>
        <div className="prod-name">{name}</div>
        <div className="prod-desc">{desc}</div>

        {/* AI Recommendation — populated by D6 explanation generation */}
        <div className="ai-rec">
          <svg style={{width:13,height:13,flexShrink:0,marginTop:1}} viewBox="0 0 24 24" fill="none" stroke="#4A8B65" strokeWidth="1.8">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <div className="ai-rec-content">
            <div className="ai-rec-label">AI Recommendation</div>
            <div className="ai-rec-text">{displayReason}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="prod-actions">
          <a
            className="view-btn"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            View at {cat !== "Shopping" ? cat : "Store"}
          </a>
          {/* TODO: wire Save to user session when Kevin's backend (K-02) ships */}
          <button className="save-btn" onClick={() => {}}>Save</button>
        </div>
      </div>
    </div>
  );
}
