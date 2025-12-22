// src/utils/ensureProfile.js
import { supabase } from "../supabaseClient";

export async function ensureProfile(user, navigate) {
  if (!user) return;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // IF PROFILE EXISTS
  if (profile) {
    // Redirect if incomplete
    if (!profile.username && navigate) {
      navigate("/complete-profile", { replace: true });
      return;
    }

    // Enrich missing fields (background task)
    const updates = {};
    if (!profile.name && user.user_metadata?.full_name) {
      updates.name = user.user_metadata.full_name;
    }
    if (!profile.avatar_url && (user.user_metadata?.avatar_url || user.user_metadata?.picture)) {
      updates.avatar_url = user.user_metadata.avatar_url || user.user_metadata.picture;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
    }
    return;
  }

  // IF NO PROFILE (create fallback)
  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  });

  if (!insertError && navigate) {
     navigate("/complete-profile", { replace: true });
  }
}
