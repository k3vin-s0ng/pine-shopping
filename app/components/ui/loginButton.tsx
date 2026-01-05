'use client'

import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "../ui/button"

export default function SignInButton() {
  const { data: session } = useSession()

  return session ? (
    <Button onClick={() => signOut()}>Sign out</Button>
  ) : (
    <Button onClick={() => signIn("google")}>Sign in with Google</Button>
  )
}
