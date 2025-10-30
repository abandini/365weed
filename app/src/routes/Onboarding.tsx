import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface OnboardingData {
  is_21: boolean;
  state_code: string;
  goals: string[];
  preferred_methods: string[];
  push_enabled: boolean;
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    is_21: false,
    state_code: '',
    goals: [],
    preferred_methods: [],
    push_enabled: false
  });

  const totalSteps = 6;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData({ ...data, ...updates });
  };

  const completeOnboarding = async () => {
    const userId = 1; // TODO: Get from auth context

    try {
      // Update user preferences
      await fetch(`${API_BASE}/api/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_tags: data.goals.join(','),
          preferred_methods: data.preferred_methods.join(','),
          goals: data.goals.reduce((acc, g) => ({ ...acc, [g]: true }), {})
        })
      });

      // Mark onboarding as complete
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('user_state', data.state_code);

      // Navigate to Today page
      navigate('/');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 mx-1 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-gradient-to-r from-primary to-teal' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🌿</div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-teal to-gold bg-clip-text text-transparent mb-4">
                Welcome to Your New Favorite App 🌿
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                We're here to make your cannabis journey more fun, more informed, and way more chill. Let's get you set up! 😎
              </p>
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-glow transform hover:-translate-y-0.5"
              >
                Hell Yeah, Let's Go 🚀
              </button>
            </div>
          )}

          {/* Step 2: Age Verification */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-4 text-center">Quick Legal Check...</h2>
              <p className="text-gray-300 mb-8 text-center">
                Are you 21+? (We gotta ask! 🙃)
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    updateData({ is_21: true });
                    setStep(3);
                  }}
                  className="px-12 py-4 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-all transform hover:scale-105"
                >
                  Yep, I'm 21+ ✅
                </button>
                <button
                  onClick={() => alert('Sorry friend, come back when you\'re 21! 🎂 (We\'ll still be here)')}
                  className="px-12 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
                >
                  Not Yet
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Where are you located?</h2>
              <p className="text-gray-300 mb-6">
                We'll show you relevant content and dispensaries in your area.
              </p>
              <select
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-6"
                value={data.state_code}
                onChange={(e) => updateData({ state_code: e.target.value })}
              >
                <option value="">Select your state</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="WA">Washington</option>
                <option value="OR">Oregon</option>
                <option value="NV">Nevada</option>
                <option value="MI">Michigan</option>
                <option value="IL">Illinois</option>
                <option value="MA">Massachusetts</option>
                <option value="AZ">Arizona</option>
                <option value="NJ">New Jersey</option>
                <option value="NY">New York</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={() => data.state_code && setStep(4)}
                  disabled={!data.state_code}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Goals */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">What are you trying to achieve with cannabis?</h2>
              <p className="text-gray-300 mb-6">
                Pick your vibe(s). We'll tailor your experience. 🎯
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'sleep', label: 'Better Sleep', icon: '😴' },
                  { id: 'focus', label: 'Focus & Productivity', icon: '🎯' },
                  { id: 'pain', label: 'Pain Management', icon: '💪' },
                  { id: 'anxiety', label: 'Anxiety Relief', icon: '🧘' },
                  { id: 'vibing', label: 'Just Vibing', icon: '🌊' },
                  { id: 'education', label: 'Learning More', icon: '📚' }
                ].map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      const newGoals = data.goals.includes(goal.id)
                        ? data.goals.filter(g => g !== goal.id)
                        : [...data.goals, goal.id];
                      updateData({ goals: newGoals });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      data.goals.includes(goal.id)
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{goal.icon}</div>
                    <div className="font-semibold">{goal.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-light rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Consumption Methods */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Preferred methods?</h2>
              <p className="text-gray-300 mb-6">
                How do you typically consume? (Optional)
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { id: 'vape', label: 'Vaping', icon: '🌫️' },
                  { id: 'edible', label: 'Edibles', icon: '🍪' },
                  { id: 'joint', label: 'Smoking', icon: '🚬' },
                  { id: 'topical', label: 'Topicals', icon: '🧴' },
                  { id: 'tincture', label: 'Tinctures', icon: '💧' },
                  { id: 'dabbing', label: 'Dabbing', icon: '💨' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => {
                      const newMethods = data.preferred_methods.includes(method.id)
                        ? data.preferred_methods.filter(m => m !== method.id)
                        : [...data.preferred_methods, method.id];
                      updateData({ preferred_methods: newMethods });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      data.preferred_methods.includes(method.id)
                        ? 'bg-teal/20 border-teal text-white'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{method.icon}</div>
                    <div className="font-semibold">{method.label}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-light rounded-xl transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Complete */}
          {step === 6 && (
            <div className="text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold mb-4">Hell Yeah, You're In! 🚀</h2>
              <p className="text-lg text-gray-300 mb-8">
                Time to explore some dank content, track your journey, and unlock achievements. Let's do this! 💪
              </p>
              <div className="bg-gradient-to-br from-gray-700/50 to-gray-600/30 rounded-xl p-6 mb-8 border border-gray-600/50">
                <h3 className="text-xl font-bold mb-4 text-primary">Your Vibe Check ✅</h3>
                <div className="text-left space-y-2 text-sm">
                  <p><span className="text-gray-400">📍 Location:</span> <span className="text-white font-medium">{data.state_code}</span></p>
                  <p><span className="text-gray-400">🎯 Goals:</span> <span className="text-white font-medium">{data.goals.join(', ') || 'Just exploring'}</span></p>
                  <p><span className="text-gray-400">💨 Methods:</span> <span className="text-white font-medium">{data.preferred_methods.join(', ') || 'Open to all'}</span></p>
                </div>
              </div>
              <button
                onClick={completeOnboarding}
                className="px-12 py-4 bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-glow transform hover:-translate-y-0.5 hover:scale-105"
              >
                Show Me The Good Stuff! 🌿
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
