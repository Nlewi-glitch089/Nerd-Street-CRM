module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/pages/team.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Team
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
;
;
;
function Team() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [tasks, setTasks] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [followUps, setFollowUps] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [partners, setPartners] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [recentActivity, setRecentActivity] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [signOutMessage, setSignOutMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        let mounted = true;
        (async ()=>{
            try {
                const token = (()=>{
                    try {
                        return localStorage.getItem('token');
                    } catch (e) {
                        return null;
                    }
                })();
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
                            setPartners(sd.partners || []);
                            setRecentActivity(sd.recentActivity || []);
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
        })();
        return ()=>{
            mounted = false;
        };
    }, []);
    function localSeed() {
        setTasks([
            {
                id: 't1',
                title: 'Follow up with Red Bull Gaming',
                due: '2025-12-20',
                note: 'Discuss renewal and activation'
            },
            {
                id: 't2',
                title: 'Prepare sponsor brief',
                due: '2026-01-05',
                note: 'Draft for upcoming sponsorship pitch'
            }
        ]);
        setFollowUps([
            {
                id: 'f1',
                name: 'GameStop',
                days: 95
            },
            {
                id: 'f2',
                name: 'Discord',
                days: 30
            }
        ]);
        setPartners([
            {
                name: 'GameStop',
                tag: 'At Risk'
            },
            {
                name: 'Discord',
                tag: 'Pending'
            }
        ]);
        setRecentActivity([
            {
                id: 'r1',
                partner: 'GameStop',
                text: 'Left voicemail regarding Q1 activation',
                date: 'Dec 1, 2025'
            },
            {
                id: 'r2',
                partner: 'Discord',
                text: 'Sent proposal draft',
                date: 'Nov 28, 2025'
            }
        ]);
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: "Loading..."
    }, void 0, false, {
        fileName: "[project]/pages/team.js",
        lineNumber: 87,
        columnNumber: 23
    }, this);
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            color: 'red'
        },
        children: error
    }, void 0, false, {
        fileName: "[project]/pages/team.js",
        lineNumber: 88,
        columnNumber: 21
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 18
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: 'var(--color-neon)',
                                    fontWeight: 800,
                                    fontSize: 18
                                },
                                children: "MY WORKSPACE"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#bbb'
                                },
                                children: [
                                    "Welcome back, ",
                                    user?.name || user?.email
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
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
                                lineNumber: 99,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            signOutMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                lineNumber: 124,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 12,
                    marginBottom: 14
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(47,255,85,0.16)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: 'var(--color-neon)'
                                },
                                children: "My Tasks"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: tasks.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 132,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Action items due soon"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 133,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(255,193,7,0.12)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: '#ffcc00'
                                },
                                children: "Follow-ups Needed"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: followUps.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 137,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Partners need contact"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 138,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(66,138,255,0.12)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: '#6fb3ff'
                                },
                                children: "My Partners"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 141,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 28,
                                    marginTop: 8
                                },
                                children: partners.length
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 12,
                                    color: '#bbb'
                                },
                                children: "Active accounts"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 140,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 129,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr',
                    gap: 12
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontWeight: 700,
                                    color: 'var(--color-neon)',
                                    marginBottom: 8
                                },
                                children: "Priority Actions"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this),
                            tasks.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#888'
                                },
                                children: "No tasks"
                            }, void 0, false, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 151,
                                columnNumber: 13
                            }, this) : tasks.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: 12,
                                        border: '1px solid rgba(255,255,255,0.03)',
                                        borderRadius: 6,
                                        marginBottom: 8
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700
                                            },
                                            children: t.title
                                        }, void 0, false, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 155,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 13,
                                                color: '#bbb',
                                                marginTop: 6
                                            },
                                            children: t.note
                                        }, void 0, false, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 156,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 12,
                                                color: '#ffd57a',
                                                marginTop: 6
                                            },
                                            children: [
                                                "Due: ",
                                                t.due
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 157,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, t.id, true, {
                                    fileName: "[project]/pages/team.js",
                                    lineNumber: 154,
                                    columnNumber: 15
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 14,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: 700,
                                            color: 'var(--color-neon)'
                                        },
                                        children: "Recent Activity"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 164,
                                        columnNumber: 13
                                    }, this),
                                    recentActivity.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 10
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700
                                                    },
                                                    children: [
                                                        r.partner,
                                                        " ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                fontSize: 12,
                                                                color: '#bbb',
                                                                marginLeft: 8
                                                            },
                                                            children: r.date
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/team.js",
                                                            lineNumber: 167,
                                                            columnNumber: 59
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 167,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 13,
                                                        color: '#bbb'
                                                    },
                                                    children: r.text
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/team.js",
                                                    lineNumber: 168,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, r.id, true, {
                                            fileName: "[project]/pages/team.js",
                                            lineNumber: 166,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: 14,
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontWeight: 700,
                                            color: 'var(--color-neon)'
                                        },
                                        children: "Needs Follow-up"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            marginTop: 8
                                        },
                                        children: followUps.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    padding: 10,
                                                    border: '1px solid rgba(47,255,85,0.06)',
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                },
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontWeight: 700
                                                                },
                                                                children: f.name
                                                            }, void 0, false, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 179,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    fontSize: 12,
                                                                    color: '#bbb'
                                                                },
                                                                children: [
                                                                    f.days,
                                                                    "+ days since contact"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/pages/team.js",
                                                                lineNumber: 180,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 178,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 10,
                                                            background: f.days > 60 ? '#ff4d4f' : '#ffcc00'
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/pages/team.js",
                                                        lineNumber: 182,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, f.id, true, {
                                                fileName: "[project]/pages/team.js",
                                                lineNumber: 177,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/pages/team.js",
                                        lineNumber: 175,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/team.js",
                                lineNumber: 173,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/team.js",
                        lineNumber: 162,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/team.js",
                lineNumber: 147,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/team.js",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5f1d722a._.js.map