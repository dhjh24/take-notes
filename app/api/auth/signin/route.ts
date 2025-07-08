import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { setDebugLog } from "@/lib/utils"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  setDebugLog("Signin request received");
  try {
    const body = await request.json()
    const { email, password } = signInSchema.parse(body)

    setDebugLog("Signin data parsed successfully for email:", email);
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setDebugLog("Signin error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    setDebugLog("Signin successful for user:", data.user?.id);
    return NextResponse.json({ user: data.user, session: data.session })
  } catch (error) {
    setDebugLog("Error during signin:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
