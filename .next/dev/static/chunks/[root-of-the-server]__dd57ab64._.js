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
"[project]/pages/admin/donors.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminDonors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function AdminDonors() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [donors, setDonors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [campaigns, setCampaigns] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newDonor, setNewDonor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const [adding, setAdding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [donationModal, setDonationModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null) // { donor }
    ;
    const [donationLoading, setDonationLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [donationForm, setDonationForm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        amount: '',
        campaignId: '',
        method: 'CASH',
        methodDetail: '',
        notes: ''
    });
    const [previewDonor, setPreviewDonor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null) // { donor, totalGiving, giftedTotal, gifts, lastGiftAt }
    ;
    const [fullDonor, setFullDonor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null) // full donor with donations for client-side view
    ;
    // Client-side sample generators (used as fallback when server returns no data)
    function generateSampleCampaigns() {
        return [
            {
                id: 'sample-c-1',
                name: 'Spring Fundraiser 2025',
                goal: 75000,
                raised: 12000,
                giftedRaised: 2000,
                approved: true
            },
            {
                id: 'sample-c-2',
                name: 'Community Outreach Q2',
                goal: 20000,
                raised: 5000,
                giftedRaised: 800,
                approved: false
            },
            {
                id: 'sample-c-3',
                name: 'Scholarship Drive',
                goal: 30000,
                raised: 15000,
                giftedRaised: 3000,
                approved: true
            },
            {
                id: 'sample-c-4',
                name: 'Winter Relief 2025',
                goal: 40000,
                raised: 22000,
                giftedRaised: 5000,
                approved: true
            }
        ];
    }
    function generateSampleDonations(donorId) {
        const now = Date.now();
        const rand = (min, max)=>Math.round(Math.random() * (max - min) + min);
        const list = [];
        const count = rand(2, 6);
        for(let i = 0; i < count; i++){
            const amount = rand(20, 5000);
            list.push({
                id: `sample-d-${donorId}-${i}`,
                donorId,
                amount,
                date: new Date(now - i * 86400000 * rand(5, 30)).toISOString(),
                campaignId: i % 2 === 0 ? 'sample-c-1' : 'sample-c-2',
                method: i % 3 === 0 ? 'CARD' : 'CASH',
                notes: i % 4 === 0 ? 'gift' : ''
            });
        }
        // sort descending by date
        return list.sort((a, b)=>new Date(b.date) - new Date(a.date));
    }
    function generateSampleDonors() {
        const names = [
            [
                'Nate',
                'Marshall'
            ],
            [
                'Evelyn',
                'Hart'
            ],
            [
                'Jamal',
                'Reyes'
            ],
            [
                'Lila',
                'Kim'
            ],
            [
                'Owen',
                'Park'
            ],
            [
                'Maya',
                'Singh'
            ],
            [
                'Alex',
                'Chen'
            ],
            [
                'Sofia',
                'Diaz'
            ],
            [
                'Ryan',
                'West'
            ],
            [
                'Zoe',
                'Ng'
            ]
        ];
        return names.map((n, i)=>{
            const id = `sample-${i + 1}`;
            const donations = generateSampleDonations(id);
            const totalGiving = donations.reduce((s, x)=>s + Number(x.amount || 0), 0);
            const giftedTotal = donations.filter((d)=>String(d.notes || '').toLowerCase().includes('gift')).reduce((s, x)=>s + Number(x.amount || 0), 0);
            return {
                id,
                firstName: n[0],
                lastName: n[1],
                email: `${n[0].toLowerCase()}.${n[1].toLowerCase()}@example.org`,
                phone: '555-010' + (i + 1).toString().padStart(2, '0'),
                totalGiving,
                giftedTotal,
                donations
            };
        });
    }
    function openDonationModal(donor) {
        setDonationModal({
            donor
        });
        setDonationForm({
            amount: '',
            campaignId: '',
            method: 'CASH',
            methodDetail: '',
            notes: ''
        });
    }
    async function openPreview(donor) {
        try {
            const isGift = (x)=>{
                try {
                    const m = String(x.method || '').toLowerCase();
                    const n = String(x.notes || '').toLowerCase();
                    return /gift/.test(m) || /gift/.test(n);
                } catch (e) {
                    return false;
                }
            };
            // fetch donor detail from server; if it fails, synthesize a client-side preview
            try {
                const res = await fetch(`/api/donors/${donor.id}`);
                if (!res.ok) throw new Error('no-server');
                const data = await res.json();
                const gifts = data.donations || [];
                const totalGiving = (gifts || []).reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
                const giftedTotal = (gifts || []).filter(isGift).reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
                const lastGiftAt = gifts && gifts.length > 0 ? gifts[0].date || gifts[gifts.length - 1].date : null;
                setPreviewDonor({
                    donor: data.donor || donor,
                    totalGiving,
                    giftedTotal,
                    gifts: gifts.length,
                    lastGiftAt,
                    donations: gifts
                });
                return;
            } catch (err) {
                // build a client-side preview from sample donors (or generate for this donor)
                try {
                    const local = generateSampleDonors().find((s)=>s.id === donor.id) || null;
                    const donations = local ? local.donations : generateSampleDonations(donor.id || 'local');
                    const totalGiving = (donations || []).reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
                    const giftedTotal = (donations || []).filter(isGift).reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
                    const lastGiftAt = donations && donations.length > 0 ? donations[0].date : null;
                    setPreviewDonor({
                        donor: {
                            ...donor,
                            email: donor.email || `${donor.firstName || 'user'}.sample@example.org`
                        },
                        totalGiving,
                        giftedTotal,
                        gifts: donations.length,
                        lastGiftAt,
                        donations
                    });
                    return;
                } catch (e) {
                    throw e;
                }
            }
        } catch (e) {
            console.warn(e);
            setPreviewDonor({
                donor,
                error: 'Preview failed'
            });
        }
    }
    // demo generators removed — always rely on server data
    function filteredDonors(list, term) {
        if (!term || term.trim() === '') return list;
        const q = term.toLowerCase();
        // if user types a single character, match by startsWith for more precise narrowing
        if (q.length === 1) {
            return list.filter((d)=>{
                const first = (d.firstName || '').toLowerCase();
                const last = (d.lastName || '').toLowerCase();
                const email = (d.email || '').toLowerCase();
                return first.startsWith(q) || last.startsWith(q) || email.startsWith(q);
            });
        }
        return list.filter((d)=>{
            const name = ((d.firstName || '') + ' ' + (d.lastName || '')).toLowerCase();
            const email = (d.email || '').toLowerCase();
            return name.includes(q) || email.includes(q);
        });
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminDonors.useEffect": ()=>{
            let mounted = true;
            ({
                "AdminDonors.useEffect": async ()=>{
                    try {
                        const token = ({
                            "AdminDonors.useEffect.token": ()=>{
                                try {
                                    return localStorage.getItem('token');
                                } catch (e) {
                                    return null;
                                }
                            }
                        })["AdminDonors.useEffect.token"]();
                        if (!token) {
                            setError('Not authenticated');
                            setLoading(false);
                            return;
                        }
                        const res = await fetch('/api/protected', {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });
                        if (!res.ok) {
                            setError('Session invalid');
                            setLoading(false);
                            return;
                        }
                        const data = await res.json();
                        if (!data?.user) {
                            setError('Unable to load user');
                            setLoading(false);
                            return;
                        }
                        setUser(data.user);
                        await loadDonors();
                        await loadCampaigns();
                    } catch (err) {
                        console.warn(err);
                        setError('Network error');
                    } finally{
                        if (mounted) setLoading(false);
                    }
                }
            })["AdminDonors.useEffect"]();
            return ({
                "AdminDonors.useEffect": ()=>{
                    mounted = false;
                }
            })["AdminDonors.useEffect"];
        }
    }["AdminDonors.useEffect"], []);
    async function loadDonors() {
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/donors', {
                headers: {
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                }
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = data.donors || [];
            if (!list || list.length === 0) {
                // attempt to auto-seed server-side data and reload
                try {
                    const sRes = await fetch('/api/seed', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...token ? {
                                Authorization: `Bearer ${token}`
                            } : {}
                        }
                    });
                    if (sRes.ok) {
                        // reload donors after seeding
                        const retry = await fetch('/api/donors', {
                            headers: {
                                ...token ? {
                                    Authorization: `Bearer ${token}`
                                } : {}
                            }
                        });
                        if (retry.ok) {
                            const rdata = await retry.json();
                            setDonors(rdata.donors || []);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Auto-seed donors failed', e);
                }
                // fallback to client-side sample donors for a working UI
                try {
                    const samples = generateSampleDonors();
                    setDonors(samples);
                    // also populate campaigns if empty so donation form has choices
                    const sampleCampaigns = generateSampleCampaigns();
                    setCampaigns(sampleCampaigns);
                    return;
                } catch (e) {
                    console.warn('Local sample donors failed', e);
                }
                setDonors([]);
                return;
            }
            // try to enrich donors with gifted totals via analytics donorStats
            try {
                const aRes = await fetch('/api/analytics');
                if (aRes.ok) {
                    const aData = await aRes.json();
                    const needSeed = !aData || !Array.isArray(aData.donorStats) || aData.donorStats.length === 0;
                    if (needSeed) {
                        // try server-side seed and reload analytics + donors
                        try {
                            const sRes = await fetch('/api/seed', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...token ? {
                                        Authorization: `Bearer ${token}`
                                    } : {}
                                }
                            });
                            if (sRes.ok) {
                                const newARes = await fetch('/api/analytics');
                                if (newARes.ok) {
                                    const newAData = await newARes.json();
                                    const map = (newAData.donorStats || []).reduce((acc, x)=>{
                                        acc[x.id] = x;
                                        return acc;
                                    }, {});
                                    const enriched = list.map((d)=>({
                                            ...d,
                                            giftedTotal: map[d.id] && (map[d.id].giftedTotal || map[d.id].gifted) || 0
                                        }));
                                    setDonors(enriched);
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('Auto-seed analytics failed', e);
                        }
                    }
                    const map = (aData.donorStats || []).reduce((acc, x)=>{
                        acc[x.id] = x;
                        return acc;
                    }, {});
                    const enriched = list.map((d)=>({
                            ...d,
                            giftedTotal: map[d.id] && (map[d.id].giftedTotal || map[d.id].gifted) || 0
                        }));
                    setDonors(enriched);
                } else {
                    setDonors(list);
                }
            } catch (e) {
                console.warn('Enrich donors failed', e);
                setDonors(list);
            }
        } catch (e) {
            console.warn(e);
        }
    }
    async function loadCampaigns() {
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/campaigns');
            if (!res.ok) return;
            const data = await res.json();
            const list = data.campaigns || [];
            if (!list || list.length === 0) {
                // attempt to auto-seed server-side data and reload
                try {
                    const sRes = await fetch('/api/seed', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...token ? {
                                Authorization: `Bearer ${token}`
                            } : {}
                        }
                    });
                    if (sRes.ok) {
                        const retry = await fetch('/api/campaigns');
                        if (retry.ok) {
                            const rdata = await retry.json();
                            setCampaigns(rdata.campaigns || []);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Auto-seed campaigns failed', e);
                }
                setCampaigns([]);
                return;
            }
            setCampaigns(list);
        } catch (e) {
            console.warn(e);
        }
    }
    async function handleAddDonor(e) {
        e.preventDefault();
        if (!newDonor.firstName || !newDonor.email) return alert('Name and email required');
        setAdding(true);
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const res = await fetch('/api/donors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                },
                body: JSON.stringify(newDonor)
            });
            if (!res.ok) {
                const err = await res.json().catch(()=>({}));
                return alert('Add donor failed: ' + (err.error || 'unknown'));
            }
            setNewDonor({
                firstName: '',
                lastName: '',
                email: '',
                phone: ''
            });
            await loadDonors();
        } catch (e) {
            console.warn(e);
            alert('Failed to add donor');
        } finally{
            setAdding(false);
        }
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-black, #000)'
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center',
                    color: 'var(--color-neon, #39ff14)'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            width: 92,
                            height: 92,
                            borderRadius: 46,
                            border: '6px solid rgba(57,255,20,0.12)',
                            borderTopColor: 'var(--color-neon, #39ff14)',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 18px'
                        }
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 259,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: "Loading donors..."
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 260,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("style", {
                        children: `@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 261,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 258,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/pages/admin/donors.js",
            lineNumber: 257,
            columnNumber: 7
        }, this);
    }
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 24,
            color: '#ff8080'
        },
        children: error
    }, void 0, false, {
        fileName: "[project]/pages/admin/donors.js",
        lineNumber: 266,
        columnNumber: 21
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        style: {
                            color: 'var(--color-neon)'
                        },
                        children: "Donors"
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn",
                            onClick: ()=>router.push('/admin'),
                            children: "Back"
                        }, void 0, false, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 273,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 270,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 320px',
                    gap: 20
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                border: '1px solid rgba(255,255,255,0.03)',
                                padding: 12,
                                borderRadius: 8
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
                                            children: "All Donors"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 281,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                width: 320
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                className: "input",
                                                placeholder: "Filter by name or email",
                                                value: searchTerm,
                                                onChange: (e)=>setSearchTerm(e.target.value)
                                            }, void 0, false, {
                                                fileName: "[project]/pages/admin/donors.js",
                                                lineNumber: 283,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 282,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 280,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 8,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    },
                                    children: filteredDonors(donors, searchTerm).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            color: '#888'
                                        },
                                        children: "No donors match your search"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin/donors.js",
                                        lineNumber: 287,
                                        columnNumber: 65
                                    }, this) : filteredDonors(donors, searchTerm).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                padding: 10,
                                                borderBottom: '1px solid rgba(255,255,255,0.02)',
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
                                                                d.firstName,
                                                                " ",
                                                                d.lastName || ''
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 290,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontSize: 12,
                                                                color: '#bbb'
                                                            },
                                                            children: [
                                                                d.email,
                                                                " — $",
                                                                d.totalGiving || 0,
                                                                typeof d.giftedTotal !== 'undefined' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        marginLeft: 8,
                                                                        color: '#9be'
                                                                    },
                                                                    children: `(gifts: $${d.giftedTotal})`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/admin/donors.js",
                                                                    lineNumber: 294,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 291,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 289,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        display: 'flex',
                                                        gap: 8
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "btn",
                                                            onClick: ()=>openDonationModal(d),
                                                            children: "Record Donation"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 299,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "btn btn-ghost",
                                                            onClick: ()=>openPreview(d),
                                                            children: "View"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 300,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 298,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, d.id, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 288,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 286,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 279,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                border: '1px solid rgba(255,255,255,0.03)',
                                padding: 12,
                                borderRadius: 8
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700,
                                        marginBottom: 8
                                    },
                                    children: "Add New Donor"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 310,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 8
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn btn-primary",
                                        onClick: ()=>router.push('/admin/donors/new'),
                                        children: "Add Donor"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/admin/donors.js",
                                        lineNumber: 312,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 311,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 309,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/admin/donors.js",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 277,
                columnNumber: 7
            }, this),
            donationModal && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            children: [
                                "Record Donation for ",
                                donationModal.donor.firstName,
                                " ",
                                donationModal.donor.lastName || ''
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 323,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                            onSubmit: async (e)=>{
                                e.preventDefault();
                                const amount = parseFloat(donationForm.amount);
                                if (!amount || isNaN(amount)) return alert('Enter a valid amount');
                                try {
                                    setDonationLoading(true);
                                    const token = (()=>{
                                        try {
                                            return localStorage.getItem('token');
                                        } catch (e) {
                                            return null;
                                        }
                                    })();
                                    // build notes including method detail (do not store full card numbers in production)
                                    let notes = donationForm.notes || '';
                                    if (donationForm.methodDetail) {
                                        notes = `${donationForm.method} - ${donationForm.methodDetail}${notes ? ' | ' + notes : ''}`;
                                    } else {
                                        notes = `${donationForm.method}${notes ? ' | ' + notes : ''}`;
                                    }
                                    const payload = {
                                        donorId: donationModal.donor.id,
                                        amount,
                                        campaignId: donationForm.campaignId || null,
                                        method: donationForm.method,
                                        notes
                                    };
                                    const res = await fetch('/api/donations', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            ...token ? {
                                                Authorization: `Bearer ${token}`
                                            } : {}
                                        },
                                        body: JSON.stringify(payload)
                                    });
                                    if (!res.ok) {
                                        const err = await res.json().catch(()=>({}));
                                        return alert('Record failed: ' + (err.error || 'unknown'));
                                    }
                                    await loadDonors();
                                    setDonationModal(null);
                                } catch (e) {
                                    console.warn(e);
                                    alert('Failed to record donation');
                                } finally{
                                    setDonationLoading(false);
                                }
                            },
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    style: {
                                        fontSize: 12,
                                        color: '#bbb'
                                    },
                                    children: "Amount"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    type: "number",
                                    min: "0",
                                    step: "0.01",
                                    value: donationForm.amount,
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            amount: e.target.value
                                        }),
                                    placeholder: "0.00"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 346,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    style: {
                                        fontSize: 12,
                                        color: '#bbb'
                                    },
                                    children: "Apply To (optional)"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 348,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "input",
                                    value: donationForm.campaignId || '',
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            campaignId: e.target.value || ''
                                        }),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "General / Unrestricted"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 350,
                                            columnNumber: 17
                                        }, this),
                                        campaigns.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: c.id,
                                                children: c.name || c.title || c.name
                                            }, c.id, false, {
                                                fileName: "[project]/pages/admin/donors.js",
                                                lineNumber: 351,
                                                columnNumber: 38
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 349,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    style: {
                                        fontSize: 12,
                                        color: '#bbb'
                                    },
                                    children: "Payment Method"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 354,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "input",
                                    value: donationForm.method,
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            method: e.target.value
                                        }),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "CARD",
                                            children: "Card"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 356,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "CHECK",
                                            children: "Check"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 357,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "CASH",
                                            children: "Cash"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 358,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "OTHER",
                                            children: "Other"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 359,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 355,
                                    columnNumber: 15
                                }, this),
                                donationForm.method === 'CARD' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 120px',
                                        gap: 8
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "input",
                                            placeholder: "Card type (Visa/Master)",
                                            value: donationForm.methodDetail || '',
                                            onChange: (e)=>setDonationForm({
                                                    ...donationForm,
                                                    methodDetail: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 364,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "input",
                                            placeholder: "Last 4",
                                            maxLength: 4,
                                            value: donationForm.methodDetail && donationForm.methodDetail.length === 4 && donationForm.methodDetail ? donationForm.methodDetail : donationForm.methodDetail,
                                            onChange: (e)=>setDonationForm({
                                                    ...donationForm,
                                                    methodDetail: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 365,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 363,
                                    columnNumber: 17
                                }, this),
                                donationForm.method === 'CHECK' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    placeholder: "Check number",
                                    value: donationForm.methodDetail || '',
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            methodDetail: e.target.value
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 370,
                                    columnNumber: 17
                                }, this),
                                donationForm.method === 'OTHER' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    placeholder: "Method detail",
                                    value: donationForm.methodDetail || '',
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            methodDetail: e.target.value
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 374,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    style: {
                                        fontSize: 12,
                                        color: '#bbb'
                                    },
                                    children: "Notes / Gift Designation"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 377,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                    className: "input",
                                    rows: 3,
                                    value: donationForm.notes,
                                    onChange: (e)=>setDonationForm({
                                            ...donationForm,
                                            notes: e.target.value
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 378,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex',
                                        gap: 8,
                                        justifyContent: 'flex-end'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "btn btn-ghost",
                                            onClick: ()=>{
                                                setDonationModal(null);
                                            },
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 381,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn btn-primary",
                                            disabled: donationLoading,
                                            children: donationLoading ? 'Recording...' : 'Record Donation'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 382,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 380,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 324,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin/donors.js",
                    lineNumber: 322,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 321,
                columnNumber: 9
            }, this),
            previewDonor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            children: "Donor Summary"
                        }, void 0, false, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 391,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 8
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700
                                    },
                                    children: [
                                        previewDonor.donor.firstName,
                                        " ",
                                        previewDonor.donor.lastName || ''
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 393,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: 13,
                                        color: '#bbb'
                                    },
                                    children: previewDonor.donor.email
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 394,
                                    columnNumber: 15
                                }, this),
                                previewDonor.error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        color: '#ff8080',
                                        marginTop: 8
                                    },
                                    children: previewDonor.error
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 396,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 8,
                                        fontSize: 13,
                                        color: '#bbb'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                "Gifts: ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    style: {
                                                        color: 'var(--color-neon)'
                                                    },
                                                    children: [
                                                        "$",
                                                        previewDonor.totalGiving || 0
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 399,
                                                    columnNumber: 31
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 399,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 6
                                            },
                                            children: [
                                                "Gifted amount: ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    style: {
                                                        color: 'var(--color-neon)'
                                                    },
                                                    children: [
                                                        "$",
                                                        previewDonor.giftedTotal || 0
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 400,
                                                    columnNumber: 61
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 400,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 6
                                            },
                                            children: [
                                                "Number of gifts: ",
                                                previewDonor.gifts || 0
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 401,
                                            columnNumber: 19
                                        }, this),
                                        previewDonor.lastGiftAt && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 6
                                            },
                                            children: [
                                                "Last gift: ",
                                                previewDonor.lastGiftAt
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 402,
                                            columnNumber: 47
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 398,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 392,
                            columnNumber: 13
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
                                    onClick: ()=>setPreviewDonor(null),
                                    children: "Close"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 407,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn",
                                    onClick: ()=>{
                                        setFullDonor(previewDonor);
                                        setPreviewDonor(null);
                                    },
                                    children: "View Full"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 408,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 406,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin/donors.js",
                    lineNumber: 390,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 389,
                columnNumber: 9
            }, this),
            fullDonor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "dialog-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        width: 720,
                        maxHeight: '80vh',
                        overflowY: 'auto',
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
                            children: [
                                fullDonor.donor.firstName,
                                " ",
                                fullDonor.donor.lastName || '',
                                " — Full History"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 416,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                color: '#bbb',
                                marginTop: 8
                            },
                            children: fullDonor.donor.email
                        }, void 0, false, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 417,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700
                                    },
                                    children: [
                                        "Total Giving: ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: {
                                                color: 'var(--color-neon)'
                                            },
                                            children: [
                                                "$",
                                                fullDonor.totalGiving || 0
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 419,
                                            columnNumber: 59
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 419,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 8
                                    },
                                    children: [
                                        "Gifts: ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            style: {
                                                color: 'var(--color-neon)'
                                            },
                                            children: [
                                                "$",
                                                fullDonor.giftedTotal || 0
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 420,
                                            columnNumber: 49
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 420,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 418,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                marginTop: 12
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700,
                                        marginBottom: 8
                                    },
                                    children: "Donation History"
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 423,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8
                                    },
                                    children: (fullDonor.donations || []).map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 428,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontSize: 12,
                                                                color: '#bbb'
                                                            },
                                                            children: new Date(d.date).toLocaleDateString()
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/admin/donors.js",
                                                            lineNumber: 429,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 427,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: d.campaignId ? `Campaign: ${d.campaignId}` : ''
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/admin/donors.js",
                                                    lineNumber: 431,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, d.id, true, {
                                            fileName: "[project]/pages/admin/donors.js",
                                            lineNumber: 426,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/pages/admin/donors.js",
                                    lineNumber: 424,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 422,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: 12
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: ()=>setFullDonor(null),
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/pages/admin/donors.js",
                                lineNumber: 437,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/admin/donors.js",
                            lineNumber: 436,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/admin/donors.js",
                    lineNumber: 415,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/admin/donors.js",
                lineNumber: 414,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/admin/donors.js",
        lineNumber: 269,
        columnNumber: 5
    }, this);
}
_s(AdminDonors, "wyX2m0KGprhAGCXIHtXQKJspSvY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AdminDonors;
var _c;
__turbopack_context__.k.register(_c, "AdminDonors");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/admin/donors.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/admin/donors";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/admin/donors.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/admin/donors.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/admin/donors.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__dd57ab64._.js.map