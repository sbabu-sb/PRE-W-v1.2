import { Notification, ActiveNotificationTab, NotificationLayout } from '../types';

// --- WBNOA v2.0: Full Orchestration Engine with AI Boost & Layout Manager ---

const WEIGHTS = {
    denial: 0.30,
    expiry: 0.20,
    value: 0.20,
    tier: 0.10,
    step: 0.10,
    recency: 0.05,
    role: 0.05,
};

// --- SCORING FUNCTIONS ---
const f_denialRisk = (score?: number): number => (score || 0) / 100;
const f_expiry = (days?: number): number => {
    if (days === undefined || days === null) return 0.2;
    if (days < 0) return 1.0; if (days <= 1) return 0.9; if (days <= 2) return 0.7; return 0.4;
};
const f_caseValue = (value?: number): number => {
    if (!value) return 0;
    if (value > 10000) return 1.0; if (value > 1000) return 0.7; if (value > 100) return 0.4; return 0.1;
};
const f_tier = (tier?: string): number => {
    if (tier === 'premium') return 1.0; if (tier === 'standard') return 0.7; if (tier === 'budget') return 0.4; return 0.5;
};
const f_workflowStep = (step?: string): number => {
    if (step === 'pre_service') return 1.0; if (step === 'claims') return 0.6; if (step === 'post_service') return 0.3; return 0.5;
};
const f_recency = (timestamp: string): number => {
    const hours = (new Date().getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
    return Math.pow(0.5, hours / 2);
};

// --- ORCHESTRATION PIPELINE ---

function suppressNotifications(notifications: Notification[]): Notification[] {
    const seen = new Map<string, Date>();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return notifications.filter(n => {
        if (n.isDismissed) return false;
        const key = `${n.caseId}|${n.type}`;
        const lastSeen = seen.get(key);
        const now = new Date(n.timestamp);
        if (lastSeen && (now.getTime() - lastSeen.getTime()) < twentyFourHours) return false;
        seen.set(key, now);
        return true;
    });
}

function bundleNotifications(notifications: Notification[]): Notification[] {
    const clusterMap = new Map<string, Notification[]>();
    const sixHours = 6 * 60 * 60 * 1000;
    notifications.forEach(n => {
        const key = n.metadata?.clusterKey;
        if (key) {
            const cluster = clusterMap.get(key) || [];
            cluster.push(n);
            clusterMap.set(key, cluster);
        }
    });
    const bundledNotifications: Notification[] = [];
    const handledIds = new Set<string>();
    clusterMap.forEach((clusterItems, clusterKey) => {
        if (clusterItems.length > 3) {
            const sorted = clusterItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const newestTime = new Date(sorted[0].timestamp).getTime();
            if (newestTime - new Date(sorted[sorted.length - 1].timestamp).getTime() < sixHours) {
                const rep = sorted[0];
                bundledNotifications.push({
                    ...rep, id: `bundle_${clusterKey}_${newestTime}`, type: 'bulk_pattern',
                    title: `${clusterItems.length} similar alerts for ${rep.metadata.payer}`,
                    description: `Multiple items require attention. The latest is: "${rep.title}"`,
                    isBundled: true, count: clusterItems.length, bundledItems: sorted, priority: 'high',
                    actions: [{ label: 'Open in Worklist', type: 'link', primary: true, url: `/worklist?filter=payer:${rep.metadata.payer}` }],
                });
                clusterItems.forEach(item => handledIds.add(item.id));
            }
        }
    });
    const unbundled = notifications.filter(n => !handledIds.has(n.id));
    return [...unbundled, ...bundledNotifications];
}

function rankNotifications(notifications: Notification[], tab: ActiveNotificationTab): Notification[] {
    const tabModifier = (tab: ActiveNotificationTab) => {
        if (tab === 'direct') return 1.15;
        if (tab === 'watching') return 1.0;
        if (tab === 'ai_boost') return 1.3;
        return 1.0;
    };
    const scored = notifications.map(n => {
        // HARDENED GUARD: Check for metadata existence.
        if (!n || !n.metadata) {
            return { ...n, score: 0 };
        }
        const { metadata, timestamp } = n;
        const baseScore =
            WEIGHTS.denial * f_denialRisk(metadata.denialRiskScore) +
            WEIGHTS.expiry * f_expiry(metadata.daysUntilExpiration) +
            WEIGHTS.value * f_caseValue(metadata.caseValue) +
            WEIGHTS.tier * f_tier(metadata.patientInsuranceTier) +
            WEIGHTS.step * f_workflowStep(metadata.workflowStep) +
            WEIGHTS.recency * f_recency(timestamp);
        const finalScore = (baseScore * tabModifier(tab)) * 100;
        return { ...n, score: Math.min(100, Math.max(0, finalScore)) };
    });
    return scored.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * 4. AI BOOST GATE (Phase 3)
 * Curates and enriches the top notifications for the AI Boost tab.
 */
function applyAIBoostGate(notifications: Notification[]): Notification[] {
    const top50 = notifications.slice(0, 50);

    const aiScored = top50.map(n => {
        let aiScore = 0;
        const { metadata } = n;
        if (!metadata) return { ...n, aiScore: 0 };

        if ((metadata.caseValue || 0) > 10000) aiScore += 40;
        if (metadata.denialRiskScore && metadata.denialRiskScore > 80) aiScore += 30;
        const daysToDos = metadata.dos ? (new Date(metadata.dos).getTime() - new Date().getTime()) / (1000 * 3600 * 24) : Infinity;
        if (daysToDos <= 1) aiScore += 10;

        return { ...n, aiScore };
    }).sort((a, b) => b.aiScore - a.aiScore);

    // Filter to max 5 items and generate explanations
    return aiScored.slice(0, 5).map(n => {
        let explanation = 'Shown for its high potential impact.';
        if (!n.metadata) return n;

        if (n.aiScore >= 40 && n.metadata.caseValue) explanation = `This high-value case ($${n.metadata.caseValue.toLocaleString()}) requires immediate attention.`;
        else if (n.aiScore >= 30 && n.metadata.denialRiskScore) explanation = `Our model predicts a ${n.metadata.denialRiskScore}% chance of denial based on the provided DX/CPT combo for this payer.`;
        else if (n.type === 'auth_expired') explanation = `This authorization expired, putting a high-value case at immediate risk of denial.`;
        
        // Add synthetic explanation if needed
        if (n.metadata.synthetic) explanation = `This is a simulated alert for ${n.metadata.payer} based on your work patterns, shown to keep your workflow warm.`;
        
        return {
            ...n,
            ai: {
                ...n.ai,
                explanation,
                suggestedActions: n.type.includes('auth') 
                    ? [{ label: 'Renew Auth', confidence: 0.87 }] 
                    : [{ label: 'Review Case', confidence: 0.92 }],
            },
        };
    });
}

/**
 * 5. ATTENTION-AWARE LAYOUT MANAGER (Phase 3)
 * Assigns a layout type to each notification.
 */
function applyLayoutManager(notifications: Notification[]): Notification[] {
    let topCount = 0;
    const MAX_TOP_ITEMS = 3;

    return notifications.map(n => {
        if (n.isBundled) {
            return { ...n, layout: 'bundle' as NotificationLayout };
        }
        if ((n.score || 0) >= 80 && topCount < MAX_TOP_ITEMS) {
            topCount++;
            return { ...n, layout: 'top' as NotificationLayout };
        }
        return { ...n, layout: 'secondary' as NotificationLayout };
    });
}


/**
 * MAIN ORCHESTRATOR FUNCTION (v2.0)
 */
export function orchestrateNotifications(
    allNotifications: Notification[]
): { direct: Notification[], watching: Notification[], ai_boost: Notification[] } {
    
    // --- PIPELINE EXECUTION ---
    const suppressed = suppressNotifications(allNotifications);
    const bundled = bundleNotifications(suppressed);

    // --- TAB-SPECIFIC FILTERING & RANKING ---
    const directItems = bundled.filter(n => n.priority === 'critical' || n.priority === 'high' || n.isBundled);
    const watchingItems = bundled.filter(n => n.metadata?.watch === true || n.priority === 'medium');
    
    // --- AI BOOST & LAYOUT ---
    const rankedDirect = rankNotifications(directItems, 'direct');
    const rankedWatching = rankNotifications(watchingItems, 'watching');
    
    const aiBoostItems = applyAIBoostGate(rankNotifications(bundled, 'ai_boost'));

    return {
        direct: applyLayoutManager(rankedDirect),
        watching: applyLayoutManager(rankedWatching),
        ai_boost: applyLayoutManager(aiBoostItems), // AI items are all 'top' by default
    };
}