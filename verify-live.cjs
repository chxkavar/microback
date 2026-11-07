// Read-only smoke checks. No accounts are created and no emails are sent.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{}};vm.runInNewContext(fs.readFileSync('cloud-config.js','utf8'),context);
const {url,publishableKey}=context.window.MICROBACK_CLOUD;
const headers={apikey:publishableKey};
(async()=>{
 const settings=await fetch(url+'/auth/v1/settings',{headers});assert.equal(settings.status,200,'auth settings endpoint must be reachable');const auth=await settings.json();assert.equal(auth.external?.email,true,'email authentication must be enabled');assert.equal(auth.mailer_autoconfirm,false,'email confirmation must remain enabled');console.log('PASS live authentication endpoint and email confirmation');
 for(const table of ['mb_profiles','mb_sessions']){const response=await fetch(url+'/rest/v1/'+table+'?select=id',{headers});assert.ok([401,403].includes(response.status),'anonymous table reads must be denied: '+table);console.log('PASS anonymous access denied for '+table)}
 console.log('3 read-only live checks passed.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
