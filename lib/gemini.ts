import { GoogleGenerativeAI } from "@google/generative-ai";
import { setDebugLog } from "@/lib/utils";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateText(prompt: string): Promise<string> {
  setDebugLog("Gemini API request initiated:", { promptLength: prompt.length });
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    setDebugLog("Gemini API request completed successfully:", { responseLength: text.length });
    return text;
  } catch (error) {
    setDebugLog("Gemini API Error:", error);
    throw new Error("Failed to generate text");
  }
}
