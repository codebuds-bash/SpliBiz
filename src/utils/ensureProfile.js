// src/utils/ensureProfile.js
import { supabase } from "../supabaseClient";

export async function ensureProfile(user, navigate) {
  if (!user) return;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username")
    .eq("id", user.id)
    .single();
    
if (!profile?.username && navigate) {
  navigate("/complete-profile", { replace: true });
  return;
}

  // If profile exists, enrich name if missing
  if (profile) {
    if (!profile.name && user.user_metadata?.full_name) {
      await supabase
        .from("profiles")
        .update({
          name: user.user_metadata.full_name,
        })
        .eq("id", user.id);
    }
    return;
  }

  // Create profile if missing (fallback)
  await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || null,
  });
}
