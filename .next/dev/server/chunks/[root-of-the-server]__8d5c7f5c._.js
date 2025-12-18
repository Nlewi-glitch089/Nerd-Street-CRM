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
"[project]/pages/api/users/[id]/role.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.js [api] (ecmascript)");
;
;
let prisma;
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
}
prisma = /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma;
async function handler(req, res) {
    const { id } = req.query;
    if (req.method !== 'POST') return res.status(405).json({
        error: 'Method not allowed'
    });
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({
        error: 'Missing authorization token'
    });
    const actor = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__["getUserFromToken"])(token);
    if (!actor) return res.status(401).json({
        error: 'Invalid token'
    });
    if (actor.role !== 'ADMIN') return res.status(403).json({
        error: 'Admin required'
    });
    const { role } = req.body || {};
    if (!role || ![
        'ADMIN',
        'TEAM_MEMBER'
    ].includes(role)) return res.status(400).json({
        error: 'Invalid role'
    });
    try {
        const user = await prisma.user.update({
            where: {
                id
            },
            data: {
                role
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        return res.status(200).json({
            ok: true,
            user
        });
    } catch (err) {
        console.error('Update role error', err);
        return res.status(500).json({
            error: 'Failed to update role'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8d5c7f5c._.js.map