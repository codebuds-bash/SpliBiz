import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Navbar from "../components/Navbar";
import { useToast, Icons } from "../components/UIComponents";

export default function GroupDetails() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [username, setUsername] = useState("");
  const [inviteToken, setInviteToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  /* ---------------- FETCH GROUP ---------------- */
  useEffect(() => {
    supabase
      .from("groups")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setGroup(data));
  }, [id]);

  /* ---------------- FETCH MEMBERS ---------------- */
  async function fetchMembers() {
    setLoadingMembers(true);

    const { data, error } = await supabase
      .from("group_members")
      .select(`
        user_id,
        role,
        profiles (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq("group_id", id);

    if (error) {
      console.error("Fetch members error:", error);
      setMembers([]);
    } else {
      setMembers(
        data.map(row => ({
          ...row.profiles,
          role: row.role,
          user_id: row.user_id
        }))
      );
    }

    setLoadingMembers(false);
  }

  useEffect(() => {
    fetchMembers();
  }, [id]);

  /* ---------------- ROLE CHECK ---------------- */
  const isAdmin = members.some(
    m => m.user_id === currentUserId && m.role === "admin"
  );

  /* ---------------- SEARCH USERS ---------------- */
  async function searchUsers(query) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, name, avatar_url")
      .ilike("username", `%${query}%`)
      .limit(5);

    setSearchResults(data || []);
  }

  function selectUser(user) {
    setUsername(user.username);
    setSearchResults([]);
  }

  /* ---------------- ADD MEMBER ---------------- */
  async function addByUsername() {
    if (!username.trim()) return;

    const { error } = await supabase.rpc("add_member_by_username", {
      p_group_id: id,
      p_username: username.trim()
    });

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast(`@${username} added to group`, "success");
      setUsername("");
      setSearchResults([]);
      fetchMembers();
    }
  }

  /* ---------------- REMOVE MEMBER (ADMIN ONLY) ---------------- */
  async function removeMember(userId) {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", userId);

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast("Member removed", "success");
      fetchMembers();
    }
  }

  /* ---------------- INVITE ---------------- */
  async function generateInvite() {
    const token = crypto.randomUUID();

    const { error } = await supabase.from("group_invites").insert({
      group_id: id,
      invite_token: token
    });

    if (!error) setInviteToken(token);
  }

  /* ---------------- AVATAR ---------------- */
  const getAvatar = (member) => {
    if (member.avatar_url) {
      return (
        <img
          src={member.avatar_url}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-green-500/20 
                      text-green-500 flex items-center justify-center font-bold uppercase text-sm">
        {member.username.slice(0, 2)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link to="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white mb-3 block">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-6">
          {group?.name || "Loading..."}
        </h1>

        {/* MEMBERS */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-white mb-4">
            Members ({members.length})
          </h3>

          <div className="flex flex-wrap gap-4">
            {members.map(member => (
              <div
                key={member.user_id}
                className="flex items-center gap-3 bg-white/5 border border-[var(--border-color)] px-3 py-2 rounded-lg"
              >
                {getAvatar(member)}

                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {member.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    @{member.username}
                  </p>
                </div>

                {/* ROLE TAG */}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium
                    ${member.role === "admin"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                    }`}
                >
                  {member.role}
                </span>

                {/* REMOVE BUTTON (ADMIN ONLY) */}
                {isAdmin && member.user_id !== currentUserId && (
                  <button
                    onClick={() => removeMember(member.user_id)}
                    className="ml-2 text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ADD MEMBER */}
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Add Member
            </h3>

            <div className="relative">
              <div className="flex gap-2">
                <input
                  placeholder="Search username..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (e.target.value.length > 2) {
                      searchUsers(e.target.value);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="input-field"
                />
                <button onClick={addByUsername} className="btn-primary">
                  Add
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-[#1c1c1c] border border-[var(--border-color)] rounded-lg overflow-hidden">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer"
                    >
                      {getAvatar(user)}
                      <div>
                        <p className="text-sm text-white">{user.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INVITE */}
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">
              Invite Link
            </h3>

            {inviteToken ? (
              <div className="flex flex-col gap-3">
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <QRCode
                    value={`${window.location.origin}/join?token=${inviteToken}`}
                    size={150}
                  />
                </div>

                <button
                  className="btn-secondary w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/join?token=${inviteToken}`
                    );
                    addToast("Link copied", "success");
                  }}
                >
                  Copy Invite Link
                </button>
              </div>
            ) : (
              <button onClick={generateInvite} className="btn-primary w-full">
                Generate Invite Link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
