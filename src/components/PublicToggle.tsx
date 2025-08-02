import React, { useState } from "react";

interface PublicToggleProps {
  initialIsPublic: boolean;
  initialPublicUsername?: string | null;
}

const PublicToggle: React.FC<PublicToggleProps> = ({
  initialIsPublic,
  initialPublicUsername = null,
}) => {
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [publicUsername, setPublicUsername] = useState<string | null>(
    initialPublicUsername ?? null
  );
  const [showModal, setShowModal] = useState<boolean>(false);
  const [usernameInput, setUsernameInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const toggleClasses = isPublic ? "bg-accent" : "bg-gray-600";
  const spanClasses = isPublic ? "translate-x-6" : "translate-x-1";

  const handleToggle = async () => {
    if (loading) return;

    if (isPublic) {
      // Disable public profile
      try {
        setLoading(true);
        const response = await fetch("/api/user/public-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: false }),
        });
        const result = await response.json();
        if (!result.success) {
          alert(result.error || "Failed to update public profile setting");
        } else {
          setIsPublic(false);
        }
      } catch (err) {
        console.error(err);
        alert("Error updating public profile setting");
      } finally {
        setLoading(false);
      }
    } else {
      if (!publicUsername) {
        setShowModal(true);
      } else {
        try {
          setLoading(true);
          const response = await fetch("/api/user/public-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic: true }),
          });
          const result = await response.json();
          if (!result.success) {
            alert(result.error || "Failed to update public profile setting");
          } else {
            setIsPublic(true);
          }
        } catch (err) {
          console.error(err);
          alert("Error updating public profile setting");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const confirmUsername = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const response = await fetch("/api/user/public-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublic: true,
          username: usernameInput || null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setPublicUsername(result.data.publicUsername);
        setIsPublic(true);
        setShowModal(false);
        setUsernameInput("");
      } else {
        alert(result.error || "Failed to set username");
      }
    } catch (err) {
      console.error(err);
      alert("Error confirming username");
    } finally {
      setLoading(false);
    }
  };

  const generateUsername = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const response = await fetch("/api/user/generate-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (result.success) {
        setUsernameInput(result.data.username);
      } else {
        alert("Failed to generate username");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <label className="text-muted text-sm">Public Profile</label>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggleClasses}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${spanClasses}`}
          />
        </button>
      </div>

      {isPublic && publicUsername && (
        <a
          href={`/user/${publicUsername}`}
          className="text-accent hover:text-accent/80 text-sm transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Profile
        </a>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-card rounded-xl p-8 max-w-md w-full mx-4 border border-accent/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Choose Your Username</h3>
              <p className="text-muted">This will be your public profile URL</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="username-input" className="block text-white text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter username or leave empty for random"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent focus:outline-none"
                  maxLength={20}
                />
                <p className="text-muted text-xs mt-1">Use only lowercase letters, numbers, and hyphens</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={generateUsername}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  {loading ? "Generating..." : "Generate Random"}
                </button>
                <button
                  type="button"
                  onClick={confirmUsername}
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-black px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  {loading ? "Confirming..." : "Confirm"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full text-muted hover:text-white text-sm transition-colors hover:cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublicToggle; 

