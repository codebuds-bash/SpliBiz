import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Navbar from "../components/Navbar";
import { useToast, Icons } from "../components/UIComponents";

export default function GroupDetails() {
  const { id } = useParams();
  const [username, setUsername] = useState("");
  const [inviteToken, setInviteToken] = useState(null);
  const [group, setGroup] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.from("groups").select("*").eq("id", id).single().then(({ data }) => setGroup(data));
  }, [id]);

  async function addByUsername() {
    const { error } = await supabase.rpc("add_member_by_username", {
      p_group_id: id,
      p_username: username
    });

    if (error) {
      addToast(error.message, "error");
    } else {
      addToast("User added to group!", "success");
      setUsername("");
    }
  }

  async function generateInvite() {
    const token = crypto.randomUUID();

    await supabase.from("group_invites").insert({
      group_id: id,
      invite_token: token
    });

    setInviteToken(token);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/dashboard" className="text-sm text-[var(--text-muted)] hover:text-white mb-2 block">
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">{group?.name || 'Loading...'}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Member Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">Add Member</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Add someone directly if you know their username.
            </p>
            
            <div className="flex gap-2">
              <input
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
              />
              <button onClick={addByUsername} className="btn-primary whitespace-nowrap">
                Add User
              </button>
            </div>
          </div>

          {/* Invite Card */}
          <div className="card">
            <h3 className="text-xl font-semibold text-white mb-4">Invite Link</h3>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              Generate a unique QR code to let people join nearby.
            </p>

            <div className="flex flex-col items-center">
              {!inviteToken ? (
                <button onClick={generateInvite} className="btn-secondary w-full">
                  Generate Invitation QR
                </button>
              ) : (
                <div className="w-full">
                  <div className="bg-white p-4 rounded-lg flex justify-center mb-6">
                    <QRCode
                      value={`${window.location.origin}/join?token=${inviteToken}`}
                      size={150}
                    />
                  </div>
                  
                  {/* Link Actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/join?token=${inviteToken}`;
                        navigator.clipboard.writeText(link);
                        addToast("Link copied to clipboard", "success");
                      }}
                      className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
                    >
                      <Icons.Copy /> Copy Link
                    </button>
                    <button 
                      onClick={() => {
                        const link = `${window.location.origin}/join?token=${inviteToken}`;
                        if (navigator.share) {
                          navigator.share({
                            title: `Join ${group.name}`,
                            text: `Join my group "${group.name}" on SpliBiz!`,
                            url: link,
                          }).catch(() => {});
                        } else {
                          addToast("Sharing not supported on this device", "info");
                        }
                      }}
                      className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                    >
                      <Icons.Share /> Share
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
