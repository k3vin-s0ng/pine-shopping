export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-logo">
        <span className="nav-brand">Pine</span>
      </div>

      <ul className="nav-links">
        <li><a href="#">Collections</a></li>
        <li><a href="#">Discover</a></li>
        <li><a href="#">Journal</a></li>
      </ul>
    </nav>
  );
}