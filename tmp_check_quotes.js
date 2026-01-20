const fs = require('fs')
const s = fs.readFileSync('pages/partners/[slug].js','utf8')
let inS=false,inD=false,inB=false,prev=''
for(let i=0;i<s.length;i++){
  const c = s[i]
  if(c === "'" && !inD && !inB && prev !== '\\') inS = !inS
  if(c === '"' && !inS && !inB && prev !== '\\') inD = !inD
  if(c === '`' && !inS && !inD && prev !== '\\') inB = !inB
  prev = c
}
console.log('single open', inS, 'double open', inD, 'backtick open', inB)
