const fs = require('fs');
const s = fs.readFileSync('pages/admin.js', 'utf8');
let stack = [];
const pairs = { '(': ')', '{': '}', '[': ']' };
let inSingle = false, inDouble = false, inBack = false, inLineComment = false, inBlockComment = false;
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  const prev = s[i-1];
  // handle comment starts/ends
  if (!inSingle && !inDouble && !inBack) {
    if (!inBlockComment && ch === '/' && s[i+1] === '/') { inLineComment = true; continue; }
    if (!inLineComment && ch === '/' && s[i+1] === '*') { inBlockComment = true; i++; continue; }
  }
  if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
  if (inBlockComment) { if (ch === '*' && s[i+1] === '/') { inBlockComment = false; i++; } continue; }
  // handle strings
  if (!inDouble && !inBack && ch === "'" && prev !== '\\') { inSingle = !inSingle; continue; }
  if (!inSingle && !inBack && ch === '"' && prev !== '\\') { inDouble = !inDouble; continue; }
  if (!inSingle && !inDouble && ch === '`' && prev !== '\\') { inBack = !inBack; continue; }
  if (inSingle || inDouble || inBack) continue;
  if ('({['.includes(ch)) { stack.push({ ch, i }); }
  else if (')}]'.includes(ch)) {
    const last = stack.pop();
    if (!last) { console.log('Unmatched closing', ch, 'at', i); process.exit(0); }
    const expected = pairs[last.ch];
    if (expected !== ch) { console.log('Mismatched', last.ch, 'at', last.i, 'closed by', ch, 'at', i); process.exit(0); }
  }
}
if (stack.length > 0) { console.log('Unclosed at end:', stack.slice(-5)); } else { console.log('All balanced'); }
