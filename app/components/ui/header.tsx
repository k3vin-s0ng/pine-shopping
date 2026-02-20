import Link from "next/link"
import Image from "next/image"

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-background border-b border-border z-50">
      <div className="h-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" width={32} height={32} alt="Sicero logo" />
          <span className="text-2xl font-semibold text-[#062244]">Sic<span className="text-[#006bc2]">ero</span></span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm text-muted-foreground">
          <button className="hover:text-foreground transition-colors">How it works</button>
          <button className="hover:text-foreground transition-colors">About</button>
        </div>
      </div>
    </header>
  )
}
