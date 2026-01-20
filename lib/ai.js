// Use the global `fetch` provided by Node/Next.js runtime rather than importing `node-fetch`.

// Simple local summarizer used when no external AI key is present.
export async function localSummarize(data, filters={}) {
  const now = new Date()
  const donors = data.donors || []
  const donations = data.donations || []
  const campaigns = data.campaigns || []

  // basic metrics
  const totalDonations = donations.reduce((s,d)=>s + (Number(d.amount||0)||0), 0)
  const donorsCount = donors.length

  // donor inactivity: donors without gifts in last 60 days
  const cutoff = new Date(now.getTime() - 60*24*60*60*1000)
  const inactiveDonors = donors.filter(d => !d.lastGiftAt || new Date(d.lastGiftAt) < cutoff)

  // recent trend: compare last 30 days vs prior 30 days
  const byDate = donations.reduce((acc,d)=> {
    const dt = new Date(d.date || d.createdAt || Date.now())
    const key = dt.toISOString().slice(0,10)
    acc[key] = (acc[key]||0) + (Number(d.amount||0)||0)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()
  const last30 = dates.slice(-30)
  const sumLast30 = last30.reduce((s,k)=>s + (byDate[k]||0),0)
  const prev30 = dates.slice(-60, -30)
  const sumPrev30 = prev30.reduce((s,k)=>s + (byDate[k]||0),0)
  const trendPct = sumPrev30 === 0 ? (sumLast30>0?100:0) : Math.round(((sumLast30 - sumPrev30)/sumPrev30)*100)

  const topDonors = donors.slice().sort((a,b)=> (Number(b.totalGiving||0)) - (Number(a.totalGiving||0))).slice(0,5).map(d=>({ name: (d.firstName||'') + (d.lastName? ' '+d.lastName : ''), totalGiving: d.totalGiving }))

  const summary = `Total donations: $${Math.round(totalDonations)} from ${donorsCount} donors. Recent 30-day change vs previous 30 days: ${trendPct}%`;

  const insights = []
  if (inactiveDonors.length > Math.max(5, donorsCount*0.25)) insights.push(`${inactiveDonors.length} donors inactive for 60+ days — consider re-engagement campaigns.`)
  if (trendPct < -30) insights.push(`Donations down ${Math.abs(trendPct)}% over the last 30 days — investigate recent changes or outreach.`)
  if (trendPct > 30) insights.push(`Donations up ${trendPct}% — consider scaling successful activities.`)

  const actions = []
  if (inactiveDonors.length) actions.push('Create a re-engagement campaign targeting donors inactive 60+ days')
  if (topDonors.length) actions.push('Review top donors for stewardship opportunities')
  if (campaigns && campaigns.length) actions.push('Review campaign performance and reallocate resources if needed')

  return {
    summary,
    metrics: { totalDonations, donorsCount, trendPct, topDonorsCount: topDonors.length },
    trends: [{ label: '30-day vs prior 30-day donations', value: trendPct }],
    insights,
    concerns: insights.filter(i => i.includes('down') || i.includes('inactive')),
    actions,
    raw: { topDonors }
  }
}

export async function callExternalAI(prompt, apiKey) {
  const url = 'https://api.openai.com/v1/chat/completions'
  const body = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are an internal analytics assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.2
  }
  const res = await global.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const txt = await res.text().catch(()=>res.statusText)
    throw new Error('AI API error: '+ txt)
  }
  const data = await res.json()
  const reply = data?.choices?.[0]?.message?.content || ''
  return reply
}

export async function summarizeData(payload, options={}) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API || null
  // If no key, fall back to local summarizer
  if (!apiKey) return localSummarize(payload, options.filters || {})

  const schemaNote = `Return a single valid JSON object and only the JSON (no explanatory text, no markdown/code fences). The JSON MUST contain these keys:\n- summary: string (concise paragraph)\n- trends: array (objects with label and value)\n- insights: array of strings\n- concerns: array of strings\n- actions: array of strings\nExample: {"summary":"...","trends":[],"insights":[],"concerns":[],"actions":[]}\n`

  const dataSnippet = JSON.stringify(payload).slice(0, 20000)
  const prompt = `You are an internal analytics assistant for a nonprofit CRM. ${schemaNote}Analyze the following JSON data and produce a concise decision-support JSON object for an administrator focusing on trends, concerns, and actionable next steps. Data:\n${dataSnippet}`

  // helper: remove fences and extract the most JSON-like substring
  function extractJsonFromText(text) {
    if (!text) return null
    let t = String(text).trim()
    // strip code fences
    t = t.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ''))
    // try direct parse
    try { return JSON.parse(t) } catch (e) {}
    // find first { and last }
    const first = t.indexOf('{')
    const last = t.lastIndexOf('}')
    if (first >= 0 && last > first) {
      const possible = t.slice(first, last + 1)
      try { return JSON.parse(possible) } catch (e) {}
    }
    return null
  }

  try {
    const firstReply = await callExternalAI(prompt, apiKey)
    // try to extract JSON from first reply
    const parsed = extractJsonFromText(firstReply)
    if (parsed) return parsed

    // If parsing failed, do one focused retry: ask the model to return ONLY the JSON object.
    const followup = `The previous response did not produce valid JSON. Below is the assistant's previous reply:\n\n${firstReply}\n\nPlease extract or regenerate ONLY a single valid JSON object that matches this schema and nothing else: ${JSON.stringify({ summary: 'string', trends: [], insights: [], concerns: [], actions: [] })}`
    const secondReply = await callExternalAI(followup, apiKey)
    const parsed2 = extractJsonFromText(secondReply)
    if (parsed2) return parsed2

    // final fallback: return the firstReply as summary text plus local summarizer for structured suggestions
    const fallback = await localSummarize(payload, options.filters || {})
    return { summary: (firstReply && String(firstReply).slice(0,1000)) || fallback.summary, trends: fallback.trends || [], insights: fallback.insights || [], concerns: fallback.concerns || [], actions: fallback.actions || [], rawModelReplies: { first: firstReply, second: secondReply }, fallback }
  } catch (err) {
    return { error: String(err), fallback: await localSummarize(payload, options.filters || {}) }
  }
}

export default summarizeData
