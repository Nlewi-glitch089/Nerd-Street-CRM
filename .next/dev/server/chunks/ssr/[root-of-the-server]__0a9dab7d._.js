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
"[project]/pages/index.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
;
;
;
function Home() {
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('signin') // 'signin' | 'signup'
    ;
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [fullName, setFullName] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('TEAM_MEMBER');
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    async function handleSignUp(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        setMessage(null);
        if (!email || !password || !fullName) {
            setMessage({
                type: 'error',
                text: 'Please provide name, email and password.'
            });
            return;
        }
        const emailNorm = String(email || '').trim().toLowerCase();
        // require corporate domain and safe local-part
        const allowedDomain = '@nerdstgamers.com';
        const localPartPattern = /^[a-z0-9._-]+$/;
        if (!emailNorm.endsWith(allowedDomain) || !localPartPattern.test(emailNorm.slice(0, -allowedDomain.length))) {
            setMessage({
                type: 'error',
                text: `Please use an email like name${allowedDomain} (letters, numbers, dot, underscore or hyphen allowed).`
            });
            return;
        }
        if (String(password).length < 8) {
            setMessage({
                type: 'error',
                text: 'Password must be at least 8 characters.'
            });
            return;
        }
        setLoading(true);
        try {
            // always create TEAM_MEMBER via public signup
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: fullName,
                    email: emailNorm,
                    password,
                    role: 'TEAM_MEMBER'
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Signup failed');
            setMessage({
                type: 'success',
                text: 'Account created. You can now sign in.'
            });
            // Optionally switch to sign-in mode
            setMode('signin');
            setFullName('');
            setPassword('');
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.message
            });
        } finally{
            setLoading(false);
        }
    }
    function handleSignIn(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        setMessage(null);
        if (!email || !password) {
            setMessage({
                type: 'error',
                text: 'Please provide email and password.'
            });
            return;
        }
        setLoading(true);
        (async ()=>{
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data?.error || 'Login failed');
                const token = data.token;
                // store token locally for subsequent requests (replace with cookie for production)
                try {
                    localStorage.setItem('token', token);
                } catch (e) {}
                // verify protected endpoint
                const p = await fetch('/api/protected', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const pd = await p.json();
                if (!p.ok) throw new Error(pd?.error || 'Protected check failed');
                // set user state so UI reflects logged-in status
                setUser(pd.user || null);
                const role = pd.user?.role || 'TEAM_MEMBER';
                const roleLabel = role === 'ADMIN' ? 'Admin' : 'Team member';
                // show a role-specific success + loading message so user sees which dashboard will load
                setMessage({
                    type: 'success',
                    text: `Successfully signed in as ${roleLabel}. Loading ${roleLabel} dashboard...`
                });
                // give the user a moment (3.5s) to read the confirmation before navigating
                try {
                    await new Promise((r)=>setTimeout(r, 3500));
                } catch (e) {}
                if (role === 'ADMIN') await router.push('/admin');
                else await router.push('/team');
            } catch (err) {
                setMessage({
                    type: 'error',
                    text: err.message
                });
            } finally{
                setLoading(false);
            }
        })();
    }
    const signupFormRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const signinFormRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    function topSignUpClick() {
        if (mode !== 'signup') {
            setMode('signup');
            setMessage(null);
            return;
        }
        // if already in signup mode, submit the signup form
        if (signupFormRef.current) signupFormRef.current.requestSubmit();
    }
    function topSignInClick() {
        if (mode !== 'signin') {
            setMode('signin');
            setMessage(null);
            return;
        }
        if (signinFormRef.current) signinFormRef.current.requestSubmit();
    }
    // check for existing token on mount and validate it
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
                if (!token) return;
                const res = await fetch('/api/protected', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    // invalid token, clear
                    try {
                        localStorage.removeItem('token');
                    } catch (e) {}
                    return;
                }
                const data = await res.json();
                if (mounted) setUser(data.user || null);
                // if the session belongs to an admin, redirect to admin dashboard
                if (data?.user?.role === 'ADMIN') {
                    try {
                        router.push('/admin');
                    } catch (e) {}
                }
            } catch (err) {
                try {
                    localStorage.removeItem('token');
                } catch (e) {}
            }
        })();
        return ()=>{
            mounted = false;
        };
    }, []);
    function handleSignOut() {
        try {
            localStorage.removeItem('token');
        } catch (e) {}
        setUser(null);
        setMessage({
            type: 'success',
            text: 'Signed out'
        });
        // optionally reset other form state
        setEmail('');
        setPassword('');
        setMode('signin');
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
        className: "page",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "card auth-card",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                    className: "title",
                    children: "Nerd Street CRM"
                }, void 0, false, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 160,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    className: "subtitle",
                    children: "Secure donor management for small nonprofits"
                }, void 0, false, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 161,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        display: 'flex',
                        gap: 8,
                        justifyContent: 'center',
                        marginBottom: 12
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: `btn ${mode === 'signin' ? 'btn-primary' : 'btn-ghost'}`,
                            onClick: topSignInClick,
                            children: "Sign In"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 164,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            className: `btn ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`,
                            onClick: topSignUpClick,
                            children: "Sign Up"
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 163,
                    columnNumber: 9
                }, this),
                user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        textAlign: 'center'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            style: {
                                marginBottom: 12
                            },
                            children: [
                                "Welcome, ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                    children: user.name || user.email
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 180,
                                    columnNumber: 51
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 180,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "actions",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "btn btn-ghost",
                                onClick: handleSignOut,
                                children: "Sign out"
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 182,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 181,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 179,
                    columnNumber: 11
                }, this) : mode === 'signup' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                    ref: signupFormRef,
                    onSubmit: handleSignUp,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "field",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    className: "label",
                                    children: "Full name"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 188,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    value: fullName,
                                    onChange: (e)=>setFullName(e.target.value),
                                    placeholder: "John Doe",
                                    autoComplete: "name"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 189,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 187,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "field",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    className: "label",
                                    children: "Email"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 193,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    value: email,
                                    onChange: (e)=>setEmail(e.target.value),
                                    placeholder: "name@nerdstgamers.com",
                                    autoComplete: "email"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 194,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 192,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "field",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    className: "label",
                                    children: "Password"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 198,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    value: password,
                                    onChange: (e)=>setPassword(e.target.value),
                                    type: "password",
                                    placeholder: "••••••••",
                                    autoComplete: "new-password"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 199,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 197,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "actions",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "btn btn-primary",
                                type: "submit",
                                disabled: loading,
                                children: loading ? 'Creating...' : 'Sign Up'
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 205,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 204,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 186,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                    ref: signinFormRef,
                    onSubmit: handleSignIn,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "field",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    className: "label",
                                    children: "Email"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 211,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    value: email,
                                    onChange: (e)=>setEmail(e.target.value),
                                    placeholder: "name@nerdstgamers.com",
                                    autoComplete: "email"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 212,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 210,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "field",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                    className: "label",
                                    children: "Password"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 216,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    className: "input",
                                    value: password,
                                    onChange: (e)=>setPassword(e.target.value),
                                    type: "password",
                                    placeholder: "••••••••",
                                    autoComplete: "current-password"
                                }, void 0, false, {
                                    fileName: "[project]/pages/index.js",
                                    lineNumber: 217,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 215,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "actions",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                className: "btn btn-primary",
                                type: "submit",
                                disabled: loading,
                                children: loading ? 'Signing in...' : 'Sign In'
                            }, void 0, false, {
                                fileName: "[project]/pages/index.js",
                                lineNumber: 221,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/pages/index.js",
                            lineNumber: 220,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 209,
                    columnNumber: 11
                }, this),
                message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    style: {
                        marginTop: 12,
                        textAlign: 'center',
                        color: message.type === 'error' ? '#ff8080' : message.type === 'success' ? 'var(--color-neon)' : 'var(--color-gray)'
                    },
                    children: message.text
                }, void 0, false, {
                    fileName: "[project]/pages/index.js",
                    lineNumber: 227,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/pages/index.js",
            lineNumber: 159,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/pages/index.js",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0a9dab7d._.js.map