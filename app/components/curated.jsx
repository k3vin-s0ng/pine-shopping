export default function Curated() {
  return (
    <section className="curated-section">
      <p className="section-label">Personalized for you</p>
      <h2 className="section-title">Curated selections</h2>

      <div className="product-row">
        <div className="product-card">
          <div className="product-img p1">⌚<span className="price-tag">$2,450</span></div>
          <p className="product-name">Horizon Chronograph</p>
          <p className="product-sub">Essential Timepiece</p>
        </div>
        <div className="product-card">
          <div className="product-img p2">🎧<span className="price-tag">$599</span></div>
          <p className="product-name">Silence One Pro</p>
          <p className="product-sub">Audio Excellence</p>
        </div>
        <div className="product-card">
          <div className="product-img p3">🕯️<span className="price-tag">$85</span></div>
          <p className="product-name">Santal Noir</p>
          <p className="product-sub">Signature Scent</p>
        </div>
        <div className="product-card">
          <div className="product-img p4">💡<span className="price-tag">$820</span></div>
          <p className="product-name">Aura Beam</p>
          <p className="product-sub">Ambient Lighting</p>
        </div>
        <div className="product-card">
          <div className="product-img p5">🎒<span className="price-tag">$480</span></div>
          <p className="product-name">Weekender Tote</p>
          <p className="product-sub">Travel Companion</p>
        </div>
      </div>
    </section>
  );
}