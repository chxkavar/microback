const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{JSDOM}=require('./test-deps.cjs')('jsdom');
const {workspaceHTML,workspaceScript}=require('./calibr/server.cjs');
const root=path.resolve('dist');let count=0;
for(const file of ['index.html','calibr/index.html','workspace.html']){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'));
 for(const element of dom.window.document.querySelectorAll('script[src],link[href]')){
  const ref=element.getAttribute('src')||element.getAttribute('href');
  const url=new URL(ref,'https://local-build.invalid/'+file);if(url.origin!=='https://local-build.invalid')continue;
  assert.ok(fs.existsSync(path.join(root,url.pathname)),'missing asset '+url.pathname);count++;
 }
 dom.window.close();
}
assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),fs.readFileSync('calibr/index.html','utf8'),'release entry differs from local Calibr');
assert.equal(fs.readFileSync(path.join(root,'workspace.html'),'utf8'),workspaceHTML(),'release workspace differs from preview');
for(const file of ['microback.js','workspace-tools.js','session-state.js'])assert.equal(fs.readFileSync(path.join(root,file),'utf8'),workspaceScript(file),file+' is missing generic replay adaptations');
assert.deepEqual(fs.readFileSync(path.join(root,'calibr/supabase.js')),fs.readFileSync('vendor/supabase-2.119.0.js'),'pinned auth SDK differs');
assert.equal(fs.readFileSync(path.join(root,'imports/files.json'),'utf8'),'[]','local imports must stay private');
const files=[];function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else files.push(file)}}walk(root);
for(const file of files){assert.ok(!/\.(?:cjs|sql|md|zip|bundle|csv)$/i.test(file),'development or private file published: '+file);if(file.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'),{filename:file})}
for(const name of ['.dev-tools','node_modules','supabase','backups','accounts.js','cloud-config.js','cloud-store.js','calibr/server.cjs','calibr/fixtures','calibr/QA.md','calibr/cloud-schema.sql'])assert.equal(fs.existsSync(path.join(root,name)),false,'unintended file published: '+name);
console.log('PASS static build: '+count+' local references; Calibr entry, generic engine, pinned SDK, private imports and runtime syntax verified.');
