import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Zap,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { startAutomation } from '../../services/api';
import { queueDiceApplication } from '../../services/diceApi';
import { extractSkillList } from '../../utils/skills';

export const JobIntelligencePanel = ({
  job,
  profile,
  readiness,
  onAutomationTriggered,
}) => {
  const isDiceJob = Boolean(
    job?.source?.toLowerCase()?.includes('dice') ||
    job?.applyUrl?.toLowerCase()?.includes('dice.com')
  );

  const [selectedEngine, setSelectedEngine] = useState(isDiceJob ? 'dice' : 'jobsapi');
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  if (!job) return null;

  const userSkills = profile?.skills || profile?.professionalInfo?.skills || [];
  const extractedUserSkills = extractSkillList(userSkills);
  const normalizedUserSkills = extractedUserSkills.map((s) => s.toLowerCase());

  const jobSkills = extractSkillList(job.skills);
  const matchingSkills = jobSkills.filter((s) => normalizedUserSkills.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter((s) => !normalizedUserSkills.includes(s.toLowerCase()));

  const totalEvaluated = matchingSkills.length + missingSkills.length;
  const matchPercentage = totalEvaluated > 0 ? Math.round((matchingSkills.length / totalEvaluated) * 100) : 85;

  const isResumeReady = Boolean(profile?.assets?.length > 0 || profile?.documents?.defaultResumePath);
  const profileScore = readiness?.overallScore || readiness?.score || 92;

  const handleTriggerAutoApply = async () => {
    setIsApplying(true);
    setApplyResult(null);
    try {
      if (selectedEngine === 'dice') {
        // Queue via Dice Playwright Engine
        const res = await queueDiceApplication({
          job_id: job._id || job.id,
          mode: 'APPLY'
        });
        setApplyResult({
          success: true,
          engine: 'Dice Automation Engine',
          message: res.message || 'Queued in Dice Automation Queue for automated application.',
          applicationId: res.application_id || res.id,
          link: '/automation'
        });
        if (onAutomationTriggered) onAutomationTriggered(res);
      } else {
        // Queue via JobsAPI ATS BullMQ Engine
        const payload = {
          jobId: job._id || job.id,
          connectorName: job.source ? `${job.source}Connector` : 'greenhouseConnector',
        };
        const res = await startAutomation(payload);
        setApplyResult({
          success: true,
          engine: 'JobsAPI Multi-ATS Engine',
          message: res.message || 'Application session initialized.',
          sessionId: res.sessionId,
          link: `/applications/${res.sessionId}`
        });
        if (onAutomationTriggered) onAutomationTriggered(res);
      }
    } catch (err) {
      setApplyResult({
        success: false,
        engine: selectedEngine === 'dice' ? 'Dice Automation Engine' : 'JobsAPI Multi-ATS Engine',
        message: err.message || 'Unable to queue application at this time.',
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="card-warm p-6 space-y-6 bg-surface border border-slate-200/90 shadow-sm rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-warm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-[0_2px_10px_rgba(16,185,129,0.35)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-charcoal tracking-tight">
              Job Intelligence
            </h3>
            <p className="text-xs text-charcoal-muted">
              AI-driven profile alignment & readiness
            </p>
          </div>
        </div>

        <Badge variant="brand" size="md" className="font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
          {matchPercentage}% Match
        </Badge>
      </div>

      {/* Profile & ATS Readiness Snapshot */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
          Readiness & Assets
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-charcoal-muted flex items-center gap-1.5 font-medium">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                Resume
              </span>
              <span className="font-bold text-charcoal">
                {isResumeReady ? 'Ready' : 'Pending'}
              </span>
            </div>
            <div className="text-[11px] text-charcoal-muted">
              {isResumeReady ? 'Primary PDF attached' : 'Upload in profile'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-soft border border-border-warm/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-charcoal-muted flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                Profile
              </span>
              <span className="font-bold text-brand-primary">
                {profileScore}%
              </span>
            </div>
            <div className="text-[11px] text-charcoal-muted">
              Universal fields filled
            </div>
          </div>
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-muted">
            Skill Alignment ({matchingSkills.length}/{jobSkills.length || totalEvaluated})
          </span>
        </div>

        {matchingSkills.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Matching in your profile
            </div>
            <div className="flex flex-wrap gap-1.5">
              {matchingSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Not listed in your skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-medium font-medium bg-surface-soft text-charcoal-muted border border-border-warm"
                >
                  ○ {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unified Engine Selector & Execution Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-indigo-100 dark:border-indigo-950/40 space-y-3.5">
        <div>
          <div className="text-xs font-bold text-charcoal flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-600 fill-current" />
            <span>Select Automation Engine</span>
          </div>
          <p className="text-[11px] text-charcoal-muted mt-0.5 leading-relaxed">
            Choose whether to run via the Dice Playwright Engine or JobsAPI Multi-ATS Connector.
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedEngine('dice')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              selectedEngine === 'dice'
                ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 text-charcoal-muted hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Bot className={`w-3.5 h-3.5 ${selectedEngine === 'dice' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-charcoal">Dice Engine</span>
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5">
              Direct Dice apply & Playwright
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEngine('jobsapi')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
              selectedEngine === 'jobsapi'
                ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 text-charcoal-muted hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${selectedEngine === 'jobsapi' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-charcoal">ATS Connector</span>
            </div>
            <div className="text-[10px] text-charcoal-muted mt-0.5">
              Greenhouse, Lever, BullMQ
            </div>
          </button>
        </div>

        {applyResult ? (
          <div
            className={`p-3.5 rounded-xl text-xs space-y-2 ${
              applyResult.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              {applyResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              {applyResult.message}
            </div>

            {applyResult.sessionId && (
              <div className="text-[11px] opacity-80">
                Session ID: <span className="font-mono">{applyResult.sessionId}</span>
              </div>
            )}

            {applyResult.link && (
              <a
                href={applyResult.link}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-1"
              >
                Track execution live
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2.5 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            isLoading={isApplying}
            onClick={handleTriggerAutoApply}
            icon={Zap}
          >
            {selectedEngine === 'dice' ? 'Launch Dice Auto Apply' : 'Launch ATS Auto Apply'}
          </Button>
        )}
      </div>
    </div>
  );
};
