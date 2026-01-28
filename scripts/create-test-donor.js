require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const jwt = require('jsonwebtoken')

async function main(){
  const prisma = new PrismaClient()
  try{
    const adminEmail = 'admin@nerdstreet.org'
    const user = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (!user) {
      console.error('No admin user found. Run: node prisma/seed.js')
      process.exit(1)
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    console.log('Generated token (truncated):', token.slice(0,40) + '...')

    const email = `test.user.${Date.now()}@example.org`
    const payload = { firstName: 'Test', lastName: 'User', email, phone: '555-9999' }
    console.log('Creating donor with email:', email)

    const postRes = await fetch('http://localhost:3000/api/donors', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
    const postText = await postRes.text()
    console.log('POST /api/donors status:', postRes.status)
    console.log('POST body:', postText)

    try{
      const postJson = postText ? JSON.parse(postText) : {}
      const id = postJson && postJson.donor && postJson.donor.id
      if (!id) {
        console.log('No donor id returned; aborting GET')
        process.exit(0)
      }
      console.log('Fetching donor detail for id:', id)
      const getRes = await fetch(`http://localhost:3000/api/donors/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      const getText = await getRes.text()
      console.log('GET /api/donors/:id status:', getRes.status)
      console.log('GET body:', getText)
    } catch (e) {
      console.error('Failed to parse POST response', e)
    }
  } catch (err) {
    console.error(err)
  } finally {
    try{ await prisma.$disconnect() } catch(e){}
  }
}

main()
