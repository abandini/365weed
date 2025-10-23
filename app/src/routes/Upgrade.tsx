import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://weed365.bill-burkey.workers.dev';

interface Tier {
  code: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    code: 'free',
    name: 'Free',
    price_monthly: 0,
    price_annual: 0,
    features: [
      'Daily cannabis content',
      '30-day journal history',
      'Basic stats',
      'Streak tracking',
      'Achievements'
    ]
  },
  {
    code: 'pro',
    name: 'Pro',
    price_monthly: 199,
    price_annual: 1990,
    popular: true,
    features: [
      'Everything in Free',
      'Ad-free experience',
      '365-day journal history',
      'Advanced analytics',
      'Email reports',
      'Priority support',
      'Personalized recommendations'
    ]
  },
  {
    code: 'premium',
    name: 'Premium',
    price_monthly: 499,
    price_annual: 4990,
    features: [
      'Everything in Pro',
      'AI-powered insights',
      '100 AI queries/month',
      'Strain matching',
      'Partner discounts',
      'Early access to features',
      'Custom data exports'
    ]
  }
];

function Upgrade() {
  const userId = 1; // TODO: Get from auth context
  const [annual, setAnnual] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpgrade = async (tierCode: string) => {
    if (tierCode === 'free') return;

    setProcessing(tierCode);
    try {
      const response = await fetch(`${API_BASE}/api/stripe/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tier: tierCode,
          interval: annual ? 'annual' : 'monthly'
        })
      });

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to start upgrade process');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-teal to-gold bg-clip-text text-transparent mb-4">
          Upgrade Your Experience
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Choose the plan that's right for your cannabis wellness journey
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-800 rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-6 py-2 rounded-full transition-all ${
              !annual ? 'bg-primary text-white' : 'text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-6 py-2 rounded-full transition-all ${
              annual ? 'bg-primary text-white' : 'text-gray-400'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-gold text-gray-900 px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const price = annual ? tier.price_annual : tier.price_monthly;
          const displayPrice = (price / 100).toFixed(2);
          const monthlyEquivalent = annual ? (tier.price_annual / 12 / 100).toFixed(2) : displayPrice;

          return (
            <div
              key={tier.code}
              className={`relative rounded-2xl p-8 transition-all ${
                tier.popular
                  ? 'bg-gradient-to-br from-primary/20 via-teal/10 to-gold/20 border-2 border-primary shadow-xl scale-105'
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-gold text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-5xl font-bold mb-2">
                  ${tier.code === 'free' ? '0' : monthlyEquivalent}
                  <span className="text-lg text-gray-400">/mo</span>
                </div>
                {annual && tier.code !== 'free' && (
                  <p className="text-sm text-gray-400">
                    Billed ${displayPrice} annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.code)}
                disabled={tier.code === 'free' || processing === tier.code}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  tier.code === 'free'
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-gradient-to-r from-primary to-teal hover:from-primary-light hover:to-teal-light text-white shadow-lg hover:shadow-glow'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {tier.code === 'free'
                  ? 'Current Plan'
                  : processing === tier.code
                  ? 'Processing...'
                  : `Upgrade to ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes! You can cancel your subscription at any time from your settings. You\'ll keep access until the end of your billing period.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards and debit cards through Stripe, our secure payment processor.'
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 30-day money-back guarantee for annual plans. Monthly plans are non-refundable.'
            },
            {
              q: 'Can I upgrade or downgrade later?',
              a: 'Yes! You can change your plan at any time. Upgrades take effect immediately, downgrades at the end of your current billing period.'
            }
          ].map((faq) => (
            <details key={faq.q} className="bg-gray-700/30 rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{faq.q}</summary>
              <p className="text-sm text-gray-400 mt-2">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Upgrade;
