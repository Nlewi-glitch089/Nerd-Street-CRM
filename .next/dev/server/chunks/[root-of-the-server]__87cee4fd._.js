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
"[externals]/bcryptjs [external] (bcryptjs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("bcryptjs", () => require("bcryptjs"));

module.exports = mod;
}),
"[project]/pages/api/auth/signup.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/bcryptjs [external] (bcryptjs, cjs)");
;
;
// create a singleton Prisma client in dev to avoid hot-reload connection issues
let prisma;
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
}
prisma = /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma;
async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({
        error: 'Method not allowed'
    });
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({
        error: 'Missing name, email or password'
    });
    // basic validation
    const emailNorm = String(email || '').trim().toLowerCase();
    const passwordStr = String(password || '');
    // require corporate domain
    const allowedDomain = '@nerdstgamers.com';
    const localPartPattern = /^[a-z0-9._-]+$/;
    if (!emailNorm.endsWith(allowedDomain) || !localPartPattern.test(emailNorm.slice(0, -allowedDomain.length))) {
        return res.status(400).json({
            error: `Email must be like name${allowedDomain} (only letters, numbers, dot, underscore or hyphen in the local part)`
        });
    }
    if (passwordStr.length < 8) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters'
        });
    }
    // Do NOT allow clients to create ADMIN accounts via signup.
    // All signups are created as TEAM_MEMBER. Admins must be created/managed by existing admins.
    const roleNorm = 'TEAM_MEMBER';
    try {
        // split name into first/last
        const [firstName, ...rest] = name.trim().split(' ');
        const lastName = rest.length ? rest.join(' ') : null;
        // hash password before storing
        const hashed = await __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__cjs$29$__["default"].hash(passwordStr, 10);
        const user = await prisma.user.create({
            data: {
                name: String(name).trim(),
                email: emailNorm,
                password: hashed,
                role: roleNorm
            }
        });
        return res.status(201).json({
            ok: true,
            id: user.id
        });
    } catch (err) {
        // Prisma unique constraint error handling
        const message = err?.meta?.target ? `A record already exists for: ${err.meta.target}` : err.message;
        return res.status(500).json({
            error: message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__87cee4fd._.js.map