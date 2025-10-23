import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface Referral {
  id: number;
  referral_code: string;
  referred_count: number;
  rewards_earned: number;
}

function Referrals() {
  const userId = 1; // TODO: Get from auth context
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferral();
  }, []);

  const loadReferral = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/referrals/code/${userId}`);
      const data = await response.json();
      setReferral(data);
    } catch (error) {
      console.error('Failed to load referral:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/referrals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      setReferral(data);
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  };

  const copyCode = () => {
    if (referral) {
      navigator.clipboard.writeText(referral.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = referral ? `${window.location.origin}?ref=${referral.referral_code}` : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-teal to-gold bg-clip-text text-transparent mb-2">
          Refer Friends & Earn Rewards
        </h1>
        <p className="text-gray-400">Share your love for cannabis education</p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-primary/20 via-teal/10 to-gold/20 rounded-2xl p-8 border border-primary/30">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your Referral Code</h2>
          {referral ? (
            <>
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 inline-block">
                <p className="text-4xl font-mono font-bold text-primary tracking-wider">
                  {referral.referral_code}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={copyCode}
                  className="px-6 py-3 bg-primary hover:bg-primary-light rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: '365 Days of Weed',
                        text: 'Join me on 365 Days of Weed for daily cannabis education!',
                        url: shareUrl
                      });
                    }
                  }}
                  className="px-6 py-3 bg-teal hover:bg-teal-light rounded-xl font-semibold transition-all flex items-center gap-2"
                >
                  🔗 Share Link
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={generateCode}
              className="px-8 py-4 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light rounded-xl font-bold text-lg transition-all"
            >
              Generate My Code
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {referral && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 text-center">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-primary">{referral.referred_count || 0}</div>
            <div className="text-sm text-gray-400">Friends Referred</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 text-center">
            <div className="text-4xl mb-2">🎁</div>
            <div className="text-3xl font-bold text-gold">{referral.rewards_earned || 0}</div>
            <div className="text-sm text-gray-400">Rewards Earned</div>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 text-center">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold text-purple">{(referral.referred_count || 0) * 500}</div>
            <div className="text-sm text-gray-400">Bonus Points</div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-5xl mb-4">1️⃣</div>
            <h3 className="font-bold mb-2">Share Your Code</h3>
            <p className="text-sm text-gray-400">
              Send your unique code to friends who love cannabis
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">2️⃣</div>
            <h3 className="font-bold mb-2">They Sign Up</h3>
            <p className="text-sm text-gray-400">
              Your friend gets 500 bonus points when they join
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">3️⃣</div>
            <h3 className="font-bold mb-2">You Get Rewarded</h3>
            <p className="text-sm text-gray-400">
              Earn 7 days free Pro after their first signup
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Tiers */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Rewards Tiers</h2>
        <div className="space-y-4">
          {[
            { count: 1, reward: '7 days Pro', icon: '🥉' },
            { count: 5, reward: '1 month Pro', icon: '🥈' },
            { count: 10, reward: '3 months Pro', icon: '🥇' },
            { count: 25, reward: '1 year Pro + Exclusive Badge', icon: '💎' }
          ].map(tier => {
            const achieved = (referral?.referred_count || 0) >= tier.count;
            return (
              <div
                key={tier.count}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  achieved
                    ? 'bg-gradient-to-r from-primary/20 to-gold/20 border-2 border-gold'
                    : 'bg-gray-700/30 border border-gray-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{tier.icon}</div>
                  <div>
                    <div className="font-bold">{tier.count} Referrals</div>
                    <div className="text-sm text-gray-400">{tier.reward}</div>
                  </div>
                </div>
                {achieved && <div className="text-gold font-bold">✓ Unlocked</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Referrals;
