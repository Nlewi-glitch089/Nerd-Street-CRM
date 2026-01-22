import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  console.debug('Seed handler invoked, method=', req.method)
  let phase = 'start'
  // Support GET for a read-only preview of the seed/payload (no DB writes).
  if (req.method === 'GET') {
    try {
      console.debug('Seed (GET) starting DB reads')
      try { await prisma.$connect() } catch (connErr) { console.error('Prisma connection error (GET seed)', connErr); return res.status(500).json({ error: 'Database connection failed', details: String(connErr && connErr.message ? connErr.message : connErr), phase: 'connect-get' }) }
      // Build read-only payload from DB similar to POST's final payload
      const totalDonors = await prisma.donor.count()
      // Exclude donations from inactive/soft-deleted donors so preview reflects deletions
      const allDonations = await prisma.donation.findMany({ where: { donor: { active: true } } })
      const totalRevenue = allDonations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      const campaignsWithDonations = await prisma.campaigns.findMany({
        select: {
          id: true,
          name: true,
          goal: true,
          approved: true,
          active: true,
          createdAt: true,
          donations: { where: { donor: { active: true } }, select: { id: true, amount: true, date: true, donorId: true, method: true, notes: true } }
        }
      })
      const campaignStats = campaignsWithDonations.map(c => {
        const raised = c.donations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
        const gifted = c.donations.filter(d=>{ try { const m=String(d.method||'').toLowerCase(); const n=String(d.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) } catch(e){return false} }).reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
        return { id: c.id, name: c.name, goal: c.goal, raised, gifted }
      })
      const donorsWithDonations = await prisma.donor.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, lastGiftAt: true, donations: { select: { id: true, amount: true, date: true, method: true, notes: true, campaignId: true } } }
      })
      const donorStats = donorsWithDonations.map(d => ({ id: d.id, name: `${d.firstName} ${d.lastName||''}`.trim(), email: d.email, totalGiving: d.donations.reduce((s,x)=>s + (Number(x.amount||0) || 0), 0), giftedTotal: d.donations.filter(dd=>{ try{ const m=String(dd.method||'').toLowerCase(); const n=String(dd.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) }catch(e){return false} }).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0), gifts: d.donations.length, lastGiftAt: d.lastGiftAt }))

      const metricsPayload = [
        { title: 'Total Partners', value: '4', sub: '2 active' },
        { title: 'Active Programs', value: String((campaignStats && campaignStats.length) || 0), sub: 'Running programs' },
        { title: 'Total Revenue', value: '$' + ((totalRevenue && totalRevenue.toLocaleString) ? totalRevenue.toLocaleString() : String(totalRevenue || 0)), sub: 'From all programs' },
        { title: 'Total Donors', value: String(totalDonors || 0), sub: 'Individuals who gave' },
        { title: 'Team Reminders', value: '0', sub: 'Action items pending' }
      ]

      const payload = {
        metrics: metricsPayload,
        partners: [],
        donors: [],
        campaigns: [],
        recentActivity: [],
        alerts: [],
        tasks: [],
        followUps: [],
        analytics: { totalDonors, totalRevenue, campaignStats, donorStats }
      }

      return res.status(200).json(payload)
    } catch (err) {
      console.error('Seed (GET) error', err)
      return res.status(500).json({ error: 'Seed preview failed', details: String(err && err.message ? err.message : err) })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    console.debug('Seed (POST) starting')
    phase = 'connect'
    // quick DB connectivity check
    try {
      await prisma.$connect()
    } catch (connErr) {
      console.error('Prisma connection error', connErr)
      return res.status(500).json({ error: 'Database connection failed', details: String(connErr && connErr.message ? connErr.message : connErr) })
    }
    // create sample campaigns from provided list; use findFirst/create to avoid upsert on non-unique fields
    const desiredCampaigns = [
      { name: 'Back-to-School Supply Drive', goal: 15000 },
      { name: 'Summer Youth Programs Fund', goal: 40000 },
      { name: 'Neighborhood Health Initiative', goal: 25000 },
      { name: 'Technology Access Campaign', goal: 60000 },
      { name: 'Holiday Giving Drive 2025', goal: 90000 }
    ]
    const campaignsByName = {}
    const approvedCampaignNames = new Set(['Back-to-School Supply Drive', 'Summer Youth Programs Fund', 'Holiday Giving Drive 2025'])
    for (const cd of desiredCampaigns) {
      try {
        phase = `ensure-campaign:${cd.name}`
        console.debug('Ensuring campaign exists:', cd.name)
        let c = await prisma.campaigns.findFirst({ where: { name: cd.name } })
        if (!c) {
          c = await prisma.campaigns.create({ data: { name: cd.name, goal: cd.goal, approved: approvedCampaignNames.has(cd.name) } })
        } else {
          // ensure existing campaigns that should be approved are marked approved
          if (approvedCampaignNames.has(cd.name) && !c.approved) {
            try {
              c = await prisma.campaigns.update({ where: { id: c.id }, data: { approved: true } })
            } catch (uerr) {
              console.warn('Failed to update campaign approved flag for', cd.name, uerr)
            }
          }
        }
        campaignsByName[cd.name] = c
      } catch (e) {
        console.warn('Failed to ensure campaign', cd.name, e)
      }
    }
    // preserve variables used later in donation creation for backward compatibility
    const campaign1 = campaignsByName['Back-to-School Supply Drive']
    const campaign2 = campaignsByName['Summer Youth Programs Fund']
    const campaignHoliday = campaignsByName['Holiday Giving Drive 2025']

    // create sample donors
    // helper for relative dates so seeded data can be consistent across runs
    const now = Date.now()
    const days = (n) => new Date(now - (n * 24 * 60 * 60 * 1000))

    let donor1
    try {
      phase = 'upsert-donor1'
      donor1 = await prisma.donor.upsert({
      where: { email: 'nate.marshall@example.com' },
      update: {},
      create: { firstName: 'Nate', lastName: 'Marshall', email: 'nate.marshall@example.com', totalGiving: 12500, lastGiftAt: days(10) }
    })
    } catch (e) { console.error('Failed to upsert donor1', e); throw e }

    let donor2
    try {
      phase = 'upsert-donor2'
      donor2 = await prisma.donor.upsert({
      where: { email: 'evelyn.hart@example.com' },
      update: {},
      create: { firstName: 'Evelyn', lastName: 'Hart', email: 'evelyn.hart@example.com', totalGiving: 4200, lastGiftAt: days(5) }
    })
    } catch (e) { console.error('Failed to upsert donor2', e); throw e }

    // create additional sample donors (to ensure /admin/donors shows a fuller list)
    // reuse `days` helper defined earlier above
    const extraDonorsData = [
      { firstName: 'Ava', lastName: 'Chen', email: 'ava.chen@example.com', totalGiving: 1200, lastGiftAt: days(5) },    // active
      { firstName: 'Liam', lastName: 'Smith', email: 'liam.smith@example.com', totalGiving: 500, lastGiftAt: days(10) },  // active
      { firstName: 'Olivia', lastName: 'Garcia', email: 'olivia.garcia@example.com', totalGiving: 300, lastGiftAt: days(15) }, // active
      { firstName: 'Noah', lastName: 'Johnson', email: 'noah.johnson@example.com', totalGiving: 0, lastGiftAt: days(2) },     // active (was no gifts)
      { firstName: 'Sophia', lastName: 'Martinez', email: 'sophia.martinez@example.com', totalGiving: 750, lastGiftAt: days(35) }, // inactive (35d)
      { firstName: 'Mason', lastName: 'Brown', email: 'mason.brown@example.com', totalGiving: 2500, lastGiftAt: days(60) }, // inactive (60d)
      { firstName: 'Isabella', lastName: 'Davis', email: 'isabella.davis@example.com', totalGiving: 0, lastGiftAt: null }, // no gifts
      { firstName: 'Ethan', lastName: 'Wilson', email: 'ethan.wilson@example.com', totalGiving: 1500, lastGiftAt: days(7) } // active
    ]
    const extraDonors = []
    for (const d of extraDonorsData) {
      try {
        phase = `upsert-extra-donor:${d.email}`
        const up = await prisma.donor.upsert({ where: { email: d.email }, update: {}, create: { firstName: d.firstName, lastName: d.lastName, email: d.email, totalGiving: d.totalGiving || 0, lastGiftAt: d.lastGiftAt || null } })
        extraDonors.push(up)
      } catch (e) {
        console.warn('Failed to upsert extra donor', d.email, e)
      }
    }
    try {
      const seededPasswordHash = await bcrypt.hash('password123', 10)
      const adminUser = await prisma.user.upsert({
          where: { email: 'rob.admin@example.com' },
          update: {},
          create: { name: 'Rob Admin', email: 'rob.admin@example.com', password: seededPasswordHash, role: 'ADMIN' }
      })
      const nick = await prisma.user.upsert({
          where: { email: 'nick.team@example.com' },
          update: {},
          create: { name: 'Nick Thompson', email: 'nick.team@example.com', password: seededPasswordHash, role: 'TEAM_MEMBER' }
      })
      const matt = await prisma.user.upsert({
          where: { email: 'matt.team@example.com' },
          update: {},
          create: { name: 'Matt Lane', email: 'matt.team@example.com', password: seededPasswordHash, role: 'TEAM_MEMBER' }
      })
    } catch (e) {
      console.error('Failed to upsert seeded users', e)
      throw e
    }
    // create donations (omit `notes` because DonationCreateManyInput doesn't include it in schema)
    // IMPORTANT: make donation seeding idempotent. If donations already exist in the DB,
    // skip inserting the sample donations so repeated runs of this endpoint don't
    // keep inflating `totalRevenue` by inserting duplicates.
    const existingDonationsCount = await prisma.donation.count()
    if (existingDonationsCount === 0) {
      // build donation rows and filter out any entries that reference missing donor or campaign ids
      const rawDonationData = [
        { donorId: donor1?.id, amount: 7500, campaignId: campaign1?.id, date: new Date('2025-03-03'), method: 'GIFT' },
        { donorId: donor1?.id, amount: 5000, campaignId: campaign1?.id, date: new Date('2025-02-20'), method: 'CARD' },
        { donorId: donor1?.id, amount: 2500, campaignId: campaign1?.id, date: new Date('2025-03-10'), method: 'CARD' },
        { donorId: donor1?.id, amount: 40000, campaignId: campaignHoliday?.id, date: new Date('2025-12-01'), method: 'CARD' },
        { donorId: donor2?.id, amount: 200, campaignId: campaign2?.id, date: new Date('2025-01-12'), method: 'GIFT' },
        { donorId: donor2?.id, amount: 4000, campaignId: campaign2?.id, date: new Date('2024-12-18'), method: 'CHECK' },
        { donorId: extraDonors[0]?.id, amount: 1200, campaignId: campaign1?.id, date: new Date('2025-11-01'), method: 'CARD' },
        { donorId: extraDonors[1]?.id, amount: 500, campaignId: campaign2?.id, date: new Date('2025-09-18'), method: 'CARD' },
        { donorId: extraDonors[2]?.id, amount: 300, campaignId: campaign2?.id, date: new Date('2025-08-10'), method: 'CHECK' },
        { donorId: extraDonors[4]?.id, amount: 750, campaignId: campaign1?.id, date: new Date('2025-07-04'), method: 'CARD' },
        { donorId: extraDonors[5]?.id, amount: 2500, campaignId: campaign1?.id, date: new Date('2025-06-21'), method: 'CARD' },
        { donorId: extraDonors[7]?.id, amount: 1500, campaignId: campaign2?.id, date: new Date('2025-05-30'), method: 'CARD' }
      ]

      // Keep only rows that have both donorId and campaignId present (required by schema)
      const donationData = rawDonationData.filter(d => d && d.donorId && d.campaignId)

      if (donationData.length === 0) {
        console.log('Seed: no valid donation rows to insert (missing donor or campaign ids)')
      } else {
        try {
          await prisma.donation.createMany({ data: donationData, skipDuplicates: true })
        } catch (e) {
          // createMany failed; log details and try per-item create to surface the problematic row
          console.error('Seed: createMany donations failed', e)
          for (const row of donationData) {
            try {
              await prisma.donation.create({ data: row })
            } catch (singleErr) {
              console.error('Seed: failed to create donation row', { row, error: singleErr && (singleErr.stack || singleErr.message || String(singleErr)) })
            }
          }
        }
      }
    } else {
      console.log('Seed: donations already exist (count=' + existingDonationsCount + '), skipping donation creation to avoid duplicates')
    }

    // Ensure approved campaigns have at least one donation so they appear as "earning" in the UI.
    try {
      for (const name of approvedCampaignNames) {
        const c = campaignsByName[name]
        if (!c) continue
        const donationsForCampaign = await prisma.donation.count({ where: { campaignId: c.id } })
        if ((donationsForCampaign || 0) === 0) {
          // create a small sample donation to mark the campaign as earning
          const sampleDonor = donor1 || extraDonors[0]
          if (sampleDonor) {
            try {
              await prisma.donation.create({ data: { donorId: sampleDonor.id, amount: 5000, campaignId: c.id, date: new Date(), method: 'CARD' } })
              console.log('Seed: created sample donation for approved campaign', name)
            } catch (e) {
              console.warn('Seed: failed to create sample donation for', name, e)
            }
          }
        }
      }
    } catch (e) {
      console.warn('Seed: error ensuring donations for approved campaigns', e)
    }

    // Ensure Holiday Giving Drive 2025 has a boost donation for better revenue display (idempotent)
    try {
      if (campaignHoliday && campaignHoliday.id) {
        const boostExists = await prisma.donation.findFirst({ where: { campaignId: campaignHoliday.id, method: 'SEED-BOOST' } })
        if (!boostExists) {
          const booster = donor1 || extraDonors[0]
          if (booster) {
            try {
              await prisma.donation.create({ data: { donorId: booster.id, amount: 40000, campaignId: campaignHoliday.id, date: new Date('2025-12-01'), method: 'SEED-BOOST' } })
              console.log('Seed: created boost donation for Holiday Giving Drive 2025')
            } catch (e) { console.warn('Seed: failed to create boost donation', e) }
          }
        }
      }
    } catch (e) { console.warn('Seed: boost donation check failed', e) }

    // Recalculate donor totals and lastGiftAt based on seeded donations so DB reflects actual totals
    try {
      const donor1Agg = await prisma.donation.aggregate({ where: { donorId: donor1.id }, _sum: { amount: true }, _max: { date: true } })
      const donor2Agg = await prisma.donation.aggregate({ where: { donorId: donor2.id }, _sum: { amount: true }, _max: { date: true } })
      const d1Total = donor1Agg._sum.amount || 0
      const d1Last = donor1Agg._max.date || null
      const d2Total = donor2Agg._sum.amount || 0
      const d2Last = donor2Agg._max.date || null

      await prisma.donor.update({ where: { id: donor1.id }, data: { totalGiving: d1Total, lastGiftAt: d1Last } })
      await prisma.donor.update({ where: { id: donor2.id }, data: { totalGiving: d2Total, lastGiftAt: d2Last } })
    } catch (e) {
      console.warn('Failed to update donor aggregates after seeding', e)
    }

      // build live analytics payload from DB so client sees accurate totals immediately
      const totalDonors = await prisma.donor.count()
      const allDonations = await prisma.donation.findMany()
      const totalRevenue = allDonations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      const campaignsWithDonations = await prisma.campaigns.findMany({
        select: {
          id: true,
          name: true,
          goal: true,
          approved: true,
          active: true,
          createdAt: true,
          donations: { select: { id: true, amount: true, date: true, donorId: true, method: true, notes: true } }
        }
      })
      const campaignStats = campaignsWithDonations.map(c => {
        const raised = c.donations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
        const gifted = c.donations.filter(d=>{ try { const m=String(d.method||'').toLowerCase(); const n=String(d.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) } catch(e){return false} }).reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
        return { id: c.id, name: c.name, goal: c.goal, raised, gifted }
      })
      const donorsWithDonations = await prisma.donor.findMany({
        select: { id: true, firstName: true, lastName: true, email: true, lastGiftAt: true, donations: { select: { id: true, amount: true, date: true, method: true, notes: true, campaignId: true } } }
      })
      const donorStats = donorsWithDonations.map(d => ({ id: d.id, name: `${d.firstName} ${d.lastName||''}`.trim(), email: d.email, totalGiving: d.donations.reduce((s,x)=>s + (Number(x.amount||0) || 0), 0), giftedTotal: d.donations.filter(dd=>{ try{ const m=String(dd.method||'').toLowerCase(); const n=String(dd.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) }catch(e){return false} }).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0), gifts: d.donations.length, lastGiftAt: d.lastGiftAt }))
    // Prepare response payload (UI partners are still client-only)
    // build metrics payload derived from the DB so UI shows accurate totals
    const metricsPayload = [
      { title: 'Total Partners', value: '4', sub: '2 active' },
      { title: 'Active Programs', value: String((campaignStats && campaignStats.length) || 0), sub: 'Running programs' },
      { title: 'Total Revenue', value: '$' + ((totalRevenue && totalRevenue.toLocaleString) ? totalRevenue.toLocaleString() : String(totalRevenue || 0)), sub: 'From all programs' },
      { title: 'Total Donors', value: String(totalDonors || 0), sub: 'Individuals who gave' },
      { title: 'Team Reminders', value: '0', sub: 'Action items pending' }
    ]

    // derive some team tasks and follow-ups so the Team page shows relevant items
    const tasksSeed = [
      { id: 't1', title: 'Follow up with Alienware', due: '2025-12-14', note: 'Send co-marketing proposal and content calendar' },
      { id: 't2', title: 'Reach out to Red Bull Gaming', due: '2025-12-19', note: 'Discuss 2025 renewal terms' }
    ]
    const followUpsSeed = (campaignsWithDonations || []).slice(0,3).map((c, i) => ({ id: `f${i+1}`, campaign: { id: c.id, name: c.name }, days: (i+1) * 30 }))

    // Enrich follow-ups to reflect assigned campaign role and supporting team members
    const enrichedFollowUps = followUpsSeed.map((f, idx) => {
      const supports = [
        { name: 'Nick Thompson', role: 'Field Lead', email: 'nick.team@example.com' },
        { name: 'Matt Lane', role: 'Activation Support', email: 'matt.team@example.com' }
      ]
      // assign primary support depending on index (simple rotation)
      return {
        id: f.id,
        campaign: f.campaign,
        days: f.days,
        assignedRole: idx === 0 ? 'Campaign Lead' : 'Support',
        support: idx === 0 ? [supports[0], supports[1]] : [supports[1]],
        note: idx === 0 ? 'Oversee campaign deliverables and coordinate sponsors' : 'Support activation and logistics'
      }
    })

    const payload = {
      metrics: metricsPayload,
      partners: [
        {
          name: 'GameStop',
          tag: 'At Risk',
          health: '45%',
          owners: ['nick.team@example.com'],
          description: 'Retail partner with e-commerce and in-store activations',
          contractValue: '$120,000',
          startDate: '2024-03-01',
          endDate: '2024-12-31',
          lastContact: '2025-11-01',
          contacts: [ { name: 'Jordan Lee', title: 'Sponsorship Lead', email: 'jordan.lee@gamestop.com', phone: '555-0102' } ],
          interactions: [
            { id: 'i1', type: 'Email', date: '2025-11-01', note: 'Left proposal for holiday event' },
            { id: 'i1b', type: 'Call', date: '2025-12-05', note: 'Discussed in-store activation logistics for holiday weekend' }
          ],
          programs: [],
          reminders: [ { id: 'r-gs-1', title: 'Holiday activation follow-up', due: '2025-12-10', note: 'Confirm in-store setup and co-marketing materials' } ]
        },
        {
          name: 'Discord',
          tag: 'Pending',
          health: '70%',
          owners: ['nick.team@example.com','matt.team@example.com'],
          description: 'Community platform partner – integration and co-streaming opportunities',
          contractValue: '$75,000',
          startDate: '2024-06-01',
          endDate: '2025-06-01',
          lastContact: '2025-11-28',
          contacts: [ { name: 'Ava Reed', title: 'Partnerships', email: 'ava.reed@discord.com', phone: '555-0199' } ],
          interactions: [ { id: 'i2', type: 'Call', date: '2025-11-28', note: 'Sent proposal draft' }, { id: 'i2b', type: 'Email', date: '2025-12-02', note: 'Requested technical integration specs' } ],
          programs: [],
          reminders: [ { id: 'r-dis-1', title: 'Integration specs follow-up', due: '2025-12-08', note: 'Confirm API access and streaming integration windows' } ]
        },
        {
          name: 'Alienware',
          tag: 'Active',
          health: '85%',
          owners: ['nick.team@example.com'],
          description: 'Hardware sponsor for local venues and events',
          contractValue: '$250,000',
          startDate: '2024-02-01',
          endDate: '2025-02-01',
          lastContact: '2025-12-07',
          contacts: [ { name: 'Sam Patel', title: 'Regional Account Manager', email: 'sam.patel@alienware.com', phone: '555-0144' } ],
          interactions: [ { id: 'i3', type: 'Email', date: '2025-12-07', note: 'Equipment delivery confirmed for new venue opening.' }, { id: 'i3b', type: 'Call', date: '2025-08-20', note: 'Checked installation schedule and on-site support' } ],
          programs: [],
          reminders: [ { id: 'r-al-1', title: 'Post-installation check-in', due: '2025-12-14', note: 'Verify final setup and collect feedback from venue team' } ]
        },
        {
          name: 'Red Bull Gaming',
          tag: 'Active',
          health: '92%',
          owners: ['matt.team@example.com'],
          description: 'Major sponsor for tournament series and venue branding',
          contractValue: '$500,000',
          startDate: '2024-01-14',
          endDate: '2025-01-13',
          lastContact: '2024-12-04',
          contacts: [ { name: 'Sarah Martinez', title: 'Esports Partnership Manager', email: 'sarah.martinez@redbull.com', phone: '555-0123' } ],
          interactions: [
            { id: 'i4', type: 'Meeting', date: '2024-12-04', note: 'Discussed Q1 2025 tournament schedule and activation opportunities.' },
            { id: 'i5', type: 'Email', date: '2025-01-10', note: 'Sent post-event metrics and initial renewal proposal.' },
            { id: 'i6', type: 'Call', date: '2025-06-15', note: 'Follow-up call to review renewal options and expanded activation.' }
          ],
          programs: [ { id: 'p1', title: 'Red Bull Tournament Series 2024', status: 'Active', value: '$500,000', start: '2024-01-14', end: '2025-01-13' } ],
          reminders: [ { id: 'r1', title: 'Contract Renewal', due: '2025-12-14', note: 'Reach out to discuss 2025 renewal terms and potential expansion' } ],
          lastContact: '2025-06-15'
        }
      ],
      donors: [
        { name: `${donor1.firstName} ${donor1.lastName}`, totalGiving: '$12,500', lastGift: 'Mar 3, 2025' },
        { name: `${donor2.firstName} ${donor2.lastName}`, totalGiving: '$4,200', lastGift: 'Jan 12, 2025' }
      ],
      campaigns: [
        { title: campaign1.name, goal: '$75,000', raised: '$12,000' },
        { title: campaign2.name, goal: '$20,000', raised: '$5,000' }
      ],
      recentActivity: [
        { title: 'Alienware', kind: 'Email', note: 'Equipment delivery confirmed for new venue opening.', date: 'Dec 7, 2025' },
        { title: 'Red Bull Gaming', kind: 'Meeting', note: 'Discussed Q1 2025 tournament schedule and activation opportunities.', date: 'Dec 4, 2025' }
      ],
      alerts: [
        { title: 'Alienware', note: 'Send co-marketing proposal and content calendar — Due: Dec 14, 2025' },
        { title: 'Red Bull Gaming', note: 'Reach out to discuss 2025 renewal terms — Due: Dec 19, 2025' }
      ],
      tasks: tasksSeed,
      followUps: enrichedFollowUps,
      analytics: { totalDonors, totalRevenue, campaignStats, donorStats }
    }

    return res.status(200).json(payload)
  } catch (err) {
    console.error('Seed API error', err)
    // return message and stack when possible to aid debugging in dev
    const details = err && err.stack ? err.stack : (err && err.message ? err.message : String(err))
    return res.status(500).json({ error: 'Seed failed', details })
  }
}
