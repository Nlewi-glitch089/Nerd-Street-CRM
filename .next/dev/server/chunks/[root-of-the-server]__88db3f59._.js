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
"[project]/pages/api/analytics.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
let prisma;
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma) {
    /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma = new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]();
}
prisma = /*TURBOPACK member replacement*/ __turbopack_context__.g.__prisma;
async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({
        error: 'Method not allowed'
    });
    try {
        const totalDonors = await prisma.donor.count();
        const totalDonations = await prisma.donation.findMany();
        const totalRevenue = totalDonations.reduce((s, d)=>s + (Number(d.amount || 0) || 0), 0);
        // helper to detect gift-like donations (notes may include 'gift')
        const isGift = (d)=>{
            try {
                const m = String(d.method || '').toLowerCase();
                const n = String(d.notes || '').toLowerCase();
                return /gift/.test(m) || /gift/.test(n);
            } catch (e) {
                return false;
            }
        };
        // per-campaign totals
        const campaigns = await prisma.campaign.findMany({
            include: {
                donations: true
            }
        });
        const campaignStats = campaigns.map((c)=>{
            const raised = c.donations.reduce((s, d)=>s + (Number(d.amount || 0) || 0), 0);
            const gifted = c.donations.filter(isGift).reduce((s, d)=>s + (Number(d.amount || 0) || 0), 0);
            return {
                id: c.id,
                name: c.name,
                goal: c.goal,
                raised,
                gifted
            };
        });
        // per-donor totals and frequency
        const donors = await prisma.donor.findMany({
            include: {
                donations: true
            }
        });
        const donorStats = donors.map((d)=>{
            const totalGiving = d.donations.reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
            const giftedTotal = d.donations.filter(isGift).reduce((s, x)=>s + (Number(x.amount || 0) || 0), 0);
            return {
                id: d.id,
                name: `${d.firstName} ${d.lastName || ''}`.trim(),
                email: d.email,
                totalGiving,
                giftedTotal,
                gifts: d.donations.length,
                lastGiftAt: d.lastGiftAt
            };
        });
        return res.status(200).json({
            totalDonors,
            totalRevenue,
            campaignStats,
            donorStats
        });
    } catch (err) {
        console.error('Analytics API error', err);
        return res.status(500).json({
            error: 'Failed to compute analytics'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__88db3f59._.js.map