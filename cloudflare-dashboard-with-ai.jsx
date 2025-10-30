import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, Database, HardDrive, Zap, Cloud, Clock, AlertCircle, CheckCircle, TrendingUp, Users, Globe, Server, Search, Sparkles, Bug, Wrench, Eye, RefreshCw, ThumbsUp, AlertTriangle } from 'lucide-react';

const CloudflareDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState({
    requests: 0,
    dbQueries: 0,
    r2Operations: 0,
    kvReads: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reviewHistory, setReviewHistory] = useState({});

  // Real Cloudflare Workers data - sorted by most recent modification
  const realWorkers = [
    { name: "focms", modified: "2025-10-21", created: "2025-10-16" },
    { name: "weed365", modified: "2025-10-21", created: "2025-10-18" },
    { name: "skill-seekers-api", modified: "2025-10-20", created: "2025-10-20" },
    { name: "autosubstack-analysis-worker", modified: "2025-10-18", created: "2025-10-16" },
    { name: "autosubstack-publisher-worker", modified: "2025-10-18", created: "2025-10-16" },
    { name: "autosubstack-generation-worker", modified: "2025-10-18", created: "2025-10-16" },
    { name: "autosubstack-scheduler-worker", modified: "2025-10-18", created: "2025-10-16" },
    { name: "autosubstack-ingestion-worker", modified: "2025-10-18", created: "2025-10-16" },
    { name: "easy-invoice", modified: "2025-10-17", created: "2025-07-18" },
    { name: "fireguard-production", modified: "2025-10-14", created: "2025-10-13" },
    { name: "medicare-plan-finder", modified: "2025-10-13", created: "2025-10-09" },
    { name: "fireguard-staging", modified: "2025-10-13", created: "2025-10-13" },
    { name: "ai-cofounder-prod", modified: "2025-10-11", created: "2025-10-11" },
    { name: "bbprojects-production", modified: "2025-10-11", created: "2025-09-24" },
    { name: "bbprojects", modified: "2025-10-11", created: "2025-08-13" }
    // ... add more workers
  ];

  // Trigger AI Review
  const handleAIReview = async (workerName) => {
    setIsAnalyzing(true);
    setSelectedWorker(workerName);
    setActiveTab('ai-review');

    try {
      const response = await fetch(`/api/ai-review/${workerName}`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.status === 200) {
        setAiAnalysis(result.data);
        setReviewHistory(prev => ({
          ...prev,
          [workerName]: result.data
        }));
      }
    } catch (error) {
      console.error('AI Review failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply AI Fixes
  const handleApplyFixes = async (workerName, fixes) => {
    try {
      const response = await fetch(`/api/ai-fix/${workerName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixes })
      });
      
      const result = await response.json();
      
      if (result.status === 200) {
        // Show code diff and allow user to review before deploying
        setAiAnalysis(prev => ({
          ...prev,
          fixedCode: result.data.fixedCode,
          originalCode: result.data.originalCode
        }));
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
    }
  };

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        requests: prev.requests + Math.floor(Math.random() * 50),
        dbQueries: prev.dbQueries + Math.floor(Math.random() * 20),
        r2Operations: prev.r2Operations + Math.floor(Math.random() * 10),
        kvReads: prev.kvReads + Math.floor(Math.random() * 30)
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredWorkers = realWorkers.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-8 h-8 text-orange-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-blue-500 bg-clip-text text-transparent">
            Cloudflare Project Dashboard
          </h1>
          <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
        </div>
        <p className="text-slate-400">AI-Powered Project Management • Workers • D1 • R2 • KV</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {['overview', 'workers', 'ai-review', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'ai-review' && <Sparkles className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Workers Tab with AI Review Buttons */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          {/* Header with Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6">
              <div className="text-blue-100 text-sm mb-1">Total Workers</div>
              <div className="text-4xl font-bold text-white">{realWorkers.length}</div>
              <div className="text-blue-100 text-xs mt-2">Across all environments</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6">
              <div className="text-green-100 text-sm mb-1">Active Production</div>
              <div className="text-4xl font-bold text-white">
                {realWorkers.filter(w => w.name.includes('production') || w.name.includes('prod')).length}
              </div>
              <div className="text-green-100 text-xs mt-2">Live deployments</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6">
              <div className="text-purple-100 text-sm mb-1">AI Reviewed</div>
              <div className="text-4xl font-bold text-white">
                {Object.keys(reviewHistory).length}
              </div>
              <div className="text-purple-100 text-xs mt-2">Projects analyzed</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6">
              <div className="text-orange-100 text-sm mb-1">Avg Health Score</div>
              <div className="text-4xl font-bold text-white">
                {Object.keys(reviewHistory).length > 0
                  ? Math.round(
                      Object.values(reviewHistory).reduce((sum, r) => sum + r.healthScore, 0) /
                        Object.keys(reviewHistory).length
                    )
                  : '--'}
              </div>
              <div className="text-orange-100 text-xs mt-2">Across reviewed projects</div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search workers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Workers List with AI Buttons */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Server className="w-5 h-5 text-orange-500" />
                Cloudflare Workers ({filteredWorkers.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {filteredWorkers.map((worker, index) => (
                <WorkerCardWithAI 
                  key={index} 
                  worker={worker} 
                  onAIReview={handleAIReview}
                  reviewHistory={reviewHistory[worker.name]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Review Tab */}
      {activeTab === 'ai-review' && (
        <div className="space-y-6">
          {isAnalyzing ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">AI Analyzing Project...</h3>
                <p className="text-slate-400">Reviewing code, architecture, UI/UX, and security</p>
              </div>
            </div>
          ) : aiAnalysis ? (
            <AIReviewResults 
              analysis={aiAnalysis} 
              onApplyFixes={handleApplyFixes}
            />
          ) : (
            <div className="text-center p-12 bg-slate-800 rounded-lg border border-slate-700">
              <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">AI Project Review</h3>
              <p className="text-slate-400 mb-6">
                Select a worker from the Workers tab and click "AI Review" to get started
              </p>
              <button
                onClick={() => setActiveTab('workers')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Go to Workers
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-700 text-center text-slate-400 text-sm">
        Built with Cloudflare Workers • React • TypeScript • Tailwind CSS • Claude AI
        <div className="mt-2 text-xs">
          Following abandini-dev-patterns • AI-Powered QA • Automated Improvements
        </div>
      </div>
    </div>
  );
};

// Enhanced Worker Card with AI Review Button
const WorkerCardWithAI = ({ worker, onAIReview, reviewHistory }) => {
  const accountId = 'ec81afc4dc58b34ce34e7ad19fd6fbdd';
  
  const getEnvironmentBadge = (name) => {
    if (name.includes('production') || name.includes('prod')) {
      return <Badge text="Production" color="green" />;
    }
    if (name.includes('staging')) {
      return <Badge text="Staging" color="orange" />;
    }
    if (name.includes('debug') || name.includes('dev')) {
      return <Badge text="Development" color="blue" />;
    }
    return null;
  };

  const daysSinceModified = Math.floor(
    (new Date() - new Date(worker.modified)) / (1000 * 60 * 60 * 24)
  );

  const handleView = () => {
    const url = `https://dash.cloudflare.com/${accountId}/workers/services/view/${worker.name}/production`;
    window.open(url, '_blank');
  };

  const handleLogs = () => {
    const url = `https://dash.cloudflare.com/${accountId}/workers/services/view/${worker.name}/production/logs`;
    window.open(url, '_blank');
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-4 hover:bg-slate-700 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-lg text-white">{worker.name}</h4>
            {getEnvironmentBadge(worker.name)}
            {reviewHistory && (
              <div className={`flex items-center gap-1 text-sm ${getHealthColor(reviewHistory.healthScore)}`}>
                <CheckCircle className="w-4 h-4" />
                {reviewHistory.healthScore}%
              </div>
            )}
          </div>
          <div className="flex gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Modified {daysSinceModified === 0 ? 'today' : `${daysSinceModified}d ago`}
            </div>
            {reviewHistory && (
              <div className="flex items-center gap-1 text-purple-400">
                <Sparkles className="w-4 h-4" />
                Last reviewed {new Date(reviewHistory.timestamp).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onAIReview(worker.name)}
            className="text-purple-400 hover:text-purple-300 text-sm px-3 py-1 bg-slate-700 rounded hover:bg-purple-500/20 transition-all flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4" />
            AI Review
          </button>
          <button 
            onClick={handleView}
            className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-all"
          >
            View
          </button>
          <button 
            onClick={handleLogs}
            className="text-slate-400 hover:text-white text-sm px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-all"
          >
            Logs
          </button>
        </div>
      </div>
    </div>
  );
};

// AI Review Results Display
const AIReviewResults = ({ analysis, onApplyFixes }) => {
  const [selectedFixes, setSelectedFixes] = useState([]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'code': return <Bug className="w-4 h-4" />;
      case 'architecture': return <Server className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'ui/ux': return <Eye className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const healthColor = analysis.healthScore >= 80 ? 'green' : analysis.healthScore >= 60 ? 'yellow' : 'red';

  return (
    <div className="space-y-6">
      {/* Health Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-gradient-to-br from-${healthColor}-500 to-${healthColor}-600 rounded-lg p-6 col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white text-sm mb-1">Project Health Score</div>
              <div className="text-5xl font-bold text-white">{analysis.healthScore}%</div>
            </div>
            <div className={`text-${healthColor}-100 text-right`}>
              <CheckCircle className="w-16 h-16 mx-auto mb-2" />
            </div>
          </div>
          <p className="text-white/90 text-sm">{analysis.summary}</p>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h4 className="font-semibold mb-4">Quick Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Critical Issues</span>
              <span className="text-red-400 font-bold">
                {analysis.issues.filter(i => i.severity === 'critical').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">High Priority</span>
              <span className="text-orange-400 font-bold">
                {analysis.issues.filter(i => i.severity === 'high').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quick Wins</span>
              <span className="text-green-400 font-bold">{analysis.quickWins.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Wins */}
      {analysis.quickWins.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-6 border border-green-500/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-400" />
            Quick Wins - Easy Improvements with Big Impact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.quickWins.map((win, index) => (
              <div key={index} className="bg-slate-800/50 rounded p-3 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{win}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Issues Found ({analysis.issues.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-700">
          {analysis.issues.map((issue, index) => (
            <div key={index} className="p-4 hover:bg-slate-700 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded ${getSeverityColor(issue.severity)}`}>
                    {getCategoryIcon(issue.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{issue.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{issue.description}</p>
                    {issue.location && (
                      <p className="text-xs text-slate-500 mb-2">
                        <code className="bg-slate-900 px-2 py-1 rounded">{issue.location}</code>
                      </p>
                    )}
                    <div className="bg-slate-900 rounded p-3 mt-2">
                      <div className="text-xs text-green-400 mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Recommendation
                      </div>
                      <p className="text-sm">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UI/UX Improvements */}
      {analysis.uiuxImprovements && analysis.uiuxImprovements.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-500" />
              UI/UX Improvements
            </h3>
          </div>
          <div className="divide-y divide-slate-700">
            {analysis.uiuxImprovements.map((improvement, index) => (
              <div key={index} className="p-4">
                <h4 className="font-semibold mb-2 text-purple-400">{improvement.area}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded p-3">
                    <div className="text-xs text-red-400 mb-2">Current State</div>
                    <p className="text-sm text-slate-300">{improvement.currentState}</p>
                  </div>
                  <div className="bg-slate-900 rounded p-3">
                    <div className="text-xs text-green-400 mb-2">Suggested Improvement</div>
                    <p className="text-sm text-slate-300">{improvement.suggestedImprovement}</p>
                  </div>
                </div>
                {improvement.modernExample && (
                  <div className="mt-3 bg-slate-900 rounded p-3">
                    <div className="text-xs text-blue-400 mb-2">Modern Example</div>
                    <pre className="text-xs overflow-x-auto">{improvement.modernExample}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Fix Button */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" />
              Ready to Apply Fixes?
            </h3>
            <p className="text-slate-400 text-sm">
              AI can automatically apply the recommended fixes. You'll review the changes before deploying.
            </p>
          </div>
          <button
            onClick={() => onApplyFixes(
              analysis.workerName,
              analysis.recommendations.map(r => r.description)
            )}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Auto-Fix Issues
          </button>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    orange: 'bg-orange-500/20 text-orange-400'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[color]}`}>
      {text}
    </span>
  );
};

export default CloudflareDashboard;