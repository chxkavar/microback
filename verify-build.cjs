const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('./test-deps.cjs')('jsdom');
const root=path.resolve('dist'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');let count=0;
const document=new JSDOM(html).window.document;
for(const element of document.querySelectorAll('script[src],link[href]')){const ref=(element.getAttribute('src')||element.getAttribute('href')).split('?')[0];if(/^https?:/.test(ref))continue;assert.ok(fs.existsSync(path.join(root,ref)),'missing asset '+ref);count++}
assert.ok(fs.existsSync(path.join(root,'vendor/supabase-2.119.0.js')),'pinned auth SDK missing');
for(const name of ['.dev-tools','node_modules','supabase','verify.cjs','package-lock.json'])assert.equal(fs.existsSync(path.join(root,name)),false,'development file published: '+name);
console.log('PASS static build: '+count+' local references and pinned cloud SDK; development files excluded');
