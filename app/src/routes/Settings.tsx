import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface UserPreferences {
  preferred_tags: string;
  preferred_methods: string;
  goals: Record<string, boolean>;
}

interface PushPreferences {
  daily_content: boolean;
  journal_reminder: boolean;
  streak_alert: boolean;
  achievements: boolean;
  campaigns: boolean;
  daily_content_time: string;
  journal_reminder_time: string;
}

function Settings() {
  const userId = 1; // TODO: Get from auth context
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [pushPrefs, setPushPrefs] = useState<PushPreferences>({
    daily_content: true,
    journal_reminder: true,
    streak_alert: true,
    achievements: true,
    campaigns: false,
    daily_content_time: '09:00',
    journal_reminder_time: '20:00'
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load user preferences
      const prefsRes = await fetch(`${API_BASE}/api/preferences/${userId}`);
      if (prefsRes.ok) {
        const prefsData = await prefsRes.json();
        setPreferences(prefsData.preferences);
      }

      // Load push preferences
      const pushRes = await fetch(`${API_BASE}/api/notifications/preferences?user_id=${userId}`);
      if (pushRes.ok) {
        const pushData = await pushRes.json();
        if (pushData.preferences) {
          setPushPrefs(pushData.preferences);
        }
      }

      // Load subscription status
      const subRes = await fetch(`${API_BASE}/api/stripe/subscription?user_id=${userId}`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, ...pushPrefs })
      });

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

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
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-teal to-gold bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-400">Manage your preferences and account settings</p>
      </div>

      {/* Account Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👤</span> Account
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h3 className="font-semibold">Subscription Status</h3>
              <p className="text-sm text-gray-400">
                {subscription?.status === 'active' ? 'Pro Member' : 'Free Plan'}
              </p>
            </div>
            {subscription?.status !== 'active' && (
              <Link
                to="/upgrade"
                className="px-6 py-2 bg-gradient-to-r from-gold to-purple hover:from-gold-light hover:to-purple-light rounded-lg font-semibold transition-all"
              >
                Upgrade to Pro
              </Link>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
            <div>
              <h3 className="font-semibold">Referral Code</h3>
              <p className="text-sm text-gray-400">Share with friends and earn rewards</p>
            </div>
            <Link
              to="/referrals"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
            >
              View Code
            </Link>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🔔</span> Notifications
        </h2>
        <div className="space-y-4">
          {[
            { key: 'daily_content', label: 'Daily Content', desc: 'New cannabis knowledge every day', time: 'daily_content_time' },
            { key: 'journal_reminder', label: 'Journal Reminder', desc: 'Remind me to log my sessions', time: 'journal_reminder_time' },
            { key: 'streak_alert', label: 'Streak Alerts', desc: 'Notify when streak is about to break' },
            { key: 'achievements', label: 'Achievement Unlocks', desc: 'Celebrate when I earn new badges' },
            { key: 'campaigns', label: 'Partner Offers', desc: 'Special deals from dispensaries' }
          ].map(notif => (
            <div key={notif.key} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold">{notif.label}</h3>
                <p className="text-sm text-gray-400">{notif.desc}</p>
                {notif.time && pushPrefs[notif.key as keyof PushPreferences] && (
                  <input
                    type="time"
                    value={pushPrefs[notif.time as keyof PushPreferences] as string}
                    onChange={(e) => setPushPrefs({ ...pushPrefs, [notif.time]: e.target.value })}
                    className="mt-2 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                  />
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={pushPrefs[notif.key as keyof PushPreferences] as boolean}
                  onChange={(e) => setPushPrefs({ ...pushPrefs, [notif.key]: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>⚙️</span> Content Preferences
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Wellness Goals</h3>
            <div className="flex flex-wrap gap-2">
              {['sleep', 'focus', 'pain', 'anxiety', 'recreation', 'education'].map(goal => {
                const isActive = preferences?.goals?.[goal];
                return (
                  <button
                    key={goal}
                    onClick={() => {
                      if (preferences) {
                        setPreferences({
                          ...preferences,
                          goals: { ...preferences.goals, [goal]: !isActive }
                        });
                      }
                    }}
                    className={`px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {goal.charAt(0).toUpperCase() + goal.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preferred Methods</h3>
            <div className="flex flex-wrap gap-2">
              {['vape', 'edible', 'joint', 'topical', 'tincture', 'dabbing'].map(method => {
                const methods = preferences?.preferred_methods?.split(',') || [];
                const isActive = methods.includes(method);
                return (
                  <button
                    key={method}
                    onClick={() => {
                      if (preferences) {
                        const newMethods = isActive
                          ? methods.filter(m => m !== method)
                          : [...methods, method];
                        setPreferences({
                          ...preferences,
                          preferred_methods: newMethods.join(',')
                        });
                      }
                    }}
                    className={`px-4 py-2 rounded-full transition-all ${
                      isActive
                        ? 'bg-teal text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export default Settings;
