// Build the same Calibr app and adapted replay engine served by the local preview.
// This writes local artifacts only; it does not publish, push or deploy anything.
const fs=require('node:fs'),path=require('node:path');
const {workspaceHTML,workspaceScript}=require('./calibr/server.cjs');
const root=__dirname,out=path.join(root,'dist');
const runtime=[
 'index.html','model.js','practice.js','store.js','library.js','library-ui.js',
 'analytics.js','reports-ui.js','local-candles.js','cloud.js','landing.js','app.js','engine.js','workspace.js',
 'styles.css','library.css','reports.css','landing.css','theme.css','workspace.css','charts.css','mark.svg'
];
// dist is generated output. Verify the absolute target before replacing it.
if(path.resolve(out)!==path.join(path.resolve(root),'dist'))throw Error('Invalid output directory');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(path.join(out,'calibr'),{recursive:true});
for(const file of runtime)fs.copyFileSync(path.join(root,'calibr',file),path.join(out,'calibr',file));
fs.copyFileSync(path.join(root,'calibr/index.html'),path.join(out,'index.html'));
fs.writeFileSync(path.join(out,'workspace.html'),workspaceHTML());
for(const file of ['microback.js','workspace-tools.js','session-state.js'])fs.writeFileSync(path.join(out,file),workspaceScript(file));
for(const file of ['microback.css','workspace-tools.css'])fs.copyFileSync(path.join(root,file),path.join(out,file));
fs.mkdirSync(path.join(out,'vendor'),{recursive:true});
const sdk=path.join(root,'vendor/supabase-2.119.0.js');
fs.copyFileSync(sdk,path.join(out,'vendor/supabase-2.119.0.js'));
fs.copyFileSync(sdk,path.join(out,'calibr/supabase.js'));
// Raw local imports are never implicitly made public. Use the approved dataset library.
fs.mkdirSync(path.join(out,'imports'),{recursive:true});
fs.writeFileSync(path.join(out,'imports/files.json'),'[]');
fs.writeFileSync(path.join(out,'_headers'),"/*\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: frame-ancestors 'self'\n");
console.log('Calibr built into dist/ — local artifact only.');
