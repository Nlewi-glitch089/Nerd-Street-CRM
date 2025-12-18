(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/pages/team.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Team
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function Team() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [tasks, setTasks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [followUps, setFollowUps] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [partners, setPartners] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedPartner, setSelectedPartner] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recentActivity, setRecentActivity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [signOutMessage, setSignOutMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    function formatOwnersForDisplay(p) {
        const owners = p.owners || [];
        if (!owners.length) return '';
        // try to map emails to contact names/titles when possible
        const mapped = owners.map((email)=>{
            const match = (p.contacts || []).find((c)=>c.email === email);
            if (match) return `${match.name}${match.title ? ` — ${match.title}` : ''}`;
            // fallback: show local team hint
            return email.includes('@') ? `${email}` : email;
        });
        return mapped.length === 1 ? `Assigned: ${mapped[0]}` : `Team: ${mapped.join(', ')}`;
    }
    function isDateOverdue(due) {
        if (!due) return false;
        const parsed = new Date(due);
        if (isNaN(parsed)) return false;
        const now = new Date();
        // compare only date (not time)
        return parsed < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    function overdueDays(due) {
        const parsed = new Date(due);
        if (isNaN(parsed)) return 0;
        const now = new Date();
        const diff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - parsed) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Team.useEffect": ()=>{
            let mounted = true;
            ({
                "Team.useEffect": async ()=>{
                    try {
                        const token = ({
                            "Team.useEffect.token": ()=>{
                                try {
                                    return localStorage.getItem('token');
                                } catch (e) {
                                    return null;
                                }
                            }
                        })["Team.useEffect.token"]();
                        if (!token) {
                            if (mounted) setError('Not authenticated');
                            return;
                        }
                        const res = await fetch('/api/protected', {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        if (!res.ok) {
                            if (mounted) setError('Session invalid or expired');
                            try {
                                localStorage.removeItem('token');
                            } catch (e) {}
                            return;
                        }
                        const data = await res.json();
                        if (!data?.user) {
                            if (mounted) setError('Unable to load user');
                            return;
                        }
                        // allow TEAM_MEMBER or ADMIN
                        if (data.user.role !== 'TEAM_MEMBER' && data.user.role !== 'ADMIN') {
                            if (mounted) setError('Unauthorized — team member access required');
                            return;
                        }
                        if (mounted) setUser(data.user);
                        if (mounted) {
                            // try server seed (if available) otherwise use local seed
                            try {
                                const seedRes = await fetch('/api/seed', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`
                                    }
                                });
                                if (seedRes.ok) {
                                    const sd = await seedRes.json();
                                    setTasks(sd.tasks || []);
                                    setFollowUps(sd.followUps || []);
                                    // Normalize partners so UI can rely on `name`, `tag`, and `health`
                                    const normPartners = (sd.partners || []).map({
                                        "Team.useEffect.normPartners": (p)=>({
                                                name: p.name || p.title || '',
                                                tag: p.tag || '',
                                                health: p.health || '',
                                                owners: p.owners || [],
                                                description: p.description || '',
                                                contractValue: p.contractValue || '',
                                                startDate: p.startDate || '',
                                                endDate: p.endDate || '',
                                                lastContact: p.lastContact || '',
                                                contacts: p.contacts || [],
                                                interactions: p.interactions || [],
                                                programs: p.programs || [],
                                                reminders: p.reminders || []
                                            })
                                    }["Team.useEffect.normPartners"]);
                                    // show only partners assigned to this user when possible
                                    const visible = normPartners.filter({
                                        "Team.useEffect.visible": (p)=>p.owners && p.owners.length > 0 ? p.owners.includes(data.user.email) : true
                                    }["Team.useEffect.visible"]);
                                    setPartners(visible.length ? visible : normPartners);
                                    // Normalize recentActivity items so team UI fields exist regardless of source shape
                                    const normRecent = (sd.recentActivity || []).map({
                                        "Team.useEffect.normRecent": (it, i)=>({
                                                id: it.id || `r${i + 1}`,
                                                partner: it.partner || it.title || it.name || '',
                                                text: it.text || it.note || '',
                                                date: it.date || it.at || ''
                                            })
                                    }["Team.useEffect.normRecent"]);
                                    setRecentActivity(normRecent);
                                } else {
                                    localSeed();
                                }
                            } catch (e) {
                                localSeed();
                            }
                        }
                    } catch (err) {
                        if (mounted) setError('Network error');
                    } finally{
                        if (mounted) setLoading(false);
                    }
                }
            })["Team.useEffect"]();
            return ({
                "Team.useEffect": ()=>{
                    mounted = false;
                }
            })["Team.useEffect"];
        }
    }["Team.useEffect"], []);
    function localSeed() {
        // local fallback that mirrors the admin-seed content (non-personal)
        setTasks([
            {
                id: 't1',
                title: 'Follow up with Alienware',
                due: '2025-12-14',
                note: 'Send co-marketing proposal and content calendar'
            },
            {
                id: 't2',
                title: 'Reach out to Red Bull Gaming',
                due: '2025-12-19',
                note: 'Discuss 2025 renewal terms'
            }
        ]);
        setFollowUps([
            {
                id: 'f1',
                name: 'Back-to-School Supply Drive',
                days: 30
            },
            {
                id: 'f2',
                name: 'Summer Youth Programs Fund',
                days: 60
            },
            {
                id: 'f3',
                name: 'Neighborhood Health Initiative',
                days: 90
            }
        ]);
        setPartners([
            {
                name: 'GameStop',
                tag: 'At Risk',
                health: '45%'
            },
            {
                name: 'Discord',
                tag: 'Pending',
                health: '70%'
            },
            {
                name: 'Alienware',
                tag: 'Active',
                health: '85%'
            },
            {
                name: 'Red Bull Gaming',
                tag: 'Active',
                health: '92%'
            }
        ]);
        setRecentActivity([
            {
                id: 'r1',
                partner: 'Alienware',
                text: 'Equipment delivery confirmed for new venue opening.',
                date: 'Dec 7, 2025'
            },
            {
                id: 'r2',
                partner: 'Red Bull Gaming',
                text: 'Discussed Q1 2025 tournament schedule and activation opportunities.',
                date: 'Dec 4, 2025'
            }
        ]);
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            zIndex: 9999
        },
        className: "jsx-bc10eaca985a6337",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center'
                },
                className: "jsx-bc10eaca985a6337",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: 84,
                            height: 84,
                            borderRadius: 999,
                            border: '8px solid rgba(57,255,20,0.06)',
                            borderTopColor: '#39ff14',
                            boxShadow: '0 0 30px rgba(57,255,20,0.08)',
                            margin: '0 auto',
                            animation: 'spin 1s linear infinite'
                        },
                        className: "jsx-bc10eaca985a6337"
                    }, void 0, false, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            color: '#39ff14',
                            marginTop: 14,
                            fontSize: 16
                        },
                        className: "jsx-bc10eaca985a6337",
                        children: "Loading dashboard..."
                    }, void 0, false, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                id: "bc10eaca985a6337",
                children: "@keyframes spin{to{transform:rotate(360deg)}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/team.js",
        lineNumber: 148,
        columnNumber: 5
    }, this);
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            color: 'red'
        },
        children: error
    }, void 0, false, {
        fileName: "[project]/pages/team.js",
        lineNumber: 156,
        columnNumber: 21
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 18
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: 'var(--color-neon)',
                                    fontWeight: 800,
                                    fontSize: 18
                                },
                                children: "MY WORKSPACE"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#bbb'
                                },
                                children: [
                                    "Welcome back",
                                    user?.name ? `, ${user.name}` : '',
                                    user?.role ? ` — ${user.role.replace('_', ' ')}` : ''
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                onClick: ()=>{
                                    try {
                                        router.push('/profile');
                                    } catch (e) {
                                        console.warn('Profile nav failed', e);
                                    }
                                },
                                children: "Profile"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: ()=>{
                                    try {
                                        localStorage.removeItem('token');
                                    } catch (e) {
                                        console.warn('removeItem token failed', e);
                                    }
                                    try {
                                        console.log('Team sign-out: clearing client state');
                                        // clear local state
                                        setUser(null);
                                        setTasks([]);
                                        setFollowUps([]);
                                        setPartners([]);
                                        setRecentActivity([]);
                                    } catch (e) {
                                        console.warn('Error clearing client state', e);
                                    }
                                    setSignOutMessage('Signed out');
                                    setTimeout(()=>{
                                        setSignOutMessage(null);
                                        try {
                                            router.replace('/');
                                        } catch (e) {
                                            console.warn('router.replace failed during sign-out, falling back to location.href', e);
                                            try {
                                                window.location.href = '/';
                                            } catch (err) {
                                                console.warn('Fallback redirect failed', err);
                                            }
                                        }
                                    }, 800);
                                },
                                children: "Logout"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 160,
                columnNumber: 7
            }, this),
            signOutMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'fixed',
                    right: 20,
                    top: 20,
                    background: 'rgba(0,0,0,0.8)',
                    color: 'var(--color-neon)',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid rgba(57,255,20,0.08)'
                },
                children: signOutMessage
            }, void 0, false, {
                fileName: "[project]/pages/team.js",
                lineNumber: 192,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 12,
                    marginBottom: 14
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(47,255,85,0.16)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: 'var(--color-neon)'
                                },
                                children: "My Tasks"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 199,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: tasks.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 200,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Action items due soon"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 198,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(255,193,7,0.12)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: '#ffcc00'
                                },
                                children: "Follow-ups Needed"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 204,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: followUps.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 205,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Partners need contact"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(66,138,255,0.12)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: '#6fb3ff'
                                },
                                children: "My Partners"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: partners.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 210,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Active accounts"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: 12
                },
                children: [
                    selectedPartner && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            gridColumn: '1 / span 2',
                            padding: 18,
                            border: '1px solid rgba(57,255,20,0.12)',
                            borderRadius: 8,
                            marginBottom: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontWeight: 900,
                                                    fontSize: 18
                                                },
                                                children: selectedPartner.name
                                            }, void 0, false, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 220,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontSize: 13,
                                                    color: '#bbb',
                                                    marginTop: 6
                                                },
                                                children: selectedPartner.description
                                            }, void 0, false, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 221,
                                                columnNumber: 17
                                            }, this),
                                            selectedPartner.owners && selectedPartner.owners.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    fontSize: 12,
                                                    color: '#9ea',
                                                    marginTop: 8
                                                },
                                                children: formatOwnersForDisplay(selectedPartner)
                                            }, void 0, false, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 223,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 219,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    textAlign: 'right'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: 12,
                                                            color: '#bbb'
                                                        },
                                                        children: "Partnership Health"
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 228,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            fontSize: 22,
                                                            color: '#39ff14',
                                                            fontWeight: 700
                                                        },
                                                        children: selectedPartner.health || '—'
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 229,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 227,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                className: "btn btn-ghost",
                                                onClick: ()=>setSelectedPartner(null),
                                                style: {
                                                    marginTop: 8
                                                },
                                                children: "Close"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 231,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 226,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 218,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    gap: 20,
                                    marginTop: 12
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        flex: 1
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                gap: 12
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        flex: 1
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Contract Value"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 237,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 6
                                                            },
                                                            children: selectedPartner.contractValue || '—'
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 237,
                                                            columnNumber: 72
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 237,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        flex: 1
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Start Date"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 238,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 6
                                                            },
                                                            children: selectedPartner.startDate || '—'
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 238,
                                                            columnNumber: 68
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 238,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        flex: 1
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "End Date"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 239,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 6
                                                            },
                                                            children: selectedPartner.endDate || '—'
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 239,
                                                            columnNumber: 66
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 239,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        flex: 1
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Last Contact"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 240,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 6
                                                            },
                                                            children: selectedPartner.lastContact || '—'
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 240,
                                                            columnNumber: 70
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 240,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 236,
                                            columnNumber: 17
                                        }, this),
                                        (selectedPartner.interactions || []).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 12
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700,
                                                        color: '#39ff14'
                                                    },
                                                    children: "Recent Interactions"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 244,
                                                    columnNumber: 21
                                                }, this),
                                                (selectedPartner.interactions || []).slice().sort((a, b)=>new Date(b.date) - new Date(a.date)).slice(0, 2).map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            marginTop: 8
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontWeight: 700
                                                                },
                                                                children: [
                                                                    it.type || it.kind || it.title,
                                                                    " ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        style: {
                                                                            fontSize: 12,
                                                                            color: '#bbb',
                                                                            marginLeft: 8
                                                                        },
                                                                        children: it.date
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/team.js",
                                                                        lineNumber: 247,
                                                                        columnNumber: 88
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 247,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    color: '#bbb',
                                                                    marginTop: 4
                                                                },
                                                                children: it.note || it.text
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 248,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, it.id || it.date, true, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 246,
                                                        columnNumber: 23
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 243,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/team.js",
                                    lineNumber: 235,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 234,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 217,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: 'var(--color-neon)',
                                    marginBottom: 8
                                },
                                children: "Priority Actions"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 258,
                                columnNumber: 11
                            }, this),
                            tasks.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#888'
                                },
                                children: "No tasks"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 260,
                                columnNumber: 13
                            }, this) : tasks.map((t)=>{
                                const overdue = isDateOverdue(t.due);
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: 12,
                                        border: overdue ? '1px solid rgba(255,77,79,0.18)' : '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: 6,
                                        marginBottom: 8,
                                        background: overdue ? 'rgba(255,77,79,0.03)' : 'transparent'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700
                                                    },
                                                    children: t.title
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 267,
                                                    columnNumber: 19
                                                }, this),
                                                overdue && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#ff4d4f',
                                                        fontWeight: 700
                                                    },
                                                    children: [
                                                        "Overdue · ",
                                                        overdueDays(t.due),
                                                        "d"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 268,
                                                    columnNumber: 32
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 266,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 13,
                                                color: '#bbb',
                                                marginTop: 6
                                            },
                                            children: t.note
                                        }, void 0, false, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 270,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 12,
                                                color: overdue ? '#ffb3b3' : '#ffd57a',
                                                marginTop: 6
                                            },
                                            children: [
                                                "Due: ",
                                                t.due
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 271,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, t.id, true, {
                                    fileName: "[project]/pages/team.js",
                                    lineNumber: 265,
                                    columnNumber: 15
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 257,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 14,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: 700,
                                            color: 'var(--color-neon)'
                                        },
                                        children: "Recent Activity"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 278,
                                        columnNumber: 13
                                    }, this),
                                    recentActivity.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 10
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700
                                                    },
                                                    children: [
                                                        r.partner,
                                                        " ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: 12,
                                                                color: '#bbb',
                                                                marginLeft: 8
                                                            },
                                                            children: r.date
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 281,
                                                            columnNumber: 59
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 281,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 13,
                                                        color: '#bbb'
                                                    },
                                                    children: r.text
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 282,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, r.id, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 280,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 14,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: 700,
                                            color: 'var(--color-neon)'
                                        },
                                        children: "Partners"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 288,
                                        columnNumber: 13
                                    }, this),
                                    partners.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: '#888',
                                            marginTop: 8
                                        },
                                        children: "No partners assigned"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 290,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'grid',
                                            gridTemplateColumns: '1fr',
                                            gap: 8,
                                            marginTop: 8
                                        },
                                        children: partners.map((p, i)=>{
                                            const slug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: 10,
                                                    border: '1px solid rgba(255,255,255,0.02)',
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        onClick: ()=>setSelectedPartner(p),
                                                        style: {
                                                            cursor: 'pointer'
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontWeight: 700
                                                                },
                                                                children: p.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 298,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: 12,
                                                                    color: '#bbb'
                                                                },
                                                                children: [
                                                                    p.tag,
                                                                    p.health ? ` · ${p.health}` : ''
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 299,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: 11,
                                                                    color: '#9ea',
                                                                    marginTop: 6
                                                                },
                                                                children: formatOwnersForDisplay(p)
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 300,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: 11,
                                                                    color: '#bbb',
                                                                    marginTop: 4
                                                                },
                                                                children: [
                                                                    p.lastContact ? `Last: ${p.lastContact}` : '',
                                                                    " ",
                                                                    p.reminders ? `· Reminders: ${p.reminders.length}` : ''
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 303,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 297,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "btn btn-link",
                                                            onClick: ()=>{
                                                                try {
                                                                    router.push(`/partners/${slug}`);
                                                                } catch (e) {
                                                                    console.warn('nav to partner page failed', e);
                                                                }
                                                            },
                                                            children: "View"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 308,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 307,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, p.name + i, true, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 296,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 292,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 14,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: 700,
                                            color: 'var(--color-neon)'
                                        },
                                        children: "Needs Follow-up"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 317,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 12,
                                            color: '#bbb',
                                            marginTop: 6
                                        },
                                        children: "This section surfaces campaigns and partners that require follow-up. Click any item to inspect details."
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 318,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            marginTop: 8
                                        },
                                        children: [
                                            followUps.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    color: '#888'
                                                },
                                                children: "No follow-ups scheduled"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 320,
                                                columnNumber: 45
                                            }, this),
                                            followUps.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        padding: 10,
                                                        border: '1px solid rgba(57,255,20,0.04)',
                                                        borderRadius: 6,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontWeight: 700
                                                                    },
                                                                    children: f.campaign?.name || f.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 324,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 12,
                                                                        color: '#bbb'
                                                                    },
                                                                    children: f.note || `${f.days}+ days since contact`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 325,
                                                                    columnNumber: 23
                                                                }, this),
                                                                f.assignedRole && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 12,
                                                                        color: '#9ea',
                                                                        marginTop: 6
                                                                    },
                                                                    children: [
                                                                        "Assigned Role: ",
                                                                        f.assignedRole
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 326,
                                                                    columnNumber: 42
                                                                }, this),
                                                                f.support && f.support.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 12,
                                                                        color: '#9ea',
                                                                        marginTop: 4
                                                                    },
                                                                    children: [
                                                                        "Support: ",
                                                                        f.support.map((s)=>s.name + (s.role ? ` — ${s.role}` : '')).join(', ')
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 328,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 323,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'flex-end',
                                                                gap: 6
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: 10,
                                                                        background: f.days && f.days > 60 ? '#ff4d4f' : '#ffcc00'
                                                                    }
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 332,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn btn-link",
                                                                    onClick: ()=>{
                                                                        // try to find a related partner by name
                                                                        const related = partners.find((p)=>(p.name || '').toLowerCase().includes((f.campaign?.name || f.name || '').toLowerCase().split(' ')[0]));
                                                                        if (related) {
                                                                            setSelectedPartner(related);
                                                                        } else {
                                                                            alert('Open campaign details in Admin view to manage this follow-up');
                                                                        }
                                                                    },
                                                                    children: "View"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/team.js",
                                                                    lineNumber: 333,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 331,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, f.id, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 322,
                                                    columnNumber: 19
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 319,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 316,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 215,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/team.js",
        lineNumber: 159,
        columnNumber: 5
    }, this);
}
_s(Team, "4mTgNJfMsEgw9xxhIxMBestWSH8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Team;
var _c;
__turbopack_context__.k.register(_c, "Team");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/team.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/team";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/team.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/team\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/team.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f0f1d38a._.js.map