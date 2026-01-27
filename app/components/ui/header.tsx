"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function header() {
    const router = useRouter()
    // useSession can return null session if auth fails, which is fine

    return (
       <header className="bg-white border-b">
            <div className="max-w-4xl ml-30 px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-left space-x-2">
                        <Image className="" src="/logo.png" width={32} height={32} alt="sicero logo" />
                        <h1 className="text-2xl font-bold text-[#062244]">Sic<span className="text-[#006bc2]">ero</span></h1>
                    </Link>
                </div>
            </div>
        </header>
    )
}