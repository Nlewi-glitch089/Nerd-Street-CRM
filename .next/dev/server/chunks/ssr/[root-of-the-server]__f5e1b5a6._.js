module.exports = [
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
}),
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
"[project]/pages/partners/[slug].js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PartnerPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
;
;
function PartnerPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { slug } = router.query;
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [partner, setPartner] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [selectedTab, setSelectedTab] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('contacts');
    const [newReminderTitle, setNewReminderTitle] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [newReminderDue, setNewReminderDue] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [newReminderNote, setNewReminderNote] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!slug) return;
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
                const res = await fetch('/api/seed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : undefined
                    }
                });
                if (!res.ok) {
                    setError('Failed to load partner data');
                    return;
                }
                const sd = await res.json();
                const list = sd.partners || [];
                const matched = list.find((p)=>{
                    const s = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return s === String(slug);
                });
                if (!matched) {
                    setError('Partner not found');
                    return;
                }
                if (mounted) setPartner(matched);
            } catch (e) {
                setError('Network error');
            } finally{
                if (mounted) setLoading(false);
            }
        })();
        return ()=>{
            mounted = false;
        };
    }, [
        slug
    ]);
    // deep-link support: allow ?tab=interactions|reminders|contacts|programs
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const t = router.query?.tab;
        if (t && [
            'contacts',
            'interactions',
            'programs',
            'reminders'
        ].includes(String(t))) {
            setSelectedTab(String(t));
        }
    }, [
        router.query?.tab
    ]);
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center'
                },
                className: "jsx-bc10eaca985a6337",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            color: '#39ff14',
                            marginTop: 14,
                            fontSize: 16
                        },
                        className: "jsx-bc10eaca985a6337",
                        children: "Loading partner details..."
                    }, void 0, false, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/partners/[slug].js",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "bc10eaca985a6337",
                children: "@keyframes spin{to{transform:rotate(360deg)}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/partners/[slug].js",
        lineNumber: 56,
        columnNumber: 5
    }, this);
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            color: '#f66'
        },
        children: [
            error,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 12
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                    className: "btn",
                    onClick: ()=>router.push('/team'),
                    children: "Back to Dashboard"
                }, void 0, false, {
                    fileName: "[project]/pages/partners/[slug].js",
                    lineNumber: 67,
                    columnNumber: 35
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/partners/[slug].js",
                lineNumber: 67,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/partners/[slug].js",
        lineNumber: 65,
        columnNumber: 5
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: "btn btn-ghost",
                            onClick: ()=>router.push('/team'),
                            children: "← Back to Dashboard"
                        }, void 0, false, {
                            fileName: "[project]/pages/partners/[slug].js",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: ()=>router.push('/team'),
                                children: "← Back to Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/pages/partners/[slug].js",
                                lineNumber: 78,
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
                                        router.replace('/');
                                    } catch (e) {
                                        try {
                                            window.location.href = '/';
                                        } catch (err) {
                                            console.warn('redirect failed', err);
                                        }
                                    }
                                },
                                children: "Logout"
                            }, void 0, false, {
                                fileName: "[project]/pages/partners/[slug].js",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 77,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/partners/[slug].js",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 16,
                    padding: 18,
                    border: '1px solid rgba(57,255,20,0.12)',
                    borderRadius: 8
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 18,
                                            fontWeight: 800
                                        },
                                        children: partner.name
                                    }, void 0, false, {
                                        fileName: "[project]/pages/partners/[slug].js",
                                        lineNumber: 89,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginTop: 6
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                style: {
                                                    background: '#0b0b0b',
                                                    borderRadius: 6,
                                                    padding: '4px 8px',
                                                    border: '1px solid rgba(57,255,20,0.08)',
                                                    color: '#39ff14',
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    marginRight: 8
                                                },
                                                children: partner.tag
                                            }, void 0, false, {
                                                fileName: "[project]/pages/partners/[slug].js",
                                                lineNumber: 91,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                style: {
                                                    color: '#bbb',
                                                    marginLeft: 6
                                                },
                                                children: partner.description
                                            }, void 0, false, {
                                                fileName: "[project]/pages/partners/[slug].js",
                                                lineNumber: 92,
                                                columnNumber: 15
                                            }, this),
                                            partner.owners && partner.owners.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                style: {
                                                    marginTop: 8,
                                                    fontSize: 12,
                                                    color: '#9ea'
                                                },
                                                children: [
                                                    partner.owners.length === 1 ? 'Assigned: ' : 'Team: ',
                                                    partner.owners.map((email, idx)=>{
                                                        const match = (partner.contacts || []).find((c)=>c.email === email);
                                                        const label = match ? `${match.name}${match.title ? ` — ${match.title}` : ''}` : email;
                                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                marginLeft: idx ? 8 : 0
                                                            },
                                                            children: [
                                                                label,
                                                                idx < partner.owners.length - 1 ? ',' : ''
                                                            ]
                                                        }, email, true, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 100,
                                                            columnNumber: 23
                                                        }, this);
                                                    })
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/partners/[slug].js",
                                                lineNumber: 94,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/partners/[slug].js",
                                        lineNumber: 90,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/partners/[slug].js",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    textAlign: 'right'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 12,
                                            color: '#bbb'
                                        },
                                        children: "Partnership Health"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/partners/[slug].js",
                                        lineNumber: 108,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 28,
                                            color: '#39ff14',
                                            fontWeight: 800
                                        },
                                        children: partner.health || '—'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/partners/[slug].js",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/partners/[slug].js",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {
                        style: {
                            border: 'none',
                            borderTop: '1px solid rgba(57,255,20,0.06)',
                            margin: '16px 0'
                        }
                    }, void 0, false, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 24
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                flex: 1
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4,1fr)',
                                        gap: 12
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: "Contract Value"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 119,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700,
                                                        marginTop: 6
                                                    },
                                                    children: partner.contractValue || '—'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 120,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 118,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: "Start Date"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 123,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700,
                                                        marginTop: 6
                                                    },
                                                    children: partner.startDate || '—'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 124,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 122,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: "End Date"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 127,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700,
                                                        marginTop: 6
                                                    },
                                                    children: partner.endDate || '—'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 128,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 126,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#bbb'
                                                    },
                                                    children: "Last Contact"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 131,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700,
                                                        marginTop: 6
                                                    },
                                                    children: partner.lastContact || '—'
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 132,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 130,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/partners/[slug].js",
                                    lineNumber: 117,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 18
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                gap: 10
                                            },
                                            children: [
                                                'contacts',
                                                'interactions',
                                                'programs',
                                                'reminders'
                                            ].map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setSelectedTab(tab),
                                                    style: {
                                                        padding: '8px 12px',
                                                        borderRadius: 8,
                                                        border: selectedTab === tab ? '1px solid #39ff14' : '1px solid rgba(255,255,255,0.03)',
                                                        background: selectedTab === tab ? 'rgba(57,255,20,0.02)' : 'transparent',
                                                        color: selectedTab === tab ? '#39ff14' : '#bbb',
                                                        cursor: 'pointer'
                                                    },
                                                    children: [
                                                        tab.charAt(0).toUpperCase() + tab.slice(1),
                                                        " (",
                                                        (partner[tab] || []).length,
                                                        ")"
                                                    ]
                                                }, tab, true, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 139,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                marginTop: 12
                                            },
                                            children: [
                                                selectedTab === 'contacts' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        padding: 12,
                                                        border: '1px solid rgba(57,255,20,0.06)',
                                                        borderRadius: 6
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontWeight: 700,
                                                                color: '#39ff14'
                                                            },
                                                            children: "Contacts"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 159,
                                                            columnNumber: 21
                                                        }, this),
                                                        (partner.contacts || []).map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    marginTop: 10
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontWeight: 700
                                                                        },
                                                                        children: c.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 162,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb',
                                                                            marginTop: 6
                                                                        },
                                                                        children: c.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 163,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb',
                                                                            marginTop: 6
                                                                        },
                                                                        children: [
                                                                            c.email,
                                                                            " · ",
                                                                            c.phone
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 164,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, i, true, {
                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                lineNumber: 161,
                                                                columnNumber: 23
                                                            }, this))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 158,
                                                    columnNumber: 19
                                                }, this),
                                                selectedTab === 'interactions' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: 12,
                                                        padding: 12,
                                                        border: '1px solid rgba(57,255,20,0.06)',
                                                        borderRadius: 6
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontWeight: 700,
                                                                color: '#39ff14'
                                                            },
                                                            children: "Engagement History"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 172,
                                                            columnNumber: 21
                                                        }, this),
                                                        (partner.interactions || []).map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    marginTop: 10
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontWeight: 700
                                                                        },
                                                                        children: [
                                                                            it.type || it.kind,
                                                                            " ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb',
                                                                                    marginLeft: 8
                                                                                },
                                                                                children: it.date
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                                lineNumber: 175,
                                                                                columnNumber: 76
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 175,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb',
                                                                            marginTop: 6
                                                                        },
                                                                        children: it.note || it.text
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 176,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, it.id || it.date, true, {
                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                lineNumber: 174,
                                                                columnNumber: 23
                                                            }, this))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 171,
                                                    columnNumber: 19
                                                }, this),
                                                selectedTab === 'programs' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: 12,
                                                        padding: 12,
                                                        border: '1px solid rgba(57,255,20,0.06)',
                                                        borderRadius: 6
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                fontWeight: 700,
                                                                color: '#39ff14'
                                                            },
                                                            children: "Programs & Contracts"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 184,
                                                            columnNumber: 21
                                                        }, this),
                                                        (partner.programs || []).map((pr)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    marginTop: 10
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontWeight: 700
                                                                        },
                                                                        children: [
                                                                            pr.title,
                                                                            " ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb',
                                                                                    marginLeft: 8
                                                                                },
                                                                                children: pr.status
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                                lineNumber: 187,
                                                                                columnNumber: 66
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 187,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb',
                                                                            marginTop: 6
                                                                        },
                                                                        children: [
                                                                            pr.value ? pr.value : '',
                                                                            " ",
                                                                            pr.start ? `· ${pr.start} - ${pr.end}` : ''
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 188,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, pr.id || pr.title, true, {
                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                lineNumber: 186,
                                                                columnNumber: 23
                                                            }, this))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 183,
                                                    columnNumber: 19
                                                }, this),
                                                selectedTab === 'reminders' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: 12,
                                                        padding: 12,
                                                        border: '1px solid rgba(57,255,20,0.06)',
                                                        borderRadius: 6
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontWeight: 700,
                                                                        color: '#39ff14'
                                                                    },
                                                                    children: "Reminders & Tasks"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/partners/[slug].js",
                                                                    lineNumber: 197,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 12,
                                                                        color: '#bbb'
                                                                    },
                                                                    children: "Local only — non-persistent"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/partners/[slug].js",
                                                                    lineNumber: 198,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 196,
                                                            columnNumber: 21
                                                        }, this),
                                                        (partner.reminders || []).map((rm)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    marginTop: 10
                                                                },
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontWeight: 700
                                                                        },
                                                                        children: [
                                                                            rm.title,
                                                                            " ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                                style: {
                                                                                    fontSize: 12,
                                                                                    color: '#bbb',
                                                                                    marginLeft: 8
                                                                                },
                                                                                children: [
                                                                                    "Due: ",
                                                                                    rm.due
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                                lineNumber: 202,
                                                                                columnNumber: 66
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 202,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            color: '#bbb',
                                                                            marginTop: 6
                                                                        },
                                                                        children: rm.note
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/pages/partners/[slug].js",
                                                                        lineNumber: 203,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, rm.id, true, {
                                                                fileName: "[project]/pages/partners/[slug].js",
                                                                lineNumber: 201,
                                                                columnNumber: 23
                                                            }, this)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 14,
                                                                borderTop: '1px dashed rgba(255,255,255,0.03)',
                                                                paddingTop: 12
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        fontSize: 13,
                                                                        color: '#bbb',
                                                                        marginBottom: 8
                                                                    },
                                                                    children: "Add a local reminder (client-only)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/partners/[slug].js",
                                                                    lineNumber: 208,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        gap: 8,
                                                                        alignItems: 'center'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                            value: newReminderTitle,
                                                                            onChange: (e)=>setNewReminderTitle(e.target.value),
                                                                            placeholder: "Title",
                                                                            style: {
                                                                                flex: 1,
                                                                                padding: 8,
                                                                                borderRadius: 6,
                                                                                border: '1px solid rgba(57,255,20,0.04)',
                                                                                background: '#0b0b0b',
                                                                                color: '#eee'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/partners/[slug].js",
                                                                            lineNumber: 210,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                            value: newReminderDue,
                                                                            onChange: (e)=>setNewReminderDue(e.target.value),
                                                                            placeholder: "Due (YYYY-MM-DD)",
                                                                            style: {
                                                                                width: 160,
                                                                                padding: 8,
                                                                                borderRadius: 6,
                                                                                border: '1px solid rgba(57,255,20,0.04)',
                                                                                background: '#0b0b0b',
                                                                                color: '#eee'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/partners/[slug].js",
                                                                            lineNumber: 211,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/partners/[slug].js",
                                                                    lineNumber: 209,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        marginTop: 8,
                                                                        display: 'flex',
                                                                        gap: 8
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                            value: newReminderNote,
                                                                            onChange: (e)=>setNewReminderNote(e.target.value),
                                                                            placeholder: "Note",
                                                                            style: {
                                                                                flex: 1,
                                                                                padding: 8,
                                                                                borderRadius: 6,
                                                                                border: '1px solid rgba(57,255,20,0.04)',
                                                                                background: '#0b0b0b',
                                                                                color: '#eee'
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/partners/[slug].js",
                                                                            lineNumber: 214,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                            className: "btn",
                                                                            onClick: ()=>{
                                                                                if (!newReminderTitle) return alert('Please add a title');
                                                                                const id = `local-${Date.now()}`;
                                                                                const r = {
                                                                                    id,
                                                                                    title: newReminderTitle,
                                                                                    due: newReminderDue || 'TBD',
                                                                                    note: newReminderNote
                                                                                };
                                                                                setPartner((prev)=>({
                                                                                        ...prev,
                                                                                        reminders: [
                                                                                            ...prev.reminders || [],
                                                                                            r
                                                                                        ]
                                                                                    }));
                                                                                setNewReminderTitle('');
                                                                                setNewReminderDue('');
                                                                                setNewReminderNote('');
                                                                            },
                                                                            children: "Add"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/partners/[slug].js",
                                                                            lineNumber: 215,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/partners/[slug].js",
                                                                    lineNumber: 213,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/partners/[slug].js",
                                                            lineNumber: 207,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/partners/[slug].js",
                                                    lineNumber: 195,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/partners/[slug].js",
                                            lineNumber: 156,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/partners/[slug].js",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/partners/[slug].js",
                            lineNumber: 116,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/partners/[slug].js",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/partners/[slug].js",
                lineNumber: 86,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/partners/[slug].js",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__f5e1b5a6._.js.map