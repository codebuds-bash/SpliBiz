import { supabase } from "../supabaseClient";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useToast, Loader } from "../components/UIComponents";

export default function JoinGroup() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [status, setStatus] = useState("verifying"); // verifying, error

  useEffect(() => {
    async function handleAutoJoin() {
      if (!token) {
        // Wait one tick or just return, if token never comes user sees loader?
        // Better to check if param is missing entirely.
        // But for now, if token is null, we do nothing. 
        // If it persists as null, we might need a timeout or simply "Invalid Link" UI if params are ready.
        // Assuming token is critical.
        setStatus("error");
        return;
      }
      
      try {
        // 1. Check Auth Session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not logged in -> Save token and Redirect
          localStorage.setItem("join_token", token);
          addToast("Please login to join the group", "info");
          navigate("/login", { state: { from: `/join?token=${token}` } });
          return;
        }

        // 2. Fetch Invite (only group_id)
        const { data: invite, error } = await supabase
          .from("group_invites")
          .select("group_id")
          .eq("invite_token", token)
          .maybeSingle();

        if (error || !invite) {
          console.error("Invite Error:", error);
          setStatus("error");
          return;
        }

        // 3. Join Group
        const { error: joinError } = await supabase.from("group_members").insert({
          group_id: invite.group_id,
          user_id: session.user.id
        });

        if (joinError) {
          if (joinError.code === '23505') {
            // Unique violation = Already a member
            addToast("You are already a member of this group.", "info");
            navigate(`/group/${invite.group_id}`);
          } else {
            throw joinError;
          }
        } else {
          addToast("Successfully joined the group!", "success");
          
          // 4. (Optional) Delete invite - Single use logic
          await supabase
            .from("group_invites")
            .delete()
            .eq("invite_token", token);
          
          // Navigate to dashboard or group page
          navigate(`/group/${invite.group_id}`);
        }

      } catch (err) {
        console.error("Auto-join failed:", err);
        addToast("Failed to join group: " + err.message, "error");
        setStatus("error");
      }
    }

    handleAutoJoin();
  }, [token, navigate, addToast]);


  if (status === "error") {
    return (
      <div className="min-h-screen bg-[var(--bg-body)]">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-32">
          <div className="w-full max-w-md card text-center">
             <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid or Expired Link</h1>
             <p className="text-[var(--text-muted)] mb-6">This invitation link is no longer valid or has already been used.</p>
             <Link to="/dashboard" className="btn-secondary">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-32">
        <div className="flex flex-col items-center">
            <Loader size="lg" />
            <p className="text-white mt-4 font-medium">Joining group...</p>
        </div>
      </div>
    </div>
  );
}
