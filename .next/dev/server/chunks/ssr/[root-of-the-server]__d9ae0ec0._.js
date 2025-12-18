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
"[project]/pages/profile.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Profile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
;
;
;
;
function Profile() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
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
                if (mounted) setUser(data.user);
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
        className: "jsx-236c8c664276c327",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    textAlign: 'center',
                    transform: 'translateY(-6%)'
                },
                className: "jsx-236c8c664276c327",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "jsx-236c8c664276c327" + " " + "spinner"
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            color: '#bbb',
                            marginTop: 14,
                            fontSize: 16
                        },
                        className: "jsx-236c8c664276c327",
                        children: "Loading profile..."
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "236c8c664276c327",
                children: ".spinner.jsx-236c8c664276c327{border:8px solid #ffffff08;border-top-color:#39ff14;border-radius:50%;width:88px;height:88px;margin:0 auto;animation:1s linear infinite spin;box-shadow:0 0 28px #39ff1414}@keyframes spin{to{transform:rotate(360deg)}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 41,
        columnNumber: 5
    }, this);
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            color: 'red'
        },
        children: error
    }, void 0, false, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 52,
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
                                children: "Profile"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 58,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#bbb'
                                },
                                children: "View and manage your account"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 59,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 57,
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
                                onClick: ()=>{
                                    try {
                                        router.back();
                                    } catch (e) {
                                        console.warn('nav failed', e);
                                    }
                                },
                                children: "Back"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 62,
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
                                        window.location.href = '/';
                                    } catch (e) {
                                        console.warn('Redirect failed', e);
                                    }
                                },
                                children: "Sign out"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 320px',
                    gap: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            padding: 18,
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: 8
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                maxWidth: 640
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontWeight: 700,
                                        color: 'var(--color-neon)',
                                        marginBottom: 8
                                    },
                                    children: "Account details"
                                }, void 0, false, {
                                    fileName: "[project]/pages/profile.js",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '140px 1fr',
                                        gap: 12,
                                        alignItems: 'center'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                color: '#bbb'
                                            },
                                            children: "Name"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 75,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700
                                            },
                                            children: user?.name || '—'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 76,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                color: '#bbb'
                                            },
                                            children: "Email"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 78,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700
                                            },
                                            children: user?.email || '—'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 79,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                color: '#bbb'
                                            },
                                            children: "Role"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 81,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 700
                                            },
                                            children: user?.role || '—'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 82,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                color: '#bbb'
                                            },
                                            children: "ID"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 84,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 12,
                                                color: '#999'
                                            },
                                            children: user?.id || '—'
                                        }, void 0, false, {
                                            fileName: "[project]/pages/profile.js",
                                            lineNumber: 85,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/profile.js",
                                    lineNumber: 74,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(RequestAccessForm, {
                                    userEmail: user?.email
                                }, void 0, false, {
                                    fileName: "[project]/pages/profile.js",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
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
                                children: "Edit profile"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 92,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: '#bbb',
                                    marginBottom: 10,
                                    fontSize: 13
                                },
                                children: "Update your display name or change your password using the form on this panel."
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 93,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(ProfileEditor, {
                                initialName: user?.name
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 70,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 18,
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
                        children: "Recent activity"
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(RecentActivityList, {}, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 98,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
function RecentActivityList() {
    // lightweight local sample; try server seed if available
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [fromCache, setFromCache] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const CACHE_KEY = 'seed_recent_activity';
    const MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes
    ;
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        let mounted = true;
        (async ()=>{
            setLoading(true);
            // try cache first
            try {
                const raw = localStorage.getItem(CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && parsed.items && parsed.ts) {
                        const age = Date.now() - parsed.ts;
                        if (age <= MAX_AGE_MS) {
                            if (mounted) {
                                setItems(parsed.items);
                                setFromCache(true);
                                setLoading(false);
                            }
                        }
                    }
                }
            } catch (e) {}
            // fetch fresh data in background with timeout
            const controller = new AbortController();
            const timeout = setTimeout(()=>controller.abort(), 6000);
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
                    },
                    signal: controller.signal
                });
                if (res.ok) {
                    const d = await res.json().catch(()=>null);
                    if (mounted) {
                        const recent = d?.recentActivity || [];
                        setItems(recent);
                        setFromCache(false);
                        try {
                            localStorage.setItem(CACHE_KEY, JSON.stringify({
                                items: recent,
                                ts: Date.now()
                            }));
                        } catch (e) {}
                    }
                } else if (mounted && !fromCache) {
                    setItems([
                        {
                            id: 'r1',
                            title: 'No recent server activity',
                            note: 'No items returned'
                        }
                    ]);
                }
            } catch (e) {
                // if aborted or network error and we don't have cache, show fallback
                if (mounted && !fromCache) setItems([
                    {
                        id: 'r2',
                        title: 'Local sample activity',
                        note: 'Nothing to show from server'
                    }
                ]);
            } finally{
                clearTimeout(timeout);
                if (mounted) setLoading(false);
            }
        })();
        return ()=>{
            mounted = false;
        };
    }, []);
    if (loading && !fromCache) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8
        },
        children: [
            1,
            2,
            3
        ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    height: 56,
                    borderRadius: 6,
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.02)'
                }
            }, n, false, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 162,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 160,
        columnNumber: 5
    }, this);
    if (!items || items.length === 0) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            color: '#888'
        },
        children: "No recent activity"
    }, void 0, false, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 166,
        columnNumber: 44
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 10
        },
        children: [
            fromCache && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: 12,
                    color: '#999'
                },
                children: "Showing cached activity — updating..."
            }, void 0, false, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 169,
                columnNumber: 21
            }, this),
            items.map((r, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        padding: 10,
                        border: '1px solid rgba(255,255,255,0.03)',
                        borderRadius: 6
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                fontWeight: 700
                            },
                            children: r.title || r.partner || r.title
                        }, void 0, false, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: 13,
                                color: '#bbb'
                            },
                            children: r.note || r.kind || ''
                        }, void 0, false, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 173,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: 12,
                                color: '#999',
                                marginTop: 6
                            },
                            children: r.date || ''
                        }, void 0, false, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 174,
                            columnNumber: 11
                        }, this)
                    ]
                }, r.id || i, true, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 171,
                    columnNumber: 9
                }, this))
        ]
    }, void 0, true, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 168,
        columnNumber: 5
    }, this);
}
function ProfileEditor({ initialName }) {
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(initialName || '');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [confirm, setConfirm] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    async function submit(e) {
        if (e && e.preventDefault) e.preventDefault();
        setMessage(null);
        if (password && password.length < 8) return setMessage({
            type: 'error',
            text: 'Password must be at least 8 characters'
        });
        if (password && password !== confirm) return setMessage({
            type: 'error',
            text: 'Password and confirmation do not match'
        });
        setLoading(true);
        try {
            const token = (()=>{
                try {
                    return localStorage.getItem('token');
                } catch (e) {
                    return null;
                }
            })();
            const body = {
                name: name || undefined
            };
            if (password) body.password = password;
            const res = await fetch('/api/auth/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...token ? {
                        Authorization: `Bearer ${token}`
                    } : {}
                },
                body: JSON.stringify(body)
            });
            const d = await res.json().catch(()=>null);
            if (!res.ok) throw new Error(d?.error || 'Update failed');
            setMessage({
                type: 'success',
                text: 'Profile updated'
            });
            setPassword('');
            setConfirm('');
        } catch (err) {
            setMessage({
                type: 'error',
                text: String(err.message || err)
            });
        } finally{
            setLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
        onSubmit: submit,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                display: 'grid',
                gap: 8
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                    style: {
                        fontSize: 12,
                        color: '#bbb'
                    },
                    children: "Display name"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 210,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                    className: "input",
                    value: name,
                    onChange: (e)=>setName(e.target.value),
                    placeholder: "Your name"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 211,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                    style: {
                        fontSize: 12,
                        color: '#bbb',
                        marginTop: 8
                    },
                    children: "New password"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 213,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                    className: "input",
                    type: "password",
                    value: password,
                    onChange: (e)=>setPassword(e.target.value),
                    placeholder: "Leave blank to keep current"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 214,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                    style: {
                        fontSize: 12,
                        color: '#bbb'
                    },
                    children: "Confirm password"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 216,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                    className: "input",
                    type: "password",
                    value: confirm,
                    onChange: (e)=>setConfirm(e.target.value),
                    placeholder: "Confirm new password"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 217,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'flex-end',
                        marginTop: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: "btn btn-ghost",
                            type: "button",
                            onClick: ()=>{
                                setName(initialName || '');
                                setPassword('');
                                setConfirm('');
                                setMessage(null);
                            },
                            children: "Reset"
                        }, void 0, false, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 220,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: "btn",
                            type: "submit",
                            disabled: loading,
                            children: loading ? 'Saving...' : 'Save changes'
                        }, void 0, false, {
                            fileName: "[project]/pages/profile.js",
                            lineNumber: 221,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 219,
                    columnNumber: 9
                }, this),
                message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        marginTop: 8,
                        color: message.type === 'error' ? '#ff8080' : 'var(--color-neon)'
                    },
                    children: message.text
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 224,
                    columnNumber: 21
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/pages/profile.js",
            lineNumber: 209,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 208,
        columnNumber: 5
    }, this);
}
function RequestAccessForm({ userEmail }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [scope, setScope] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('This partner only');
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    async function submit(e) {
        e && e.preventDefault && e.preventDefault();
        setMessage(null);
        if (!scope) return setMessage({
            type: 'error',
            text: 'Please choose a scope'
        });
        setLoading(true);
        try {
            const res = await fetch('/api/admin/request-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userEmail,
                    scope,
                    note
                })
            });
            const d = await res.json().catch(()=>null);
            if (!res.ok) throw new Error(d?.error || 'Request failed');
            setMessage({
                type: 'success',
                text: d?.message || 'Request sent'
            });
            setOpen(false);
            setNote('');
        } catch (err) {
            setMessage({
                type: 'error',
                text: String(err.message || err)
            });
        } finally{
            setLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            marginTop: 12
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    fontSize: 12,
                    color: '#bbb',
                    marginBottom: 8
                },
                children: "Need temporary, limited admin access for a specific task? Request it here."
            }, void 0, false, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 255,
                columnNumber: 7
            }, this),
            !open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: 8
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                    className: "btn btn-ghost",
                    onClick: ()=>setOpen(true),
                    children: "Request Temporary Access"
                }, void 0, false, {
                    fileName: "[project]/pages/profile.js",
                    lineNumber: 258,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 257,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: submit,
                style: {
                    display: 'grid',
                    gap: 8
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        style: {
                            fontSize: 12,
                            color: '#bbb'
                        },
                        children: "Scope"
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 262,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                        value: scope,
                        onChange: (e)=>setScope(e.target.value),
                        style: {
                            padding: 8,
                            borderRadius: 6,
                            background: '#0b0b0b',
                            color: '#eee',
                            border: '1px solid rgba(255,255,255,0.03)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                children: "This partner only"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 264,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                children: "This campaign only"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 265,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                children: "Specific tasks only"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 266,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 263,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        style: {
                            fontSize: 12,
                            color: '#bbb'
                        },
                        children: "Reason / details"
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 268,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                        value: note,
                        onChange: (e)=>setNote(e.target.value),
                        placeholder: "Why do you need temporary access?",
                        rows: 3,
                        style: {
                            padding: 8,
                            borderRadius: 6,
                            background: '#0b0b0b',
                            color: '#eee',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }
                    }, void 0, false, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn btn-ghost",
                                onClick: ()=>{
                                    setOpen(false);
                                    setNote('');
                                    setMessage(null);
                                },
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 271,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "submit",
                                disabled: loading,
                                children: loading ? 'Sending...' : 'Send request'
                            }, void 0, false, {
                                fileName: "[project]/pages/profile.js",
                                lineNumber: 272,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/profile.js",
                        lineNumber: 270,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 261,
                columnNumber: 9
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 8,
                    color: message.type === 'error' ? '#ff8080' : 'var(--color-neon)'
                },
                children: message.text
            }, void 0, false, {
                fileName: "[project]/pages/profile.js",
                lineNumber: 276,
                columnNumber: 19
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/profile.js",
        lineNumber: 254,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d9ae0ec0._.js.map