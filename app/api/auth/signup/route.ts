import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { setDebugLog } from "@/lib/utils";

const signUpSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  setDebugLog("Signup request received");
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = signUpSchema.parse(body);

    setDebugLog("Signup data parsed successfully for email:", email);
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      },
    });

    if (error) {
      setDebugLog("Signup error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    setDebugLog("Signup successful for user:", data.user?.id);
    return NextResponse.json({ user: data.user, session: data.session });
  } catch (error) {
    setDebugLog("Error during signup:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
