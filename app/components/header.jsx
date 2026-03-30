import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="nav-logo flex items-center gap-10">
        <Link href="/" className="flex items-center gap-10">
          <Image className="" src="/logo.png" width={40} height={40} alt="pine logo" />
          <span className="nav-brand">Pine</span>
        </Link>
      </div>

      <ul className="nav-links">
        <li><a href="/">Collections</a></li>
        <li><a href="/">Discover</a></li>
        <li><a href="/">Journal</a></li>
      </ul>
    </nav>
  );
}