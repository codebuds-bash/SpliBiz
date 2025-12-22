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
  
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkUser();
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function verifyToken() {
    // 1. Check if token exists and get group details
    const { data: invite, error } = await supabase
      .from("group_invites")
      .select("group_id, groups(name, id)")
      .eq("invite_token", token)
      .single();

    if (error || !invite) {
      setIsValidToken(false);
    } else {
      setGroup(invite.groups);
      setIsValidToken(true);
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!user) {
      // Redirect to Login with return path
      navigate("/login", { state: { from: `/join?token=${token}` } });
      return;
    }

    setJoining(true);
    
    // 2. Check if already a member
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      addToast("You are already a member of this group!", "info");
      navigate(`/group/${group.id}`);
      return;
    }

    // 3. Join Group
    const { error } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id
    });

    if (error) {
      addToast("Failed to join group: " + error.message, "error");
    } else {
      // 4. (Optional) delete invite - Single use token logic
      await supabase
        .from("group_invites")
        .delete()
        .eq("invite_token", token);

      // 5. Notify Group Admin (Owner)
      // First get the owner of the group
      const { data: groupData } = await supabase
        .from("groups")
        .select("created_by")
        .eq("id", group.id)
        .single();
        
      if (groupData?.created_by) {
        await supabase.from("notifications").insert({
          user_id: groupData.created_by,
          actor_id: user.id,
          group_id: group.id,
          type: "invite_used",
          message: `${user.email} joined ${group.name} via invite link`,
        });
      }

      addToast(`Successfully joined ${group.name}!`, "success");
      navigate(`/group/${group.id}`);
    }
    setJoining(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />
      
      <div className="flex items-center justify-center px-4 py-32">
        <div className="w-full max-w-md card text-center">
          {!token ? (
            <>
              <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Link</h1>
              <p className="text-[var(--text-muted)] mb-6">No invitation token found.</p>
              <Link to="/" className="btn-secondary">Go Home</Link>
            </>
          ) : !isValidToken ? (
            <>
              <h1 className="text-2xl font-bold text-red-500 mb-2">Expired or Invalid Link</h1>
              <p className="text-[var(--text-muted)] mb-6">This invitation link is no longer valid.</p>
              <Link to="/" className="btn-secondary">Go Home</Link>
            </>
          ) : (
            <>
              <p className="text-[var(--text-muted)] uppercase tracking-wider text-xs font-bold mb-4">
                You've been invited to join
              </p>
              <h1 className="text-3xl font-bold text-white mb-8">
                {group.name}
              </h1>
              
              <div className="flex flex-col gap-3">
                {user ? (
                   <button 
                    onClick={handleJoin} 
                    disabled={joining}
                    className="btn-primary w-full flex justify-center items-center gap-2"
                  >
                    {joining ? (
                      <>
                        <Loader size="sm" className="text-black" />
                        <span>Joining...</span>
                      </>
                    ) : "Join Group Now"}
                  </button>
                ) : (
                  <button 
                    onClick={handleJoin} 
                    className="btn-primary w-full"
                  >
                    Login to Join
                  </button>
                )}
                
                <Link to="/" className="btn-secondary w-full">
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
