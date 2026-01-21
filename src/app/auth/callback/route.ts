import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("token, user_number")
        .eq("id", data.user.id)
        .single();

      if (!profile || !profile.token) {
        const { data: reservedToken } = await supabase
          .from("reserved_tokens")
          .select("token")
          .eq("is_used", false)
          .limit(1)
          .single();

        let tokenToAssign: string;

        if (reservedToken) {
          tokenToAssign = reservedToken.token;
          await supabase
            .from("reserved_tokens")
            .update({ is_used: true })
            .eq("token", tokenToAssign);
        } else {
          tokenToAssign = "VREDEN-" + Math.random().toString(36).substring(2, 15).toUpperCase();
        }

        let userNumber = profile?.user_number;
        if (!userNumber) {
          const { data: maxUserNum } = await supabase
            .from("profiles")
            .select("user_number")
            .order("user_number", { ascending: false })
            .limit(1)
            .single();
          userNumber = (maxUserNum?.user_number || 0) + 1;
        }

        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
          token: tokenToAssign,
          user_number: userNumber,
          is_verification: false,
        });
      } else {
        const updateData: Record<string, unknown> = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
        };

        if (!profile.user_number) {
          const { data: maxUserNum } = await supabase
            .from("profiles")
            .select("user_number")
            .order("user_number", { ascending: false })
            .limit(1)
            .single();
          updateData.user_number = (maxUserNum?.user_number || 0) + 1;
        }

        await supabase.from("profiles").upsert(updateData);
      }
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
