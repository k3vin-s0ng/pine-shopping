import Orb from "./orb";

export default function Hero() {
  return (
    <section className="hero">
      <p className="hero-title">Hello, I'm <em>Pine.</em></p>
      <p className="hero-sub">How can I curate your world today?</p>

      <div className="orb-stage">
        <Orb />
      </div>
    </section>
  );
}
