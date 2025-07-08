import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/gemini"
import { createClient } from "@/lib/supabase/server"
import { setDebugLog } from "@/lib/utils"

export async function POST(request: NextRequest) {
  setDebugLog("AI Summarize request received");
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setDebugLog("Unauthorized summarize request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, noteId } = await request.json()

    if (!text) {
      setDebugLog("Summarize request missing text");
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    setDebugLog("Generating summary for text length:", text.length);
    const prompt = `Please provide a concise summary of the following text:\n\n${text}`
    const summary = await generateText(prompt)

    // Save AI interaction to database
    if (noteId) {
      setDebugLog("Saving AI interaction to database:", noteId);
      await supabase.from("ai_interactions").insert({
        user_id: user.id,
        note_id: noteId,
        interaction_type: "summarize",
        input_text: text.substring(0, 1000), // Limit stored text
        output_text: summary,
      })
    }

    setDebugLog("Summary generated successfully");
    return NextResponse.json({ result: summary })
  } catch (error) {
    setDebugLog("AI Summarize Error:", error);
    return NextResponse.json({ error: "Failed to summarize text" }, { status: 500 })
  }
}
