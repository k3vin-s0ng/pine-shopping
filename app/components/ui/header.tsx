"use client"

import { History } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image"

export default function header() {
    const router = useRouter()
    // useSession can return null session if auth fails, which is fine
    const { data: session, status } = useSession()

    return (
       <header className="bg-white border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image className="" src="/logo.png" width={32} height={32} alt="debatepal logo" />
                        <h1 className="text-2xl font-bold text-[#062244]">Debate<span className="text-[#006bc2]">Pal</span></h1>
                    </Link>

                    <div className="flex items-center space-x-2">
                        {session ? (
                            <>
                                <Button variant="outline" onClick={() => signOut()}>
                                    Logout
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/history")} className="flex items-center space-x-2 hover:cursor-pointer">
                                    <History className="h-4 w-4" />
                                    <span>History</span>
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => router.push("/login")}>
                                Login
                            </Button>
                        )}

                        <Button variant="outline" asChild>
                            <Link href="/about">
                                <span>About</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}