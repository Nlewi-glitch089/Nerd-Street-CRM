#!/usr/bin/env node
require('dotenv').config()
const { getPrisma } = require('../lib/prisma')

async function main(){
  const prisma = getPrisma()
  try{
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } })
    console.log('Users:')
    users.forEach(u => console.log(`${u.id}  ${u.email}  ${u.name || ''}  ${u.role || ''}`))
    process.exit(0)
  }catch(e){
    console.error('Failed to list users', e)
    process.exit(1)
  }
}

main()
