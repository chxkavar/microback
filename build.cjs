// Dependency-free static build; only explicitly listed assets are published.
const fs=require('node:fs'),path=require('node:path');
const root=__dirname,out=path.join(root,'dist');
fs.mkdirSync(path.join(root,'imports'),{recursive:true});
fs.writeFileSync(path.join(root,'imports','files.json'),JSON.stringify(fs.readdirSync(path.join(root,'imports')).filter(name=>/\.csv$/i.test(name)).sort()));
// dist is generated output; verify its location before replacing it.
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw new Error('Invalid output directory');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const assets=['index.html','microback.css','microback.js','accounts.css','accounts.js','cloud-config.js','cloud-store.js','session-state.js','imports','vendor'];
for(const asset of assets)fs.cpSync(path.join(root,asset),path.join(out,asset),{recursive:true});
console.log('MicroBack built into dist/');
