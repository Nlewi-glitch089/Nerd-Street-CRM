const { getPrisma } = require('../lib/prisma');
(async ()=>{
  const prisma = getPrisma();
  const ids = [
    '390b877d-86c7-4ccd-bb7d-441404eb42db',
    'a21aefd5-4696-433b-9a38-755ca3b26ddf',
    '46e936db-11e9-4c7f-94c8-6d587fe4d443',
    'cb852ceb-b1cf-4af1-a251-6c47cc1daf4b'
  ];
  for (const id of ids) {
    try {
      const u = await prisma.user.findUnique({ where: { id } });
      console.log(id, '=>', u ? { id: u.id, name: u.name, email: u.email } : 'NOT FOUND');
    } catch (e) {
      console.error('err for', id, e.message)
    }
  }
  process.exit(0);
})()
.catch(e=>{ console.error(e); process.exit(1) });
