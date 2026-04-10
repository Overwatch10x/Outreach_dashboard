import { useState, useEffect, useCallback } from 'react';
import { startOfToday, subDays } from 'date-fns';
import { supabase } from '../lib/supabase';

function getRangeStart(timeRange) {
  if (timeRange === 'today') return startOfToday();
  if (timeRange === '7d') return subDays(new Date(), 7);
  if (timeRange === '30d') return subDays(new Date(), 30);
  return new Date(0); // 'all'
}

function countCredits(phases) {
  if (!phases || typeof phases !== 'object') return { enrich: 0, employees: 0, orgs: 0 };
  return {
    enrich: phases.enrichContact ? 1 : 0,
    employees: phases.searchEmployees ? 1 : 0,
    orgs: (phases.orgSearchIndia ? 1 : 0)
        + (phases.orgSearchGlobal ? 1 : 0)
        + (phases.orgSearchParent ? 1 : 0),
  };
}

function deriveData(users, pipelineRuns, contacts, apiKeys) {
  // --- summary ---
  const totalRuns = pipelineRuns.length;
  const successCount = pipelineRuns.filter(r => r.status === 'success').length;
  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 1000) / 10 : 0;
  const totalContacts = contacts.length;
  const oneDayAgo = subDays(new Date(), 1);
  const activeUsers = users.filter(u => u.last_active && new Date(u.last_active) > oneDayAgo).length;

  const summary = { totalRuns, successRate, totalContacts, activeUsers };

  // --- userStats ---
  const apiKeySet = new Map(apiKeys.map(k => [k.api_key, k]));

  const userMap = new Map(users.map(u => [u.id, u]));

  // Collect all user_ids from runs + users table
  const allUserIds = new Set([
    ...users.map(u => u.id),
    ...pipelineRuns.map(r => r.user_id),
  ]);

  const userStats = Array.from(allUserIds).map(userId => {
    const userRow = userMap.get(userId);
    const userRuns = pipelineRuns.filter(r => r.user_id === userId);
    const successes = userRuns.filter(r => r.status === 'success').length;
    const failures = userRuns.filter(r => r.status === 'failed').length;
    const userContacts = contacts.filter(c => c.user_id === userId).length;

    const apolloKey = userRow?.apollo_key ?? null;
    const keyEntry = apolloKey ? apiKeySet.get(apolloKey) : null;

    return {
      userId,
      displayName: userRow?.display_name ?? userId,
      lastActive: userRow?.last_active ?? null,
      totalRuns: userRuns.length,
      successes,
      failures,
      contactsFound: userContacts,
      keySource: userRow?.apollo_key_source ?? null,
      keyApproved: !!keyEntry,
      keyLabel: keyEntry?.label ?? null,
    };
  });

  // --- failures ---
  const failedRuns = pipelineRuns.filter(r => r.status === 'failed');

  const phaseCountMap = new Map();
  failedRuns.forEach(r => {
    const phase = r.failed_phase ?? null;
    phaseCountMap.set(phase, (phaseCountMap.get(phase) ?? 0) + 1);
  });
  const byPhase = Array.from(phaseCountMap.entries()).map(([phase, count]) => ({ phase, count }));

  const errorCountMap = new Map();
  failedRuns.forEach(r => {
    const msg = r.error_message ?? '(unknown)';
    const existing = errorCountMap.get(msg);
    if (!existing) {
      errorCountMap.set(msg, { message: msg, count: 1, lastSeen: r.created_at });
    } else {
      existing.count += 1;
      if (new Date(r.created_at) > new Date(existing.lastSeen)) {
        existing.lastSeen = r.created_at;
      }
    }
  });
  const topErrors = Array.from(errorCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const failures = { byPhase, topErrors };

  // --- keyHealth ---
  const runsByKey = new Map();
  pipelineRuns.forEach(r => {
    const key = r.apollo_key;
    if (!key) return;
    if (!runsByKey.has(key)) runsByKey.set(key, []);
    runsByKey.get(key).push(r);
  });

  // Current key per user (from users table)
  const currentKeyByUser = new Map(users.filter(u => u.apollo_key).map(u => [u.id, u.apollo_key]));

  const registered = apiKeys.map(k => {
    const keyRuns = runsByKey.get(k.api_key) ?? [];
    const keyFailures = keyRuns.filter(r => r.status === 'failed').length;
    const failureRate = keyRuns.length > 0
      ? Math.round((keyFailures / keyRuns.length) * 1000) / 10
      : 0;

    const usersUsing = Array.from(currentKeyByUser.entries())
      .filter(([, key]) => key === k.api_key)
      .map(([uid]) => uid);

    return {
      label: k.label,
      apiKey: k.api_key,
      isActive: k.is_active,
      notes: k.notes,
      totalRuns: keyRuns.length,
      failures: keyFailures,
      failureRate,
      usersUsing,
    };
  });

  const registeredKeySet = new Set(apiKeys.map(k => k.api_key));
  const unregisteredMap = new Map();
  pipelineRuns.forEach(r => {
    if (!r.apollo_key || registeredKeySet.has(r.apollo_key)) return;
    const k = r.apollo_key;
    if (!unregisteredMap.has(k)) {
      unregisteredMap.set(k, { apiKey: k, userId: r.user_id, runCount: 0 });
    }
    unregisteredMap.get(k).runCount += 1;
  });
  const unregistered = Array.from(unregisteredMap.values());

  const keyHealth = { registered, unregistered };

  // --- creditUsage ---
  const creditMap = new Map();
  pipelineRuns.forEach(r => {
    const uid = r.user_id;
    if (!creditMap.has(uid)) {
      creditMap.set(uid, { userId: uid, enrichCalls: 0, employeeSearches: 0, orgSearches: 0 });
    }
    const entry = creditMap.get(uid);
    const c = countCredits(r.phases);
    entry.enrichCalls += c.enrich;
    entry.employeeSearches += c.employees;
    entry.orgSearches += c.orgs;
  });
  const creditUsage = Array.from(creditMap.values()).map(e => ({
    ...e,
    estimatedCredits: e.enrichCalls + e.employeeSearches + e.orgSearches,
  }));

  // --- duplicates ---
  // Group contacts by company_name (case-insensitive) + brand_name
  const dupMap = new Map();
  contacts.forEach(c => {
    const key = `${(c.company_name ?? '').toLowerCase()}|||${(c.brand_name ?? '').toLowerCase()}`;
    if (!dupMap.has(key)) {
      dupMap.set(key, {
        companyName: c.company_name,
        brandName: c.brand_name,
        users: new Set(),
        totalContacts: 0,
        firstContact: c.created_at,
        lastContact: c.created_at,
      });
    }
    const entry = dupMap.get(key);
    entry.users.add(c.user_id);
    entry.totalContacts += 1;
    if (new Date(c.created_at) < new Date(entry.firstContact)) entry.firstContact = c.created_at;
    if (new Date(c.created_at) > new Date(entry.lastContact)) entry.lastContact = c.created_at;
  });

  const duplicates = Array.from(dupMap.values())
    .filter(d => d.users.size > 1)
    .map(d => ({ ...d, users: Array.from(d.users) }));

  return { summary, userStats, failures, keyHealth, creditUsage, duplicates };
}

export function useDashboardData(timeRange = '7d') {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [data, setData] = useState({
    raw: { users: [], pipelineRuns: [], contacts: [], apiKeys: [] },
    summary: { totalRuns: 0, successRate: 0, totalContacts: 0, activeUsers: 0 },
    userStats: [],
    failures: { byPhase: [], topErrors: [] },
    keyHealth: { registered: [], unregistered: [] },
    creditUsage: [],
    duplicates: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rangeStart = getRangeStart(timeRange);

      const [usersRes, runsRes, contactsRes, keysRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('pipeline_runs').select('*')
          .gte('created_at', rangeStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('contacts').select('*')
          .gte('created_at', rangeStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('api_keys').select('*'),
      ]);

      if (usersRes.error) throw new Error(`users: ${usersRes.error.message}`);
      if (runsRes.error) throw new Error(`pipeline_runs: ${runsRes.error.message}`);
      if (contactsRes.error) throw new Error(`contacts: ${contactsRes.error.message}`);
      if (keysRes.error) throw new Error(`api_keys: ${keysRes.error.message}`);

      const users = usersRes.data ?? [];
      const pipelineRuns = runsRes.data ?? [];
      const contacts = contactsRes.data ?? [];
      const apiKeys = keysRes.data ?? [];

      const derived = deriveData(users, pipelineRuns, contacts, apiKeys);

      setData({
        raw: { users, pipelineRuns, contacts, apiKeys },
        ...derived,
      });
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Initial fetch + auto-refresh every 60s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    loading,
    error,
    lastRefreshed,
    refresh: fetchData,
    ...data,
  };
}
