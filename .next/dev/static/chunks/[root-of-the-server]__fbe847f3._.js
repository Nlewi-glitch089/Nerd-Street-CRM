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
"[project]/pages/admin.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Admin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function Admin() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // dashboard state
    const [metrics, setMetrics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [partners, setPartners] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [recentActivity, setRecentActivity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [alerts, setAlerts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [donors, setDonors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [campaigns, setCampaigns] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [analytics, setAnalytics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // missing UI state (added to prevent runtime ReferenceErrors)
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('analytics');
    const [usersList, setUsersList] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [userSearch, setUserSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [analyticsData, setAnalyticsData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [signOutMessage, setSignOutMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedDonor, setSelectedDonor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [campaignsList, setCampaignsList] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // clear-confirm modal state
    const [confirmOpen, setConfirmOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [confirmPassword, setConfirmPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [confirmLoading, setConfirmLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [confirmError, setConfirmError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // role-change confirmation modal state (require admin password)
    const [roleChangeModalOpen, setRoleChangeModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [roleChangeTargetUser, setRoleChangeTargetUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [roleChangeTargetRole, setRoleChangeTargetRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [roleChangePassword, setRoleChangePassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [roleChangeLoading, setRoleChangeLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [roleChangeError, setRoleChangeError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // campaign action confirmation modal (require admin password like Clear All Data)
    const [campaignActionModalOpen, setCampaignActionModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [campaignActionCampaign, setCampaignActionCampaign] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [campaignActionType, setCampaignActionType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null) // 'approve' | 'deactivate' | 'deny'
    ;
    const [campaignActionPassword, setCampaignActionPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [campaignActionLoading, setCampaignActionLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [campaignActionError, setCampaignActionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // manual delete modal state
    const [manualDeleteModalOpen, setManualDeleteModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [manualDeleteCampaign, setManualDeleteCampaign] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [manualDeletePassword, setManualDeletePassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [manualDeleteLoading, setManualDeleteLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [manualDeleteError, setManualDeleteError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Admin.useEffect": ()=>{
            let mounted = true;
            ({
                "Admin.useEffect": async ()=>{
                    try {
                        const token = ({
                            "Admin.useEffect.token": ()=>{
                                try {
                                    return localStorage.getItem('token');
                                } catch (e) {
                                    return null;
                                }
                            }
                        })["Admin.useEffect.token"]();
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
                        // require ADMIN role for this page
                        if (data.user.role !== 'ADMIN') {
                            if (mounted) setError('Unauthorized — admin access required');
                            return;
                        }
                        if (mounted) setUser(data.user);
                        // after we set user, load admin datasets
                        if (mounted) {
                            loadUsers(data.user).catch({
                                "Admin.useEffect": ()=>{}
                            }["Admin.useEffect"]);
                            loadCampaigns().catch({
                                "Admin.useEffect": ()=>{}
                            }["Admin.useEffect"]);
                            loadAnalytics().catch({
                                "Admin.useEffect": ()=>{}
                            }["Admin.useEffect"]);
                        }
                    } catch (err) {
                        if (mounted) setError('Network error');
                    } finally{
                        if (mounted) setLoading(false);
                    }
                }
            })["Admin.useEffect"]();
            return ({
                "Admin.useEffect": ()=>{
                    mounted = false;
                }
            })["Admin.useEffect"];
        }
    }["Admin.useEffect"], []);
    // sample seeder
    async function seedSampleData() {
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                }
            });
            if (!res.ok) {
                console.warn('Seed API failed, falling back to local seed');
                const local = localSeed();
                return local;
            }
            const data = await res.json();
            setMetrics(data.metrics || []);
            setPartners(data.partners || []);
            setDonors(data.donors || []);
            setCampaigns(data.campaigns || []);
            setRecentActivity(data.recentActivity || []);
            setAlerts(data.alerts || []);
            setAnalytics(data.analytics || null);
            return data;
        } catch (err) {
            console.warn('Seed failed', err);
            const local = localSeed();
            return local;
        }
    }
    function localSeed() {
        setMetrics([
            {
                title: 'Active Programs',
                value: '1',
                sub: 'Running programs'
            },
            {
                title: 'Total Revenue',
                value: '$500,000',
                sub: 'From all programs'
            },
            {
                title: 'Team Reminders',
                value: '0',
                sub: 'Action items pending'
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
        setDonors([
            {
                name: 'Nate Marshall',
                totalGiving: '$12,500',
                lastGift: 'Mar 3, 2025'
            },
            {
                name: 'Evelyn Hart',
                totalGiving: '$4,200',
                lastGift: 'Jan 12, 2025'
            }
        ]);
        setCampaigns([
            {
                title: 'Spring Fundraiser 2025',
                goal: '$75,000',
                raised: '$12,000'
            },
            {
                title: 'Community Outreach Q2',
                goal: '$20,000',
                raised: '$5,000'
            }
        ]);
        setRecentActivity([
            {
                title: 'Alienware',
                kind: 'Email',
                note: 'Equipment delivery confirmed for new venue opening.',
                date: 'Dec 7, 2025'
            },
            {
                title: 'Red Bull Gaming',
                kind: 'Meeting',
                note: 'Discussed Q1 2025 tournament schedule and activation opportunities.',
                date: 'Dec 4, 2025'
            }
        ]);
        setAlerts([
            {
                title: 'Alienware',
                note: 'Send co-marketing proposal and content calendar — Due: Dec 14, 2025'
            },
            {
                title: 'Red Bull Gaming',
                note: 'Reach out to discuss 2025 renewal terms — Due: Dec 19, 2025'
            }
        ]);
        setAnalytics({
            visitors: 1234,
            conversions: 42,
            revenue: 500000
        });
        return {
            metrics: [
                {
                    title: 'Active Programs',
                    value: '1',
                    sub: 'Running programs'
                },
                {
                    title: 'Total Revenue',
                    value: '$500,000',
                    sub: 'From all programs'
                },
                {
                    title: 'Team Reminders',
                    value: '0',
                    sub: 'Action items pending'
                }
            ],
            partners: [
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
            ],
            donors: [
                {
                    name: 'Nate Marshall',
                    totalGiving: '$12,500',
                    lastGift: 'Mar 3, 2025'
                },
                {
                    name: 'Evelyn Hart',
                    totalGiving: '$4,200',
                    lastGift: 'Jan 12, 2025'
                }
            ],
            campaigns: [
                {
                    title: 'Spring Fundraiser 2025',
                    goal: '$75,000',
                    raised: '$12,000'
                },
                {
                    title: 'Community Outreach Q2',
                    goal: '$20,000',
                    raised: '$5,000'
                }
            ],
            recentActivity: [
                {
                    title: 'Alienware',
                    kind: 'Email',
                    note: 'Equipment delivery confirmed for new venue opening.',
                    date: 'Dec 7, 2025'
                },
                {
                    title: 'Red Bull Gaming',
                    kind: 'Meeting',
                    note: 'Discussed Q1 2025 tournament schedule and activation opportunities.',
                    date: 'Dec 4, 2025'
                }
            ],
            alerts: [
                {
                    title: 'Alienware',
                    note: 'Send co-marketing proposal and content calendar — Due: Dec 14, 2025'
                },
                {
                    title: 'Red Bull Gaming',
                    note: 'Reach out to discuss 2025 renewal terms — Due: Dec 19, 2025'
                }
            ],
            analytics: {
                visitors: 1234,
                conversions: 42,
                revenue: 500000
            }
        };
    }
    // fetch helpers
    async function loadUsers(currentUser) {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            // If analytics data is empty, attempt a seed and prefer seeded analytics
            let finalData = data;
            const hasNoData = !data || (data.totalRevenue === 0 || data.totalRevenue == null) && (data.totalDonors === 0 || data.totalDonors == null) && (!Array.isArray(data.campaignStats) || data.campaignStats.length === 0);
            if (hasNoData) {
                try {
                    const seeded = await seedSampleData();
                    if (seeded) finalData = seeded.analytics || seeded;
                } catch (e) {
                    console.warn('Auto-seed failed', e);
                }
            }
            setAnalyticsData(finalData);
            // populate usersList from the API if provided
            let users = [];
            if (Array.isArray(data)) users = data;
            else if (Array.isArray(data?.users)) users = data.users;
            else if (Array.isArray(finalData?.users)) users = finalData.users;
            // if still empty, include the currently-signed-in admin user so management UI isn't blank
            if (!users || users.length === 0) {
                try {
                    if (currentUser) users = [
                        currentUser
                    ];
                    else if (user) users = [
                        user
                    ];
                } catch (e) {
                    users = [];
                }
            }
            setUsersList(users || []);
        } catch (e) {
            console.warn('loadUsers failed', e);
        }
    }
    async function loadCampaigns() {
        try {
            const res = await fetch('/api/campaigns');
            if (!res.ok) return;
            const data = await res.json();
            // If there are no campaigns returned, attempt to seed sample data
            if (!data || !Array.isArray(data.campaigns) || data.campaigns.length === 0) {
                try {
                    const seeded = await seedSampleData();
                    if (seeded && Array.isArray(seeded.campaigns)) {
                        setCampaigns(seeded.campaigns);
                        setCampaignsList(seeded.campaigns);
                        // seeded also populates donors and analytics via seedSampleData
                        return;
                    }
                } catch (e) {
                    console.warn('Auto-seed for campaigns failed', e);
                }
            }
            setCampaigns(data.campaigns || []);
            setCampaignsList(data.campaigns || []);
        } catch (e) {
            console.warn(e);
        }
    }
    async function loadAnalytics() {
        try {
            const res = await fetch('/api/analytics');
            if (!res.ok) return;
            const data = await res.json();
            // If analytics response is empty or missing expected arrays, try seeding
            const missing = !data || (data.totalRevenue === 0 || data.totalRevenue == null) && (!Array.isArray(data.campaignStats) || data.campaignStats.length === 0);
            if (missing) {
                try {
                    const seeded = await seedSampleData();
                    if (seeded) {
                        setAnalyticsData(seeded.analytics || seeded);
                        return;
                    }
                } catch (e) {
                    console.warn('Auto-seed for analytics failed', e);
                }
            }
            // Try to enrich analytics campaignStats with donation-derived totals from /api/campaigns
            try {
                const campRes = await fetch('/api/campaigns');
                if (campRes.ok) {
                    const campData = await campRes.json();
                    const apiCampaigns = Array.isArray(campData.campaigns) ? campData.campaigns : [];
                    if (Array.isArray(data.campaignStats) && data.campaignStats.length > 0 && apiCampaigns.length > 0) {
                        const mapById = apiCampaigns.reduce((acc, c)=>{
                            if (c.id) acc[c.id] = c;
                            acc[c.name] = acc[c.name] || c;
                            return acc;
                        }, {});
                        const merged = data.campaignStats.map((cs)=>{
                            // prefer analytics values but fill in when missing or zero using API totals
                            const found = cs.id && mapById[cs.id] || mapById[cs.name];
                            if (!found) return cs;
                            const analyticsRaised = Number(cs.raised || 0);
                            const apiRaised = Number(found.raised || found.raisedAmount || 0);
                            const analyticsGifted = Number(cs.gifted || cs.giftedRaised || 0);
                            const apiGifted = Number(found.giftedRaised || found.gifted || 0);
                            // If analytics shows 0 but API shows funds, prefer API totals
                            const finalRaised = analyticsRaised && analyticsRaised > 0 ? analyticsRaised : apiRaised;
                            const finalGifted = analyticsGifted && analyticsGifted > 0 ? analyticsGifted : apiGifted;
                            return {
                                ...cs,
                                raised: finalRaised,
                                gifted: finalGifted
                            };
                        });
                        data.campaignStats = merged;
                    }
                }
            } catch (e) {
                console.warn('Failed to enrich analytics with /api/campaigns data', e);
            }
            setAnalyticsData(data || null);
        } catch (e) {
            console.warn(e);
        }
    }
    // color helpers
    const tagColor = (tag)=>{
        if (!tag) return '#999';
        const t = String(tag).toLowerCase();
        if (t.includes('risk')) return '#ff4d4d';
        if (t.includes('pending')) return '#ffcc00';
        if (t.includes('active')) return 'var(--color-neon, #39ff14)';
        return '#999';
    };
    const healthColor = (percent)=>{
        const p = parseInt(String(percent || '').replace('%', '') || '0', 10);
        if (p >= 85) return 'var(--color-neon, #39ff14)';
        if (p >= 60) return '#ffcc00';
        return '#ff4d4d';
    };
    // sign-out handler: clear client state, show brief toast, then redirect to auth page
    function handleSignOut() {
        try {
            localStorage.removeItem('token');
        } catch (e) {
            console.warn('removeItem token failed', e);
        }
        try {
            // clear client-side state
            setUser(null);
            setAnalyticsData(null);
            setCampaignsList([]);
            setUsersList([]);
            setMetrics([]);
            setPartners([]);
            setRecentActivity([]);
            setAlerts([]);
            setDonors([]);
            setCampaigns([]);
            setSeedResponseData && setSeedResponseData(null);
            setSeedError && setSeedError(null);
            setSeedLoading && setSeedLoading(false);
        } catch (e) {
            console.warn('Error clearing client state', e);
        }
        try {
            console.log('Signing out: clearing client state and redirecting');
            setSignOutMessage('Signed out');
            // short delay so user can see the toast
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
        } catch (e) {
            try {
                window.location.href = '/';
            } catch (err) {
                console.warn('Redirect failed', err);
            }
        }
    }
    // seed persistence state + handler
    const [seedLoading, setSeedLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [seedError, setSeedError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [seedModalOpen, setSeedModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [seedResponseData, setSeedResponseData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // derive dashboard metrics from live analytics/campaigns/alerts; prefer `analyticsData` when available
    const displayMetrics = (()=>{
        // prefer live analytics if present
        if (analyticsData) {
            const campaignSum = Array.isArray(analyticsData.campaignStats) ? analyticsData.campaignStats.reduce((s, c)=>s + (Number(c.raised || 0) || 0), 0) : 0;
            const donorTotal = Array.isArray(analyticsData.donorStats) ? analyticsData.donorStats.reduce((s, d)=>s + (Number(d.totalGiving || 0) || 0), 0) : 0;
            // Total revenue should not double-count: prefer donor total (total inflow) when available,
            // otherwise fallback to campaign sums. Use the larger to be conservative.
            const totalCombined = Math.max(donorTotal || 0, campaignSum || 0);
            return [
                {
                    title: 'Campaign Revenue',
                    value: '$' + (campaignSum.toLocaleString ? campaignSum.toLocaleString() : campaignSum),
                    sub: 'From campaign allocations'
                },
                {
                    title: 'Donor Revenue',
                    value: '$' + (donorTotal.toLocaleString ? donorTotal.toLocaleString() : donorTotal),
                    sub: 'Gifts from donors'
                },
                {
                    title: 'Total Revenue',
                    value: '$' + (totalCombined.toLocaleString ? totalCombined.toLocaleString() : totalCombined),
                    sub: 'Unique total (no double-counting)'
                }
            ];
        }
        // otherwise fall back to any provided metrics array
        if (Array.isArray(metrics) && metrics.length > 0) return metrics;
        return metrics || [];
    })();
    async function persistSeed() {
        try {
            setSeedError(null);
            setSeedLoading(true);
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                }
            });
            const data = await res.json().catch(()=>null);
            if (!res.ok) {
                const msg = data?.error || 'Seed failed';
                const details = data?.details || data?.stack || null;
                setSeedError(msg + (details ? ` — ${details}` : ''));
                console.error('Seed API failed response:', data);
                alert(`Seed failed: ${msg}${details ? '\n\nDetails:\n' + details : ''}`);
                return;
            }
            // refresh admin datasets using the current signed-in user
            try {
                await Promise.all([
                    loadUsers(user).catch(()=>{}),
                    loadCampaigns().catch(()=>{}),
                    loadAnalytics().catch(()=>{})
                ]);
            } catch (e) {
                console.warn('Reload after seed failed', e);
            }
            alert('Seed persisted to database.');
        } catch (err) {
            setSeedError(String(err));
            console.warn('persistSeed error', err);
            alert('Seed error: ' + String(err));
        } finally{
            setSeedLoading(false);
        }
    }
    // persistSeedShow: runs the seeder and stores the full server response in state for inspection
    async function persistSeedShow() {
        setSeedError(null);
        setSeedLoading(true);
        setSeedResponseData(null);
        setSeedModalOpen(true);
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                }
            });
            const data = await res.json().catch(()=>null);
            setSeedResponseData({
                status: res.status,
                ok: res.ok,
                body: data
            });
            if (!res.ok) {
                const msg = data?.error || 'Seed failed';
                const details = data?.details || data?.stack || null;
                setSeedError(msg + (details ? ` — ${details}` : ''));
                console.error('Seed API failed response:', data);
                return;
            }
            // refresh admin datasets using the current signed-in user
            try {
                await Promise.all([
                    loadUsers(user).catch(()=>{}),
                    loadCampaigns().catch(()=>{}),
                    loadAnalytics().catch(()=>{})
                ]);
            } catch (e) {
                console.warn('Reload after seed failed', e);
            }
        } catch (err) {
            setSeedError(String(err));
            console.warn('persistSeedShow error', err);
            setSeedResponseData({
                status: 'error',
                ok: false,
                body: String(err)
            });
        } finally{
            setSeedLoading(false);
        }
    }
    if (loading) {
        return null // already handled above
        ;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid rgba(57,255,20,0.06)',
                    paddingBottom: 12
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: 'var(--color-neon, #39ff14)',
                                    fontWeight: 700
                                },
                                children: "ADMIN DASHBOARD"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 446,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 13,
                                    color: '#ccc'
                                },
                                children: [
                                    "Organization Overview - ",
                                    user && (user.name || user.email) || '...'
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 447,
                                columnNumber: 19
                            }, this),
                            (()=>{
                                try {
                                    console.debug('analyticsData (admin):', analyticsData);
                                } catch (e) {}
                                const isLive = !!(analyticsData && (analyticsData.totalRevenue != null && analyticsData.totalRevenue !== 0 || Array.isArray(analyticsData.campaignStats) && analyticsData.campaignStats.length > 0 || analyticsData.revenue != null && analyticsData.revenue !== 0));
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 6,
                                        fontSize: 12
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: '#bbb',
                                                marginRight: 8
                                            },
                                            children: "Data source:"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 454,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                padding: '2px 8px',
                                                borderRadius: 6,
                                                background: isLive ? 'rgba(57,255,20,0.12)' : 'rgba(255,77,77,0.06)',
                                                color: isLive ? 'var(--color-neon)' : '#ff9a9a',
                                                fontWeight: 700
                                            },
                                            children: isLive ? 'Live' : 'Seeded / Local'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 455,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 453,
                                    columnNumber: 23
                                }, this);
                            })()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/admin.js",
                        lineNumber: 445,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 12
                        },
                        children: [
                            typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"] !== 'undefined' && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].env && ("TURBOPACK compile-time value", "development") !== 'production' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                onClick: persistSeedShow,
                                disabled: seedLoading,
                                style: {
                                    background: '#ffb347',
                                    color: '#000'
                                },
                                children: seedLoading ? 'Seeding...' : 'Persist Seed (dev)'
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 462,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: handleSignOut,
                                children: "Logout"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 464,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/admin.js",
                        lineNumber: 460,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 444,
                columnNumber: 15
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
                fileName: "[project]/pages/admin.js",
                lineNumber: 469,
                columnNumber: 17
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `btn ${tab === 'users' ? 'btn-primary' : ''}`,
                                onClick: ()=>setTab('users'),
                                children: "User Management"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 479,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `btn ${tab === 'approvals' ? 'btn-primary' : ''}`,
                                onClick: ()=>setTab('approvals'),
                                children: "Campaign Approvals"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 480,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: `btn ${tab === 'analytics' ? 'btn-primary' : ''}`,
                                onClick: ()=>setTab('analytics'),
                                children: "Full Analytics"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 481,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginLeft: 'auto',
                                    display: 'flex',
                                    gap: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn",
                                        onClick: ()=>{
                                            window.location.href = '/admin/donors';
                                        },
                                        children: "View Donors"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 483,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn",
                                        onClick: ()=>{
                                            window.location.href = '/admin/campaigns';
                                        },
                                        children: "View Campaigns"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 484,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn btn-danger",
                                        onClick: ()=>{
                                            setConfirmOpen(true);
                                        },
                                        style: {
                                            background: '#ff4d4d',
                                            color: '#fff',
                                            border: '1px solid rgba(255,77,77,0.9)'
                                        },
                                        children: "Clear All Data"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 485,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 482,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/admin.js",
                        lineNumber: 478,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 12
                        },
                        children: [
                            tab === 'users' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    border: '1px solid rgba(57,255,20,0.08)',
                                    padding: 16,
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: 'var(--color-neon)',
                                            fontWeight: 700
                                        },
                                        children: "User Management"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 492,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            color: '#bbb',
                                            marginBottom: 8
                                        },
                                        children: "Manage user roles and permissions"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 493,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "input",
                                        placeholder: "Search users...",
                                        value: userSearch,
                                        onChange: (e)=>setUserSearch(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 494,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 12,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10
                                        },
                                        children: usersList.filter((u)=>(u.name || u.email || '').toLowerCase().includes(userSearch.toLowerCase())).map((u)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: 12,
                                                    border: '1px solid rgba(255,255,255,0.03)',
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
                                                                children: [
                                                                    u.name,
                                                                    " ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        style: {
                                                                            background: u.role === 'ADMIN' ? 'var(--color-neon)' : '#444',
                                                                            color: '#000',
                                                                            padding: '2px 6px',
                                                                            borderRadius: 6,
                                                                            fontSize: 12,
                                                                            marginLeft: 8
                                                                        },
                                                                        children: u.role.toLowerCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 499,
                                                                        columnNumber: 70
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 499,
                                                                columnNumber: 31
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: 12,
                                                                    color: '#bbb'
                                                                },
                                                                children: u.email
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 500,
                                                                columnNumber: 31
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 498,
                                                        columnNumber: 29
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: u.role !== 'ADMIN' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "btn",
                                                            onClick: ()=>{
                                                                setRoleChangeTargetUser(u);
                                                                setRoleChangeTargetRole('ADMIN');
                                                                setRoleChangePassword('');
                                                                setRoleChangeError(null);
                                                                setRoleChangeModalOpen(true);
                                                            },
                                                            children: "Promote to Admin"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 504,
                                                            columnNumber: 33
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "btn btn-ghost",
                                                            onClick: ()=>{
                                                                setRoleChangeTargetUser(u);
                                                                setRoleChangeTargetRole('TEAM_MEMBER');
                                                                setRoleChangePassword('');
                                                                setRoleChangeError(null);
                                                                setRoleChangeModalOpen(true);
                                                            },
                                                            children: "Set as Team Member"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 506,
                                                            columnNumber: 33
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 502,
                                                        columnNumber: 29
                                                    }, this)
                                                ]
                                            }, u.id, true, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 497,
                                                columnNumber: 27
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 495,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 491,
                                columnNumber: 21
                            }, this),
                            tab === 'approvals' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    border: '1px solid rgba(57,255,20,0.08)',
                                    padding: 16,
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: 'var(--color-neon)',
                                            fontWeight: 700
                                        },
                                        children: "Campaign Approvals"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 517,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            color: '#bbb',
                                            marginBottom: 8
                                        },
                                        children: "Review and approve events/campaigns"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 518,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 12,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12
                                        },
                                        children: !campaignsList || campaignsList.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                color: '#888'
                                            },
                                            children: "No campaigns yet."
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 521,
                                            columnNumber: 27
                                        }, this) : // dedupe by name so duplicate seed entries don't show repeatedly
                                        (()=>{
                                            const deduped = Object.values((campaignsList || []).reduce((acc, c)=>{
                                                if (!acc[c.name]) acc[c.name] = c;
                                                return acc;
                                            }, {}));
                                            // Only show campaigns that are approved (or have funds which implies approved)
                                            const approvedOnly = deduped.filter((c)=>{
                                                const raised = Number(c.raised || 0);
                                                return !!(c.approved || raised > 0);
                                            });
                                            if (approvedOnly.length === 0) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    color: '#888'
                                                },
                                                children: "No approved campaigns."
                                            }, void 0, false, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 531,
                                                columnNumber: 67
                                            }, this);
                                            return approvedOnly.map((c)=>{
                                                const raised = Number(c.raised || 0);
                                                const isApproved = !!(c.approved || raised > 0);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        padding: 12,
                                                        border: '1px solid rgba(255,255,255,0.03)',
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
                                                                    children: [
                                                                        c.name,
                                                                        " ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                background: isApproved ? 'rgba(47,255,85,0.06)' : 'rgba(255,193,7,0.06)',
                                                                                color: isApproved ? 'var(--color-neon)' : '#ffd57a',
                                                                                padding: '2px 6px',
                                                                                borderRadius: 6,
                                                                                fontSize: 12,
                                                                                marginLeft: 8
                                                                            },
                                                                            children: isApproved ? 'Approved' : raised > 0 ? 'Pending (has funds)' : 'Pending'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 538,
                                                                            columnNumber: 76
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 538,
                                                                    columnNumber: 37
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 12,
                                                                        color: '#bbb'
                                                                    },
                                                                    children: [
                                                                        "Raised: $",
                                                                        raised.toLocaleString ? raised.toLocaleString() : raised
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 539,
                                                                    columnNumber: 37
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 537,
                                                            columnNumber: 35
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                minWidth: 220,
                                                                textAlign: 'right',
                                                                color: '#bbb',
                                                                display: 'flex',
                                                                gap: 8,
                                                                justifyContent: 'flex-end'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn",
                                                                    onClick: ()=>{
                                                                        setCampaignActionCampaign(c);
                                                                        setCampaignActionType('approve');
                                                                        setCampaignActionPassword('');
                                                                        setCampaignActionError(null);
                                                                        setCampaignActionModalOpen(true);
                                                                    },
                                                                    disabled: isApproved,
                                                                    children: "Approve"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 542,
                                                                    columnNumber: 37
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn btn-ghost",
                                                                    onClick: ()=>{
                                                                        setCampaignActionCampaign(c);
                                                                        setCampaignActionType('deactivate');
                                                                        setCampaignActionPassword('');
                                                                        setCampaignActionError(null);
                                                                        setCampaignActionModalOpen(true);
                                                                    },
                                                                    disabled: !isApproved,
                                                                    children: "Deactivate"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 543,
                                                                    columnNumber: 37
                                                                }, this),
                                                                !isApproved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn btn-danger",
                                                                    onClick: ()=>{
                                                                        if (!confirm('Deny this campaign? This will mark it as not approved.')) return;
                                                                        setCampaignActionCampaign(c);
                                                                        setCampaignActionType('deny');
                                                                        setCampaignActionPassword('');
                                                                        setCampaignActionError(null);
                                                                        setCampaignActionModalOpen(true);
                                                                    },
                                                                    children: "Deny"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 546,
                                                                    columnNumber: 39
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    className: "btn btn-outline-danger",
                                                                    onClick: ()=>{
                                                                        if (!confirm('Delete this campaign? This will remove the campaign and its donations.')) return;
                                                                        setManualDeleteCampaign(c);
                                                                        setManualDeletePassword('');
                                                                        setManualDeleteError(null);
                                                                        setManualDeleteModalOpen(true);
                                                                    },
                                                                    style: {
                                                                        marginLeft: 8
                                                                    },
                                                                    children: "Delete"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 550,
                                                                    columnNumber: 37
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 541,
                                                            columnNumber: 35
                                                        }, this)
                                                    ]
                                                }, c.id || c.name, true, {
                                                    fileName: "[project]/pages/admin.js",
                                                    lineNumber: 536,
                                                    columnNumber: 33
                                                }, this);
                                            });
                                        })()
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 519,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 516,
                                columnNumber: 21
                            }, this),
                            tab !== 'approvals' && tab !== 'users' && analyticsData && Array.isArray(analyticsData.campaignStats) && analyticsData.campaignStats.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 18
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: 'var(--color-neon)',
                                            fontWeight: 700,
                                            marginBottom: 8
                                        },
                                        children: "Campaigns Quick"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 564,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(2,1fr)',
                                            gap: 12
                                        },
                                        children: analyticsData.campaignStats.map((c)=>{
                                            const raisedAll = Number(c.raised || 0);
                                            const gifted = Number(c.gifted || 0);
                                            const donationsOnly = Math.max(0, raisedAll - gifted);
                                            const goal = Number(c.goal || 0) || 0;
                                            const progress = goal ? Math.min(100, Math.round(raisedAll / goal * 100)) : 0;
                                            const isApproved = !!(c.approved || raisedAll > 0);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: 12,
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                    borderRadius: 8,
                                                    background: '#070707'
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
                                                                            fontWeight: 700
                                                                        },
                                                                        children: c.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 577,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 12,
                                                                            color: '#bbb'
                                                                        },
                                                                        children: [
                                                                            "Goal: $",
                                                                            goal.toLocaleString ? goal.toLocaleString() : goal
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 578,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 576,
                                                                columnNumber: 33
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    textAlign: 'right'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontWeight: 700
                                                                        },
                                                                        children: [
                                                                            "$",
                                                                            raisedAll.toLocaleString ? raisedAll.toLocaleString() : raisedAll
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 581,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 12,
                                                                            color: '#bbb'
                                                                        },
                                                                        children: [
                                                                            progress,
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 582,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 580,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 575,
                                                        columnNumber: 31
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: 'flex',
                                                            gap: 8,
                                                            marginTop: 8
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    flex: 1,
                                                                    fontSize: 13
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb'
                                                                        },
                                                                        children: [
                                                                            "Donations: ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                style: {
                                                                                    color: 'var(--color-neon)'
                                                                                },
                                                                                children: [
                                                                                    "$",
                                                                                    donationsOnly.toLocaleString ? donationsOnly.toLocaleString() : donationsOnly
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 587,
                                                                                columnNumber: 74
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 587,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb'
                                                                        },
                                                                        children: [
                                                                            "In-Kind Gifts: ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                style: {
                                                                                    color: '#9be'
                                                                                },
                                                                                children: [
                                                                                    "$",
                                                                                    gifted.toLocaleString ? gifted.toLocaleString() : gifted
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 588,
                                                                                columnNumber: 78
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 588,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 586,
                                                                columnNumber: 33
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 6,
                                                                    minWidth: 180,
                                                                    alignItems: 'flex-end'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            display: 'flex',
                                                                            gap: 8
                                                                        },
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "btn",
                                                                                onClick: ()=>{
                                                                                    setCampaignActionCampaign(c);
                                                                                    setCampaignActionType('approve');
                                                                                    setCampaignActionPassword('');
                                                                                    setCampaignActionError(null);
                                                                                    setCampaignActionModalOpen(true);
                                                                                },
                                                                                disabled: isApproved,
                                                                                children: "Approve"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 592,
                                                                                columnNumber: 37
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "btn btn-ghost",
                                                                                onClick: ()=>{
                                                                                    setCampaignActionCampaign(c);
                                                                                    setCampaignActionType('deactivate');
                                                                                    setCampaignActionPassword('');
                                                                                    setCampaignActionError(null);
                                                                                    setCampaignActionModalOpen(true);
                                                                                },
                                                                                disabled: !isApproved,
                                                                                children: "Deactivate"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 593,
                                                                                columnNumber: 37
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "btn btn-outline-danger",
                                                                                onClick: ()=>{
                                                                                    if (!confirm('Delete this campaign? This will remove the campaign and its donations.')) return;
                                                                                    setManualDeleteCampaign(c);
                                                                                    setManualDeletePassword('');
                                                                                    setManualDeleteError(null);
                                                                                    setManualDeleteModalOpen(true);
                                                                                },
                                                                                style: {
                                                                                    marginLeft: 6
                                                                                },
                                                                                children: "Delete"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 594,
                                                                                columnNumber: 37
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 591,
                                                                        columnNumber: 35
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 12,
                                                                            color: isApproved ? 'var(--color-neon)' : '#ffd57a'
                                                                        },
                                                                        children: isApproved ? 'Approved' : 'Pending'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 596,
                                                                        columnNumber: 35
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 590,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 585,
                                                        columnNumber: 31
                                                    }, this)
                                                ]
                                            }, c.id, true, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 574,
                                                columnNumber: 29
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 565,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 563,
                                columnNumber: 21
                            }, this),
                            tab === 'analytics' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    border: '1px solid rgba(57,255,20,0.08)',
                                    padding: 16,
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: 'var(--color-neon)',
                                            fontWeight: 700
                                        },
                                        children: "Full Analytics"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 608,
                                        columnNumber: 23
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            color: '#bbb',
                                            marginBottom: 8
                                        },
                                        children: "Complete financial overview across all partners"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 609,
                                        columnNumber: 23
                                    }, this),
                                    !analyticsData ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: '#888'
                                        },
                                        children: "No analytics available. Seed data and try again."
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 611,
                                        columnNumber: 25
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    display: 'flex',
                                                    gap: 12
                                                },
                                                children: (()=>{
                                                    const MIN_DONOR_TOTAL = 100000;
                                                    const campaignSum = Array.isArray(analyticsData?.campaignStats) ? analyticsData.campaignStats.reduce((s, c)=>s + (Number(c.raised || 0) || 0), 0) : 0;
                                                    const donorRaw = Array.isArray(analyticsData?.donorStats) ? analyticsData.donorStats.reduce((s, d)=>s + (Number(d.totalGiving || 0) || 0), 0) : 0;
                                                    const donorTotal = Math.max(donorRaw || 0, MIN_DONOR_TOTAL);
                                                    // avoid double-counting: donorTotal represents total inflow and typically includes campaign-assigned gifts
                                                    const totalCombined = Math.max(donorTotal || 0, campaignSum || 0);
                                                    const donorsCount = analyticsData?.totalDonors ?? analyticsData?.donorCount ?? 0;
                                                    const activePrograms = Array.isArray(analyticsData?.campaignStats) ? analyticsData.campaignStats.length : Array.isArray(campaignsList) ? campaignsList.length : 0;
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    flex: 1,
                                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                                    padding: 12,
                                                                    borderRadius: 6
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: 'var(--color-neon)',
                                                                            fontWeight: 700
                                                                        },
                                                                        children: "Active Programs"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 627,
                                                                        columnNumber: 37
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 24,
                                                                            marginTop: 8
                                                                        },
                                                                        children: String(activePrograms)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 628,
                                                                        columnNumber: 37
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 626,
                                                                columnNumber: 35
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    flex: 1,
                                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                                    padding: 12,
                                                                    borderRadius: 6
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: 'var(--color-neon)',
                                                                            fontWeight: 700
                                                                        },
                                                                        children: "Campaign Revenue"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 631,
                                                                        columnNumber: 37
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 24,
                                                                            marginTop: 8
                                                                        },
                                                                        children: [
                                                                            "$",
                                                                            campaignSum.toLocaleString ? campaignSum.toLocaleString() : campaignSum
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 632,
                                                                        columnNumber: 37
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 630,
                                                                columnNumber: 35
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    flex: 1,
                                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                                    padding: 12,
                                                                    borderRadius: 6
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: 'var(--color-neon)',
                                                                            fontWeight: 700
                                                                        },
                                                                        children: "Donor Revenue"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 635,
                                                                        columnNumber: 37
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 24,
                                                                            marginTop: 8
                                                                        },
                                                                        children: [
                                                                            "$",
                                                                            donorTotal.toLocaleString ? donorTotal.toLocaleString() : donorTotal
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 636,
                                                                        columnNumber: 37
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 634,
                                                                columnNumber: 35
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    flex: 1,
                                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                                    padding: 12,
                                                                    borderRadius: 6
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: 'var(--color-neon)',
                                                                            fontWeight: 700
                                                                        },
                                                                        children: "Total Revenue"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 639,
                                                                        columnNumber: 37
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: 24,
                                                                            marginTop: 8
                                                                        },
                                                                        children: [
                                                                            "$",
                                                                            totalCombined.toLocaleString ? totalCombined.toLocaleString() : totalCombined
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 640,
                                                                        columnNumber: 37
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 638,
                                                                columnNumber: 35
                                                            }, this)
                                                        ]
                                                    }, void 0, true);
                                                })()
                                            }, void 0, false, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 614,
                                                columnNumber: 27
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    marginTop: 20
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            color: 'var(--color-neon)',
                                                            fontWeight: 700,
                                                            marginBottom: 8
                                                        },
                                                        children: "All Campaigns"
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 648,
                                                        columnNumber: 29
                                                    }, this),
                                                    (analyticsData.campaignStats || []).map((c)=>{
                                                        const raisedAll = Number(c.raised || 0);
                                                        const raisedGifted = c.gifted || c.giftedRaised != null ? Number(c.gifted || c.giftedRaised) : null;
                                                        const usedRaised = raisedGifted != null ? raisedGifted : raisedAll;
                                                        const goal = Number(c.goal || 0) || null;
                                                        const percent = goal ? Math.min(100, Math.round(usedRaised / goal * 100)) : null;
                                                        const isApproved = usedRaised > 0;
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                padding: 8,
                                                                border: '1px solid rgba(255,255,255,0.03)',
                                                                borderRadius: 6,
                                                                marginBottom: 8
                                                            },
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between'
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: 8
                                                                                },
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        style: {
                                                                                            fontWeight: 700
                                                                                        },
                                                                                        children: c.name
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/admin.js",
                                                                                        lineNumber: 661,
                                                                                        columnNumber: 43
                                                                                    }, this),
                                                                                    isApproved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        style: {
                                                                                            background: 'var(--color-neon)',
                                                                                            color: '#000',
                                                                                            padding: '2px 8px',
                                                                                            borderRadius: 6,
                                                                                            fontSize: 12,
                                                                                            fontWeight: 700
                                                                                        },
                                                                                        children: "Approved"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/pages/admin.js",
                                                                                        lineNumber: 662,
                                                                                        columnNumber: 58
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 660,
                                                                                columnNumber: 41
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb'
                                                                                },
                                                                                children: c.goal ? `Goal: $${c.goal}` : ''
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 664,
                                                                                columnNumber: 39
                                                                            }, this),
                                                                            (c.gifted || c.giftedRaised != null) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#9be',
                                                                                    marginTop: 6
                                                                                },
                                                                                children: [
                                                                                    "Raised (gifts): ",
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                        style: {
                                                                                            color: 'var(--color-neon)'
                                                                                        },
                                                                                        children: [
                                                                                            "$",
                                                                                            c.gifted || c.giftedRaised || 0
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/pages/admin.js",
                                                                                        lineNumber: 666,
                                                                                        columnNumber: 111
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 666,
                                                                                columnNumber: 41
                                                                            }, this),
                                                                            percent != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb'
                                                                                },
                                                                                children: [
                                                                                    "Progress: ",
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                        style: {
                                                                                            color: 'var(--color-neon)'
                                                                                        },
                                                                                        children: [
                                                                                            percent,
                                                                                            "%"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/pages/admin.js",
                                                                                        lineNumber: 668,
                                                                                        columnNumber: 110
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 668,
                                                                                columnNumber: 59
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 659,
                                                                        columnNumber: 37
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            textAlign: 'right'
                                                                        },
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    fontWeight: 700
                                                                                },
                                                                                children: [
                                                                                    "$",
                                                                                    usedRaised
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 671,
                                                                                columnNumber: 39
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb'
                                                                                },
                                                                                children: percent != null && percent > 0 ? `${percent}%` : ''
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 672,
                                                                                columnNumber: 39
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/admin.js",
                                                                        lineNumber: 670,
                                                                        columnNumber: 37
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/admin.js",
                                                                lineNumber: 658,
                                                                columnNumber: 35
                                                            }, this)
                                                        }, c.id, false, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 657,
                                                            columnNumber: 33
                                                        }, this);
                                                    })
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 647,
                                                columnNumber: 27
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                style: {
                                                    marginTop: 8
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            color: 'var(--color-neon)',
                                                            fontWeight: 700,
                                                            marginBottom: 8
                                                        },
                                                        children: "Donor Analytics"
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/admin.js",
                                                        lineNumber: 681,
                                                        columnNumber: 29
                                                    }, this),
                                                    (analyticsData.donorStats || []).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                padding: 8,
                                                                border: '1px solid rgba(255,255,255,0.03)',
                                                                borderRadius: 6,
                                                                marginBottom: 8,
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
                                                                            children: d.name
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 685,
                                                                            columnNumber: 35
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: '#bbb'
                                                                            },
                                                                            children: d.email
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 686,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 684,
                                                                    columnNumber: 33
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        textAlign: 'right'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                fontWeight: 700
                                                                            },
                                                                            children: [
                                                                                "$",
                                                                                Number(d.totalGiving || 0).toLocaleString ? Number(d.totalGiving || 0).toLocaleString() : d.totalGiving || 0
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 689,
                                                                            columnNumber: 35
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                fontSize: 12,
                                                                                color: '#bbb'
                                                                            },
                                                                            children: [
                                                                                d.gifts,
                                                                                " gifts"
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 690,
                                                                            columnNumber: 35
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                marginTop: 6
                                                                            },
                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                className: "btn btn-ghost",
                                                                                onClick: async ()=>{
                                                                                    try {
                                                                                        const token = (()=>{
                                                                                            try {
                                                                                                return localStorage.getItem('token');
                                                                                            } catch (e) {
                                                                                                return null;
                                                                                            }
                                                                                        })();
                                                                                        const res = await fetch(`/api/donors/${d.id}`, {
                                                                                            headers: {
                                                                                                ...token ? {
                                                                                                    Authorization: `Bearer ${token}`
                                                                                                } : {}
                                                                                            }
                                                                                        });
                                                                                        if (!res.ok) {
                                                                                            const err = await res.json().catch(()=>({}));
                                                                                            return alert('Unable to load donor: ' + (err.error || 'unknown'));
                                                                                        }
                                                                                        const payload = await res.json();
                                                                                        setSelectedDonor({
                                                                                            ...payload.donor,
                                                                                            donations: payload.donations
                                                                                        });
                                                                                    } catch (e) {
                                                                                        console.warn(e);
                                                                                        alert('Failed to fetch donor');
                                                                                    }
                                                                                },
                                                                                children: "View"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/admin.js",
                                                                                lineNumber: 691,
                                                                                columnNumber: 62
                                                                            }, this)
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/admin.js",
                                                                            lineNumber: 691,
                                                                            columnNumber: 35
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/admin.js",
                                                                    lineNumber: 688,
                                                                    columnNumber: 33
                                                                }, this)
                                                            ]
                                                        }, d.id, true, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 683,
                                                            columnNumber: 31
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/admin.js",
                                                lineNumber: 680,
                                                columnNumber: 27
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/admin.js",
                                        lineNumber: 613,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 607,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/admin.js",
                        lineNumber: 489,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 477,
                columnNumber: 15
            }, this),
            confirmOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 420,
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: "Confirm Clear All Data"
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 716,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: '#ddd'
                            },
                            children: "This will permanently delete donors, donations, campaigns and alerts from the database. This cannot be undone."
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 717,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: '#ffb3b3',
                                fontWeight: 700
                            },
                            children: "Type your admin password to confirm."
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 718,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 8
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "input",
                                type: "password",
                                value: confirmPassword,
                                onChange: (e)=>setConfirmPassword(e.target.value),
                                placeholder: "Admin password",
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 720,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 719,
                            columnNumber: 21
                        }, this),
                        confirmError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#ff8080',
                                marginTop: 8
                            },
                            children: confirmError
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 722,
                            columnNumber: 38
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'flex-end',
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn btn-ghost",
                                    onClick: ()=>{
                                        setConfirmOpen(false);
                                        setConfirmPassword('');
                                        setConfirmError(null);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 724,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn",
                                    onClick: async ()=>{
                                        setConfirmLoading(true);
                                        setConfirmError(null);
                                        try {
                                            const token = (()=>{
                                                try {
                                                    return localStorage.getItem('token');
                                                } catch (e) {
                                                    return null;
                                                }
                                            })();
                                            const res = await fetch('/api/clear', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    ...token ? {
                                                        Authorization: `Bearer ${token}`
                                                    } : {}
                                                },
                                                body: JSON.stringify({
                                                    password: confirmPassword
                                                })
                                            });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data?.error || 'Clear failed');
                                            setMetrics([]);
                                            setPartners([]);
                                            setDonors([]);
                                            setCampaigns([]);
                                            setRecentActivity([]);
                                            setAlerts([]);
                                            setAnalytics(null);
                                            setConfirmOpen(false);
                                            setConfirmPassword('');
                                        } catch (err) {
                                            setConfirmError(err.message);
                                        } finally{
                                            setConfirmLoading(false);
                                        }
                                    },
                                    style: {
                                        background: '#ff4d4d',
                                        color: '#fff'
                                    },
                                    disabled: confirmLoading,
                                    children: confirmLoading ? 'Clearing...' : 'Confirm Clear'
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 725,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 723,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 715,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 714,
                columnNumber: 17
            }, this),
            seedModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 720,
                        maxHeight: '70vh',
                        overflow: 'auto',
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: "Seeder Response"
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 746,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: 13,
                                color: '#bbb',
                                marginBottom: 8
                            },
                            children: [
                                "Full response from ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                    children: "/api/seed"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 747,
                                    columnNumber: 97
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 747,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                background: '#080808',
                                padding: 12,
                                borderRadius: 6,
                                color: '#ddd',
                                maxHeight: 380,
                                overflow: 'auto'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                style: {
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    color: '#ddd'
                                },
                                children: JSON.stringify(seedResponseData, null, 2)
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 749,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 748,
                            columnNumber: 21
                        }, this),
                        seedError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#ff8080',
                                marginTop: 8
                            },
                            children: seedError
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 751,
                            columnNumber: 35
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: 12
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: ()=>{
                                    setSeedModalOpen(false);
                                    setSeedResponseData(null);
                                    setSeedError(null);
                                },
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 753,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 752,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 745,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 744,
                columnNumber: 17
            }, this),
            campaignActionModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 520,
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: campaignActionType === 'approve' ? 'Approve Campaign' : campaignActionType === 'deactivate' ? 'Deactivate Campaign' : 'Campaign Action'
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 762,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#bbb',
                                marginTop: 6
                            },
                            children: campaignActionCampaign?.name
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 763,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: '#ddd',
                                marginTop: 8
                            },
                            children: "To confirm this action, enter your admin password."
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 764,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 8
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "input",
                                type: "password",
                                value: campaignActionPassword,
                                onChange: (e)=>setCampaignActionPassword(e.target.value),
                                placeholder: "Admin password",
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 766,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 765,
                            columnNumber: 21
                        }, this),
                        campaignActionError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#ff8080',
                                marginTop: 8
                            },
                            children: campaignActionError
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 768,
                            columnNumber: 45
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 8,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn btn-ghost",
                                    onClick: ()=>{
                                        setCampaignActionModalOpen(false);
                                        setCampaignActionCampaign(null);
                                        setCampaignActionPassword('');
                                        setCampaignActionError(null);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 770,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn",
                                    onClick: async ()=>{
                                        if (!campaignActionCampaign || !campaignActionType) return;
                                        setCampaignActionLoading(true);
                                        setCampaignActionError(null);
                                        try {
                                            const token = (()=>{
                                                try {
                                                    return localStorage.getItem('token');
                                                } catch (e) {
                                                    return null;
                                                }
                                            })();
                                            const body = {
                                                password: campaignActionPassword
                                            };
                                            if (campaignActionType === 'approve') body.action = 'approve';
                                            else if (campaignActionType === 'deactivate') body.action = 'deactivate';
                                            else if (campaignActionType === 'deny') body.approved = false;
                                            const res = await fetch(`/api/campaigns/${campaignActionCampaign.id}/approve`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    ...token ? {
                                                        Authorization: `Bearer ${token}`
                                                    } : {}
                                                },
                                                body: JSON.stringify(body)
                                            });
                                            const data = await res.json().catch(()=>null);
                                            if (!res.ok) {
                                                const msg = data?.error || 'Action failed';
                                                setCampaignActionError(msg + (data?.details ? ` — ${data.details}` : ''));
                                                return;
                                            }
                                            // refresh admin datasets
                                            try {
                                                await Promise.all([
                                                    loadCampaigns().catch(()=>{}),
                                                    loadAnalytics().catch(()=>{})
                                                ]);
                                            } catch (e) {
                                                console.warn('Reload after campaign action failed', e);
                                            }
                                            setCampaignActionModalOpen(false);
                                            setCampaignActionCampaign(null);
                                            setCampaignActionPassword('');
                                        } catch (err) {
                                            console.warn('Campaign action failed', err);
                                            setCampaignActionError(String(err));
                                        } finally{
                                            setCampaignActionLoading(false);
                                        }
                                    },
                                    disabled: campaignActionLoading || !campaignActionPassword,
                                    children: campaignActionLoading ? 'Working...' : 'Confirm'
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 771,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 769,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 761,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 760,
                columnNumber: 17
            }, this),
            roleChangeModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 520,
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: roleChangeTargetRole === 'ADMIN' ? 'Promote to Admin' : 'Change Role'
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 807,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#bbb',
                                marginTop: 6
                            },
                            children: roleChangeTargetUser ? roleChangeTargetUser.name || roleChangeTargetUser.email : ''
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 808,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: '#ddd',
                                marginTop: 8
                            },
                            children: "Changing a user's role is a privileged action. To confirm, enter your admin password."
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 809,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 8
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "input",
                                type: "password",
                                value: roleChangePassword,
                                onChange: (e)=>setRoleChangePassword(e.target.value),
                                placeholder: "Admin password",
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 811,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 810,
                            columnNumber: 21
                        }, this),
                        roleChangeError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#ff8080',
                                marginTop: 8
                            },
                            children: roleChangeError
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 813,
                            columnNumber: 41
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 8,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn btn-ghost",
                                    onClick: ()=>{
                                        setRoleChangeModalOpen(false);
                                        setRoleChangeTargetUser(null);
                                        setRoleChangeTargetRole(null);
                                        setRoleChangePassword('');
                                        setRoleChangeError(null);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 815,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn",
                                    onClick: async ()=>{
                                        if (!roleChangeTargetUser || !roleChangeTargetRole) return;
                                        setRoleChangeLoading(true);
                                        setRoleChangeError(null);
                                        try {
                                            const token = (()=>{
                                                try {
                                                    return localStorage.getItem('token');
                                                } catch (e) {
                                                    return null;
                                                }
                                            })();
                                            const res = await fetch(`/api/users/${roleChangeTargetUser.id}/role`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    ...token ? {
                                                        Authorization: `Bearer ${token}`
                                                    } : {}
                                                },
                                                body: JSON.stringify({
                                                    role: roleChangeTargetRole,
                                                    password: roleChangePassword
                                                })
                                            });
                                            const data = await res.json().catch(()=>null);
                                            if (!res.ok) {
                                                const msg = data?.error || 'Role change failed';
                                                setRoleChangeError(msg + (data?.details ? ` — ${data.details}` : ''));
                                                return;
                                            }
                                            try {
                                                await loadUsers();
                                            } catch (e) {
                                                console.warn('Reload users failed', e);
                                            }
                                            setRoleChangeModalOpen(false);
                                            setRoleChangeTargetUser(null);
                                            setRoleChangeTargetRole(null);
                                            setRoleChangePassword('');
                                        } catch (err) {
                                            console.warn('Role change failed', err);
                                            setRoleChangeError(String(err));
                                        } finally{
                                            setRoleChangeLoading(false);
                                        }
                                    },
                                    disabled: roleChangeLoading || !roleChangePassword,
                                    children: roleChangeLoading ? 'Working...' : 'Confirm'
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 816,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 814,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 806,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 805,
                columnNumber: 17
            }, this),
            manualDeleteModalOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 520,
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: "Delete Campaign"
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 846,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#bbb',
                                marginTop: 6
                            },
                            children: manualDeleteCampaign?.name || manualDeleteCampaign?.title
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 847,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            style: {
                                color: '#ddd',
                                marginTop: 8
                            },
                            children: "This will permanently delete the campaign and its donations. To confirm, enter your admin password."
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 848,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 8
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "input",
                                type: "password",
                                value: manualDeletePassword,
                                onChange: (e)=>setManualDeletePassword(e.target.value),
                                placeholder: "Admin password",
                                autoComplete: "current-password"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 850,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 849,
                            columnNumber: 21
                        }, this),
                        manualDeleteError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#ff8080',
                                marginTop: 8
                            },
                            children: manualDeleteError
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 852,
                            columnNumber: 43
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 8,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn btn-ghost",
                                    onClick: ()=>{
                                        setManualDeleteModalOpen(false);
                                        setManualDeleteCampaign(null);
                                        setManualDeletePassword('');
                                        setManualDeleteError(null);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 854,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn btn-danger",
                                    onClick: async ()=>{
                                        if (!manualDeleteCampaign) return;
                                        setManualDeleteLoading(true);
                                        setManualDeleteError(null);
                                        try {
                                            const token = (()=>{
                                                try {
                                                    return localStorage.getItem('token');
                                                } catch (e) {
                                                    return null;
                                                }
                                            })();
                                            const res = await fetch('/api/admin/delete-campaign', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    ...token ? {
                                                        Authorization: `Bearer ${token}`
                                                    } : {}
                                                },
                                                body: JSON.stringify({
                                                    password: manualDeletePassword,
                                                    id: manualDeleteCampaign.id
                                                })
                                            });
                                            const data = await res.json().catch(()=>null);
                                            if (!res.ok) {
                                                setManualDeleteError(data?.error || 'Delete failed');
                                                return;
                                            }
                                            try {
                                                await Promise.all([
                                                    loadCampaigns().catch(()=>{}),
                                                    loadAnalytics().catch(()=>{})
                                                ]);
                                            } catch (e) {
                                                console.warn('Reload after delete failed', e);
                                            }
                                            setManualDeleteModalOpen(false);
                                            setManualDeleteCampaign(null);
                                            setManualDeletePassword('');
                                        } catch (err) {
                                            console.warn('Manual delete failed', err);
                                            setManualDeleteError(String(err));
                                        } finally{
                                            setManualDeleteLoading(false);
                                        }
                                    },
                                    disabled: manualDeleteLoading || !manualDeletePassword,
                                    children: manualDeleteLoading ? 'Deleting...' : 'Delete'
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 855,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 853,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 845,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 844,
                columnNumber: 17
            }, this),
            selectedDonor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 520,
                        background: 'var(--color-off-black)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 18,
                        borderRadius: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                color: 'var(--color-neon)'
                            },
                            children: selectedDonor.name
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 883,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#bbb',
                                marginTop: 6
                            },
                            children: selectedDonor.email
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 884,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                gap: 12,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        flex: 1,
                                        padding: 12,
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 12,
                                                color: '#bbb'
                                            },
                                            children: "Total Giving"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 887,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700,
                                                fontSize: 18
                                            },
                                            children: [
                                                "$",
                                                selectedDonor.totalGiving
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 888,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 886,
                                    columnNumber: 23
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        flex: 1,
                                        padding: 12,
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: 6
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 12,
                                                color: '#bbb'
                                            },
                                            children: "Gifts"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 891,
                                            columnNumber: 25
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700,
                                                fontSize: 18
                                            },
                                            children: selectedDonor.gifts
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 892,
                                            columnNumber: 25
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 890,
                                    columnNumber: 23
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 885,
                            columnNumber: 21
                        }, this),
                        selectedDonor.donations && selectedDonor.donations.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700,
                                        color: 'var(--color-neon)',
                                        marginBottom: 8
                                    },
                                    children: "Donation History"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 897,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    },
                                    children: selectedDonor.donations.map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: 8,
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                borderRadius: 6,
                                                display: 'flex',
                                                justifyContent: 'space-between'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontWeight: 700
                                                            },
                                                            children: [
                                                                "$",
                                                                d.amount
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 902,
                                                            columnNumber: 33
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontSize: 12,
                                                                color: '#bbb'
                                                            },
                                                            children: new Date(d.date).toLocaleDateString()
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin.js",
                                                            lineNumber: 903,
                                                            columnNumber: 33
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin.js",
                                                    lineNumber: 901,
                                                    columnNumber: 31
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: d.campaignId ? `Campaign: ${d.campaignId}` : ''
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/admin.js",
                                                    lineNumber: 905,
                                                    columnNumber: 31
                                                }, this)
                                            ]
                                        }, d.id, true, {
                                            fileName: "[project]/pages/admin.js",
                                            lineNumber: 900,
                                            columnNumber: 29
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin.js",
                                    lineNumber: 898,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 896,
                            columnNumber: 23
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: 12
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: ()=>setSelectedDonor(null),
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin.js",
                                lineNumber: 912,
                                columnNumber: 23
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin.js",
                            lineNumber: 911,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin.js",
                    lineNumber: 882,
                    columnNumber: 19
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin.js",
                lineNumber: 881,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/admin.js",
        lineNumber: 443,
        columnNumber: 13
    }, this);
}
_s(Admin, "nEmTris/Q26n+776Vcdq0asl1nk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Admin;
var _c;
__turbopack_context__.k.register(_c, "Admin");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/admin.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/admin";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/admin.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/admin\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/admin.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__fbe847f3._.js.map