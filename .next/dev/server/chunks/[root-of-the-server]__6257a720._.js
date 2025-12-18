module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsonwebtoken", () => require("jsonwebtoken"));

module.exports = mod;
}),
"[project]/lib/auth.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUserFromToken",
    ()=>getUserFromToken,
    "signToken",
    ()=>signToken,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
const prisma = /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma) /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma = prisma;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';
function signToken(payload) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["default"].sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["default"].verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}
async function getUserFromToken(token) {
    const data = verifyToken(token);
    if (!data || !data.userId) return null;
    const user = await prisma.user.findUnique({
        where: {
            id: data.userId
        }
    });
    return user;
}
}),
"[externals]/bcryptjs [external] (bcryptjs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bcryptjs", () => require("bcryptjs"));

module.exports = mod;
}),
"[project]/pages/api/auth/login.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/bcryptjs [external] (bcryptjs, cjs)");
;
;
;
let prisma;
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
}
prisma = /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma;
async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({
        error: 'Method not allowed'
    });
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({
        error: 'Missing email or password'
    });
    const emailNorm = String(email || '').trim().toLowerCase();
    try {
        // normalize email to match how users are stored at signup
        let user = await prisma.user.findUnique({
            where: {
                email: emailNorm
            }
        });
        if (!user) {
            // Attempt a case-insensitive lookup to support legacy accounts
            try {
                user = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: emailNorm,
                            mode: 'insensitive'
                        }
                    }
                });
                if (user) console.warn('Login: matched user with case-insensitive email lookup for', emailNorm);
            } catch (e) {
                // Some Prisma adapters or older versions may not support `mode: 'insensitive'`.
                // Fall back to a broader contains search as a last resort (non-exact).
                try {
                    user = await prisma.user.findFirst({
                        where: {
                            email: {
                                contains: emailNorm
                            }
                        }
                    });
                    if (user) console.warn('Login: matched user using fallback contains lookup for', emailNorm);
                } catch (e2) {
                // ignore and proceed to invalid credentials response
                }
            }
        }
        if (!user) return res.status(401).json({
            error: 'Invalid credentials'
        });
        const stored = String(user.password || '');
        let ok = false;
        // if stored password looks like a bcrypt hash, compare with bcrypt
        if (/^\$2[aby]\$/.test(stored)) {
            ok = await __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__cjs$29$__["default"].compare(password, stored);
        } else {
            // legacy plaintext password - compare directly
            if (stored === password) {
                ok = true;
                // re-hash and update the stored password so future logins use bcrypt
                try {
                    const hashed = await __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__cjs$29$__["default"].hash(password, 10);
                    await prisma.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            password: hashed
                        }
                    });
                } catch (e) {
                    console.warn('Failed to re-hash legacy password for', user.email, e);
                }
            }
        }
        if (!ok) {
            console.warn('Login failed for', emailNorm);
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__["signToken"])({
            userId: user.id,
            email: user.email
        });
        return res.status(201).json({
            ok: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6257a720._.js.map