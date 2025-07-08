import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { setDebugLog } from "@/lib/utils"

const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  fontSize: z.enum(["small", "medium", "large"]).optional(),
  editorTheme: z.enum(["default", "github", "monokai", "solarized"]).optional(),
  autoSave: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  setDebugLog("Get user preferences request received");
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setDebugLog("Unauthorized access to preferences");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    setDebugLog("Fetching preferences for user:", user.id);
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single()

    if (error && error.code !== "PGRST116") {
      setDebugLog("Error fetching preferences:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    setDebugLog("Preferences fetched successfully");
    return NextResponse.json({ preferences: data || {} })
  } catch (error) {
    setDebugLog("Error in get preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  setDebugLog("Update user preferences request received");
  try {
    const body = await request.json()
    const preferences = preferencesSchema.parse(body)

    setDebugLog("Preferences data parsed successfully:", preferences);
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setDebugLog("Unauthorized access to update preferences");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    setDebugLog("Updating preferences for user:", user.id);
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      setDebugLog("Error updating preferences:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    setDebugLog("Preferences updated successfully");
    return NextResponse.json({ preferences: data })
  } catch (error) {
    setDebugLog("Error in update preferences:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
