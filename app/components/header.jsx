import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-logo flex items-center gap-10">
        <Link href="/" className="flex items-center gap-10" style={{textDecoration:'none'}}>
          <Image className="" src="/logo.png" width={40} height={40} alt="pine logo" />
          <span className="nav-brand">Pine</span>
        </Link>
      </div>

      <ul className="nav-links">
        <li><a href="/">Collections</a></li>
        <li><a href="/">Discover</a></li>
        <li><a href="/">Journal</a></li>
      </ul>

      <div className="nav-actions">
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </nav>
  );
}