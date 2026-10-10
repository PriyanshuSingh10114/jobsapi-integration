import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Bot,
  Zap,
  HelpCircle,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { fetchProfileHistory } from '../services/api';
import { fetchDiceApplications, retryDiceApplication } from '../services/diceApi';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const ApplicationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // 1. Query JobsAPI Application Sessions
  const {
    data: jobsApiHistory,
    isLoading: isJobsApiLoading,
    refetch: refetchJobsApi
  } = useQuery({
    queryKey: ['applicationHistory'],
    queryFn: fetchProfileHistory,
    staleTime: 30000,
  });

  // 2. Query Dice Automation Applications
  const {
    data: diceApps = [],
    isLoading: isDiceLoading,
    refetch: refetchDice
  } = useQuery({
    queryKey: ['diceApplications'],
    queryFn: () => fetchDiceApplications(),
    staleTime: 15000,
  });

  const isLoading = isJobsApiLoading && isDiceLoading;

  // Unify and normalize items from both engines
  const normalizedJobsApi = (jobsApiHistory?.history || []).map((item, idx) => ({
    id: item._id || item.sessionId || `session-ats-${idx}`,
    sourceEngine: 'JobsAPI ATS Engine',
    source: item.source || 'Greenhouse',
    role: item.role || item.fieldCanonicalId || 'Software Engineer',
    company: item.company || 'Enterprise ATS Partner',
    status: (item.status || 'SUBMITTED').toUpperCase(),
    createdAt: item.createdAt || new Date().toISOString(),
    logs: item.logs || [],
    externalUrl: item.applyUrl,
    isDice: false,
    raw: item,
  }));

  const normalizedDice = (diceApps || []).map((app) => ({
    id: app.id || app._id,
    sourceEngine: 'Dice Automation Engine',
    source: 'Dice',
    role: app.job_title || 'Target Requisition',
    company: app.company || 'Dice Hiring Partner',
    status: (app.status || 'SUBMITTED').toUpperCase(),
    createdAt: app.applied_at || app.created_at || new Date().toISOString(),
    errorMessage: app.error_message,
    answers: app.answers || {},
    mode: app.mode || 'APPLY',
    isDice: true,
    externalUrl: app.job_url,
    raw: app,
  }));

  const allApplications = [...normalizedDice, ...normalizedJobsApi].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Filter based on activeTab and sourceFilter
  const filteredItems = allApplications.filter((item) => {
    if (sourceFilter === 'DICE' && !item.isDice) return false;
    if (sourceFilter === 'ATS' && item.isDice) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'SUBMITTED') return item.status === 'SUBMITTED' || item.status === 'COMPLETED';
    if (activeTab === 'RUNNING') return item.status === 'RUNNING' || item.status === 'PROCESSING';
    if (activeTab === 'QUEUED') return item.status === 'QUEUED';
    if (activeTab === 'FAILED') return item.status === 'FAILED';
    if (activeTab === 'REVIEW') return item.status === 'REVIEW_REQUIRED';
    return item.status === activeTab;
  });

  const getStatusBadge = (status = 'SUBMITTED') => {
    const s = String(status).toUpperCase();
    if (s === 'SUBMITTED' || s === 'COMPLETED') {
      return <Badge variant="success" size="sm" dot>Submitted</Badge>;
    }
    if (s === 'RUNNING' || s === 'PROCESSING') {
      return <Badge variant="brand" size="sm" dot className="animate-pulse">Running</Badge>;
    }
    if (s === 'QUEUED') {
      return <Badge variant="warning" size="sm" dot>Queued</Badge>;
    }
    if (s === 'FAILED') {
      return <Badge variant="danger" size="sm" dot>Failed</Badge>;
    }
    if (s === 'REVIEW_REQUIRED') {
      return <Badge variant="warning" size="sm" dot>Review Required</Badge>;
    }
    if (s === 'EXTERNAL_PORTAL') {
      return <Badge variant="info" size="sm">External Portal</Badge>;
    }
    return <Badge variant="neutral" size="sm">{status}</Badge>;
  };

  const handleRetry = async (appId) => {
    setIsRetrying(true);
    try {
      await retryDiceApplication(appId);
      refetchDice();
      queryClient.invalidateQueries({ queryKey: ['diceQueueStatus'] });
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRefresh = () => {
    refetchJobsApi();
    refetchDice();
  };

  const submittedCount = allApplications.filter((i) => i.status === 'SUBMITTED' || i.status === 'COMPLETED').length;
  const queuedCount = allApplications.filter((i) => i.status === 'QUEUED').length;
  const failedCount = allApplications.filter((i) => i.status === 'FAILED').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-2">
            <Send className="w-3.5 h-3.5" />
            <span>Telemetry & Execution Log</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-charcoal">
            Unified Applications
          </h1>
          <p className="text-sm text-charcoal-muted mt-1">
            Real-time monitoring across Dice Playwright automation and multi-ATS form submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            icon={RotateCcw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-xs"
            onClick={() => navigate('/automation')}
            icon={Sparkles}
          >
            Launch Automation
          </Button>
        </div>
      </div>

      {/* Analytics Summary Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-charcoal-muted">
            Total Ingestion
          </div>
          <div className="text-2xl font-black text-charcoal">
            {allApplications.length}
          </div>
          <div className="text-[11px] text-charcoal-muted">Dice + ATS roles</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-charcoal-muted">
            Delivered
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {submittedCount}
          </div>
          <div className="text-[11px] text-charcoal-muted">Submissions delivered</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-charcoal-muted">
            In Queue
          </div>
          <div className="text-2xl font-black text-amber-600">
            {queuedCount}
          </div>
          <div className="text-[11px] text-charcoal-muted">Pending execution</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-slate-200/90 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-charcoal-muted">
            Attention Needed
          </div>
          <div className="text-2xl font-black text-rose-500">
            {failedCount}
          </div>
          <div className="text-[11px] text-charcoal-muted">Failed or review needed</div>
        </div>
      </div>

      {/* Filter and Engine Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-warm pb-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Submissions' },
            { id: 'SUBMITTED', label: 'Submitted' },
            { id: 'RUNNING', label: 'Running' },
            { id: 'QUEUED', label: 'Queued' },
            { id: 'REVIEW', label: 'Review Needed' },
            { id: 'FAILED', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                  : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-soft'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Engine Selector */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-charcoal-muted font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Source:
          </span>
          {['ALL', 'DICE', 'ATS'].map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                sourceFilter === src
                  ? 'bg-charcoal text-white'
                  : 'bg-surface-soft text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {src === 'ALL' ? 'All Platforms' : src === 'DICE' ? 'Dice Only' : 'ATS Direct'}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Table */}
      <div className="rounded-xl overflow-hidden bg-surface border border-slate-200/90 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <table className="w-full">
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Send}
              title="No applications match this filter"
              description="Applications triggered via the Job Detail page or Automation Center will appear here with complete telemetry."
              actionLabel="Discover Open Roles"
              onAction={() => navigate('/jobs')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-warm bg-surface-soft/60 text-[11px] font-bold uppercase tracking-wider text-charcoal-muted">
                  <th className="py-3 px-4 sm:px-6">Requisition & Company</th>
                  <th className="py-3 px-4">Automation Engine</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-warm text-xs text-charcoal">
                {filteredItems.map((item) => {
                  const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedApp(item)}
                      className="hover:bg-surface-soft/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-charcoal group-hover:text-indigo-600 transition-colors">
                          {item.role}
                        </div>
                        <div className="text-[11px] text-charcoal-muted flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{item.company}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {item.isDice ? (
                            <Bot className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span className="font-bold text-slate-700">
                            {item.source.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[10px] text-charcoal-muted">
                          {item.sourceEngine}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-charcoal-muted">
                        <div className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Slide-over Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-warm-lg border border-border-warm max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-border-warm">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  {selectedApp.sourceEngine}
                </span>
                <h3 className="text-lg font-bold text-charcoal mt-0.5">
                  {selectedApp.role}
                </h3>
                <div className="text-xs text-charcoal-muted flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{selectedApp.company}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal hover:bg-surface-soft"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="p-4 rounded-xl bg-surface-soft border border-border-warm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-charcoal-muted">Execution State</div>
                <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
              </div>

              {selectedApp.status === 'FAILED' && selectedApp.isDice && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isRetrying}
                  onClick={() => handleRetry(selectedApp.id)}
                  icon={RotateCcw}
                >
                  Retry Application
                </Button>
              )}
            </div>

            {/* Error Message if any */}
            {selectedApp.errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Failure Reason:
                </div>
                <p>{selectedApp.errorMessage}</p>
              </div>
            )}

            {/* Questionnaire Answers if available */}
            {selectedApp.answers && Object.keys(selectedApp.answers).length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-charcoal">
                  Completed Screener Questions
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border-warm space-y-2">
                  {Object.entries(selectedApp.answers).map(([q, a]) => (
                    <div key={q} className="text-xs">
                      <div className="font-semibold text-charcoal-muted">{q}</div>
                      <div className="font-bold text-charcoal mt-0.5">{String(a)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border-warm">
              {selectedApp.externalUrl ? (
                <a
                  href={selectedApp.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                >
                  <span>Open Job Posting</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <div />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedApp(null)}
              >
                Close Trace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicationsPage;
