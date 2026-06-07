import React from 'react';
import { useHR } from '../context/HRContext';
import { Sparkles, ShieldAlert, Check, Eye } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings } = useHR();

  const handleSliderChange = (key: 'aiMinAtsScore' | 'aiAutoShortlistThreshold', val: number) => {
    updateSettings({ [key]: val });
  };

  const handleToggle = (key: 'enableEyeContactTracking' | 'enableSentimentAlerts') => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleEmailChange = (val: string) => {
    updateSettings({ notificationEmail: val });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* AI Threshold Controls (2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="premium-card p-6 space-y-6">
          <h3 className="font-extrabold text-palette-1 text-base flex items-center gap-2 border-b border-palette-2/15 pb-4">
            <Sparkles className="w-5 h-5 text-palette-5" />
            AI Algorithm Configurations
          </h3>

          <div className="space-y-6">
            {/* ATS Match Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-palette-1">
                <span>Minimum ATS Match Threshold (%)</span>
                <span className="bg-palette-3 text-palette-4 px-2.5 py-0.5 rounded-full font-extrabold">
                  {settings.aiMinAtsScore}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                value={settings.aiMinAtsScore}
                onChange={(e) => handleSliderChange('aiMinAtsScore', parseInt(e.target.value))}
                className="w-full h-2 bg-palette-3 rounded-lg appearance-none cursor-pointer accent-palette-4"
              />
              <p className="text-[10px] text-palette-2 leading-relaxed">
                Candidates with scores below this threshold are flagged as "low alignment" and automatically deprioritized on the leaderboard.
              </p>
            </div>

            {/* Auto Shortlist Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-palette-1">
                <span>Auto-Shortlist Score Threshold (%)</span>
                <span className="bg-palette-3 text-palette-5 px-2.5 py-0.5 rounded-full font-extrabold">
                  {settings.aiAutoShortlistThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={settings.aiAutoShortlistThreshold}
                onChange={(e) => handleSliderChange('aiAutoShortlistThreshold', parseInt(e.target.value))}
                className="w-full h-2 bg-palette-3 rounded-lg appearance-none cursor-pointer accent-palette-4"
              />
              <p className="text-[10px] text-palette-2 leading-relaxed">
                Candidates scoring above this threshold upon resume upload are automatically advanced to the "screening" stage by the AI.
              </p>
            </div>

            {/* AI Video Features */}
            <div className="pt-4 border-t border-palette-2/10 space-y-4">
              <h4 className="font-extrabold text-palette-1 text-sm flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-palette-4" />
                Simulated Telemetry Metrics
              </h4>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-palette-3/30 border border-palette-2/10 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-palette-1">Enable Eye-Contact Gaze Assessment</p>
                    <p className="text-[9.5px] text-palette-2 mt-0.5">Use camera analysis to verify screen focus during video loops.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableEyeContactTracking}
                    onChange={() => handleToggle('enableEyeContactTracking')}
                    className="rounded text-palette-4 focus:ring-palette-4 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-palette-3/30 border border-palette-2/10 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-palette-1">Auto Sentiment Alert Escalations</p>
                    <p className="text-[9.5px] text-palette-2 mt-0.5">Flag negative complaints for immediate HR review inbox alerts.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSentimentAlerts}
                    onChange={() => handleToggle('enableSentimentAlerts')}
                    className="rounded text-palette-4 focus:ring-palette-4 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Notification Contacts (1 col) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="premium-card p-6 space-y-6">
          <h3 className="font-extrabold text-palette-1 text-base flex items-center gap-2 border-b border-palette-2/15 pb-4">
            <ShieldAlert className="w-5 h-5 text-palette-4" />
            Alert Notification Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-2">Recipient Alert Email</label>
              <input
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-palette-4"
                placeholder="hr-alerts@company.com"
              />
              <p className="text-[9.5px] text-palette-2 mt-1.5 leading-normal">
                Receive notifications when high-priority complaints are compiled or when payroll anomalies fail validation audits.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-palette-1/70 uppercase tracking-wider mb-2">Max Applications Per Candidate</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxApplicationsPerCandidate || 1}
                onChange={(e) => updateSettings({ maxApplicationsPerCandidate: parseInt(e.target.value) || 1 })}
                className="w-full border border-palette-2/40 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-palette-4"
              />
              <p className="text-[9.5px] text-palette-2 mt-1.5 leading-normal">
                Control the maximum number of job openings a single candidate is permitted to apply for.
              </p>
            </div>

            {/* Simulated Roles Info */}
            <div className="bg-palette-3/50 p-4 rounded-xl border border-palette-2/20 space-y-2">
              <p className="text-[10px] font-bold text-palette-1/70 uppercase tracking-wider">Access Boundaries</p>
              <div className="space-y-1.5 text-[10px] font-semibold text-palette-1/80 leading-relaxed">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>HR: Unlimited modules access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Admin: Dashboard, Payroll, Analytics, Settings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Team Lead: Dashboard, Employees, Teams, Updates</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Employee: Dashboard, Updates, Leaves, Complaints</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  <span>Candidate: ATS recruitment, Video Interview loops</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
