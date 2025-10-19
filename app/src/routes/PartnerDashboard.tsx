import { useEffect, useState } from 'react';

interface Campaign {
  id: number;
  name: string;
  region: string;
  tag: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Partner {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function PartnerDashboard() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('partner_token'));
  const [partner, setPartner] = useState<Partner | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Signup/Login
  const [signupForm, setSignupForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (token) {
      loadPartnerData();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function loadPartnerData() {
    try {
      setLoading(true);

      // Get partner profile
      const profileRes = await fetch('/api/partners/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) throw new Error('Failed to load profile');
      const profileData = await profileRes.json();
      setPartner(profileData.partner);

      // Get campaigns
      const campaignsRes = await fetch('/api/partners/campaigns', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!campaignsRes.ok) throw new Error('Failed to load campaigns');
      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.campaigns);
    } catch (error) {
      console.error('Failed to load partner data:', error);
      // Invalid token, log out
      setToken(null);
      localStorage.removeItem('partner_token');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/partners/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });

      if (!res.ok) throw new Error('Signup failed');

      const data = await res.json();
      setToken(data.token);
      localStorage.setItem('partner_token', data.token);

      // Show HMAC secret to user
      alert(`Your HMAC secret (save this securely): ${data.hmac_secret}`);
    } catch (error) {
      alert('Signup failed. Please try again.');
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const campaign = {
      name: formData.get('name'),
      region: formData.get('region'),
      tag: formData.get('tag') || null,
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
    };

    try {
      const res = await fetch('/api/partners/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campaign),
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      await loadPartnerData();
      setShowNewCampaign(false);
      form.reset();
    } catch (error) {
      alert('Failed to create campaign');
    }
  }

  function handleLogout() {
    setToken(null);
    setPartner(null);
    setCampaigns([]);
    localStorage.removeItem('partner_token');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Not logged in
  if (!token || !partner) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8">Partner Portal</h1>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sign Up / Log In</h2>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={signupForm.name}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, name: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={signupForm.email}
                  onChange={(e) =>
                    setSignupForm({ ...signupForm, email: e.target.value })
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/80 rounded-lg py-2 transition"
              >
                Sign Up
              </button>
            </form>

            <p className="text-sm text-gray-500 mt-4">
              Run location-aware offers to adults 21+ right where they're browsing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Partner Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{partner.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Campaigns</h2>
            <p className="text-gray-400">Manage your advertising campaigns</p>
          </div>
          <button
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg transition"
          >
            {showNewCampaign ? 'Cancel' : '+ New Campaign'}
          </button>
        </div>

        {showNewCampaign && (
          <form
            onSubmit={handleCreateCampaign}
            className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Q4 Sleep Campaign"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Region (State Code)
                </label>
                <input
                  type="text"
                  name="region"
                  required
                  maxLength={2}
                  placeholder="CA"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Tag (Optional)
                </label>
                <select
                  name="tag"
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                >
                  <option value="">No specific tag</option>
                  <option value="sleep">Sleep</option>
                  <option value="focus">Focus</option>
                  <option value="pain">Pain Relief</option>
                  <option value="anxiety">Anxiety</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/80 rounded-lg py-2 transition"
            >
              Create Campaign
            </button>
          </form>
        )}

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{campaign.name}</h3>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    campaign.status === 'active'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Region</div>
                  <div className="font-semibold">{campaign.region}</div>
                </div>
                <div>
                  <div className="text-gray-400">Tag</div>
                  <div className="font-semibold">{campaign.tag || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-400">Start Date</div>
                  <div className="font-semibold">{campaign.start_date}</div>
                </div>
                <div>
                  <div className="text-gray-400">End Date</div>
                  <div className="font-semibold">{campaign.end_date}</div>
                </div>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && !showNewCampaign && (
            <div className="text-center py-12 text-gray-500">
              No campaigns yet. Create your first campaign to get started!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
