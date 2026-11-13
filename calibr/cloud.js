/* Real Supabase connection. Local demo storage remains separate and explicit. */
'use strict';
window.CalibrConnection=(()=>{
 const local=CalibrStore,M=CalibrModel,copy=M.clone;
 let active=local,user=null,admin=false,client,queue=Promise.resolve();const assets=new Map();
 const config={url:'https://oodjmefihrhalpffbcye.supabase.co',key:'sb_publishable_S-phxMwqqvR6Bp5iUVoVMg_ry96k4CO'};
 function clearAuthCallback(){const url=new URL(location.href||location.origin+'/' + (location.search||''));if(!['confirm','recovery'].includes(url.searchParams.get('auth')))return;url.searchParams.delete('auth');url.hash='';window.history?.replaceState(null,'',url.pathname+url.search)}
 function supa(){if(!client){if(!window.supabase)throw Error('The sign-in library did not load. Refresh and retry.');client=window.supabase.createClient(config.url,config.key,{auth:{storageKey:'calibr-cloud-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})}return client}
 const account=()=>({id:'cloud-account:'+user.id,type:'account',email:user.email,name:user.user_metadata?.name||'Trader',isAdmin:admin});
 function row(record){const d={...record.data,_etag:record.version};if(d.type==='dataset')d.bars={length:d.barCount};if(d.type==='dataset-request')d.snapshot={...d.snapshot,bars:{length:d.snapshot.barCount}};return d}
 let refreshing;async function withAuth(action){let response=await action();if(response.error&&/jwt|expired|token/i.test(response.error.message)){if(!refreshing)refreshing=supa().auth.refreshSession().finally(()=>refreshing=null);const renewed=await refreshing;if(renewed.error)throw renewed.error;if(user&&renewed.data?.session?.user?.id!==user.id)throw Error('Sign in again with the account that opened this workspace.');response=await action()}return response}
 async function rpc(name,args){const{data,error}=await withAuth(()=>supa().rpc(name,args));if(error)throw Error(error.message);return data}
 async function candles(id){if(!assets.has(id)){const request=(async()=>{const{data,error}=await withAuth(()=>supa().from('calibr_assets').select('bars').eq('id',id).single());if(error)throw Error('Dataset could not load: '+error.message);return data.bars})();assets.set(id,request);request.catch(()=>assets.delete(id))}return copy(await assets.get(id))}
 async function hydrate(d){if(d?.type==='dataset'&&d.assetId)d.bars=await candles(d.assetId);if(d?.type==='dataset-request'&&d.assetId)d.snapshot={...d.snapshot,bars:await candles(d.assetId)};return d}
 const samples=()=>['futures','crypto'].map(kind=>({...M.sample(kind),id:'sample-'+kind,type:'dataset',visibility:'sample',profileId:null}));
 async function all(){if(!user)throw Error('Sign in to continue.');let result=[],start=0;for(;;){const{data,error}=await withAuth(()=>supa().from('calibr_records').select('id,data,version').order('id').range(start,start+199));if(error)throw Error('Cloud data could not load: '+error.message);result.push(...data.map(row));if(data.length<200)break;start+=200}return[account(),...samples(),...result]}
 async function commit(change,baseline){const before=baseline||await all(),plan=change(copy(before));if(plan&&typeof plan.then==='function')throw Error('Changes must be prepared synchronously.');const writes=[],newAssets=[],versions=new Map(before.map(d=>[d.id,d._etag||0]));
  const puts=copy(plan.put||[]);
  for(const d of [...puts])if(d.type==='session'&&['sample-futures','sample-crypto'].includes(d.datasetId)){const sample=before.find(x=>x.id===d.datasetId),id='sample-copy-'+d.id;puts.unshift({...sample,id,profileId:d.profileId,visibility:'session-only',libraryPrompted:true});d.datasetId=id}
  // Parent profiles/folders/datasets precede their referencing records.
  const rank={profile:0,'dataset-folder':1,dataset:2,session:3};puts.sort((a,b)=>(rank[a.type]??10)-(rank[b.type]??10));
  for(const d of puts){if(d.type==='account')throw Error('Cloud identity comes from verified sign-in.');if(d.type==='dataset'){if(Array.isArray(d.bars)&&!d.assetId){if(new Blob([JSON.stringify(d.bars)]).size>25*1024*1024)throw Error('Split this dataset into files smaller than 25 MB for cloud saving.');d.assetId='asset-'+crypto.randomUUID();newAssets.push({id:d.assetId,bars:d.bars});d.barCount=d.bars.length;d.first=d.bars[0].t;d.last=d.bars.at(-1).t}if(!d.assetId)throw Error('This dataset has no saved candle asset.')}delete d.bars;delete d._etag;writes.push({data:d,expected:versions.get(d.id)||0})}
  if(!writes.length&&!(plan.remove||[]).length)return plan.value;
  const receipt=await rpc('calibr_commit',{p_changes:{writes,assets:newAssets,removes:plan.remove||[]}});
  const fresh=new Map(writes.map(w=>{const saved=receipt.find(r=>r.id===w.data.id);return[w.data.id,{...w.data,_etag:saved.version,updatedAt:saved.updatedAt}]}));function replace(value){if(!value||typeof value!=='object')return value;if(Array.isArray(value))return value.map(replace);if(value.id&&fresh.has(value.id)){const result=copy(fresh.get(value.id));if(Array.isArray(value.bars))result.bars=value.bars;return result}return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,replace(v)]))}return replace(plan.value);
 }
 const cloud={
  id:local.id,seed:async()=>{},
  list:async(type,profileId)=>(await all()).filter(d=>(!type||d.type===type)&&(!profileId||d.profileId===profileId)),
  get:async id=>{if(id==='cloud-account:'+user?.id)return account();if(['sample-futures','sample-crypto'].includes(id))return samples().find(d=>d.id===id)||null;const{data,error}=await withAuth(()=>supa().from('calibr_records').select('id,data,version').eq('id',id).maybeSingle());if(error)throw Error(error.message);return data?hydrate(row(data)):null},
  atomic:change=>{const job=queue.then(()=>commit(change));queue=job.catch(()=>{});return job},
  put:async value=>cloud.atomic(rows=>{const existing=rows.find(d=>d.id===value.id);if(existing&&value._etag!=null&&existing._etag!==value._etag)throw Error('REVISION_CONFLICT: This record changed elsewhere. Reopen it.');return{put:[value],value}}),
  remove:async()=>{throw Error('Use Recently deleted so your session remains recoverable.')},
  saveSession:async(row,state,details={})=>{const job=queue.then(()=>commit(rows=>{const current=rows.find(d=>d.type==='session'&&d.id===row.id&&d.profileId===row.profileId);if(!current||current.deletedAt)throw Error('This session is unavailable. Restore it or reopen Sessions.');if(current.status==='completed')throw Error('Completed sessions are read-only.');if((row.revision||0)!==(current.revision||0))throw Error('REVISION_CONFLICT: This session changed elsewhere. Reopen it.');const next={...current,state:copy(state),summary:copy(details.summary??current.summary),revision:(current.revision||0)+1,practiceMs:Math.max(current.practiceMs||0,details.practiceMs||0),timezone:details.timezone||current.timezone,updatedAt:new Date().toISOString()};return{put:[next],value:next}},[copy(row)]));queue=job.catch(()=>{});return job}
 };
 const facade={get mode(){return active===cloud?'cloud':'local'},get local(){return local}};for(const name of ['id','get','put','remove','list','seed','atomic','saveSession'])facade[name]=(...args)=>active[name](...args);
 async function connect(){for(let attempt=0;attempt<2;attempt++){try{const{data,error}=await supa().auth.getUser();if(error||!data.user)throw Error(error?.message||'Sign in to continue.');user=data.user;admin=await rpc('calibr_role',{});active=cloud;assets.clear();return account()}catch(error){if(attempt||!/jwt|expired|token/i.test(error.message))throw error;const refreshed=await supa().auth.refreshSession();if(refreshed.error)throw refreshed.error}}throw Error('Sign in again to reconnect.')}

 async function restore(){const callbackError=new URLSearchParams((location.hash||'').slice(1)).get('error_description');if(callbackError)throw Error('This email link is invalid or expired. Request a new confirmation or password-reset email.');const{data,error}=await supa().auth.getSession();if(error)throw error;if(!data.session)return null;const current=await connect();if(new URLSearchParams(location.search).get('auth')==='confirm')clearAuthCallback();return current}
 async function signIn(email,password){const{error}=await supa().auth.signInWithPassword({email,password});if(error)throw error;return connect()}
 async function signUp(email,password,name){const{data,error}=await supa().auth.signUp({email,password,options:{data:{name},emailRedirectTo:location.origin+'/?auth=confirm'}});if(error)throw error;return data.session?connect():null}
 async function signOut(){if(active===cloud){const{error}=await supa().auth.signOut({scope:'local'});if(error)throw error}user=null;admin=false;assets.clear();active=local}
 async function demo(){await signOut();return true}
 const baseLibrary=createCalibrLibrary;
 window.createCalibrLibrary=store=>{const base=baseLibrary(store);return{...base,
  createFolder:async(options,actor)=>store.mode==='cloud'&&options.scope==='public'?rpc('calibr_public_folder',{p_id:null,p_name:options.folder,p_category:options.category}):base.createFolder(options,actor),
  renameFolder:async(id,name,actor)=>{if(store.mode==='cloud'){const folder=await cloud.get(id);if(folder?.scope==='public')return rpc('calibr_public_folder',{p_id:id,p_name:name,p_category:folder.category})}return base.renameFolder(id,name,actor)},
  requestPublication:async(id,options,actor)=>store.mode==='cloud'?rpc('calibr_request_publication',{p_dataset:id,p_options:options}):base.requestPublication(id,options,actor),
  decide:async(id,decision,options,actor)=>{if(store.mode!=='cloud')return base.decide(id,decision,options,actor);if(decision==='approved'){const request=await cloud.get(id);if(!request?.snapshot)throw Error('Request no longer exists.');const data=request.snapshot;M.settings(data.settings);if(!Array.isArray(data.bars)||data.bars.length<20||data.bars.some(b=>![b.t,b.o,b.h,b.l,b.c,b.v].every(Number.isFinite)))throw Error('The requested dataset is invalid.')}return rpc('calibr_decide',{p_request:id,p_decision:decision,p_options:options})},
  inspectRequest:async(id,actor)=>store.mode==='cloud'?cloud.get(id):base.inspectRequest(id,actor)
 }};
 window.CalibrStorage=facade;
 return{store:facade,restore,signIn,signUp,signOut,demo,connect,account:()=>user?account():null,
  resetPassword:async email=>{const{error}=await supa().auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?auth=recovery'});if(error)throw error},
  updatePassword:async password=>{const{error}=await supa().auth.updateUser({password});if(error)throw error;clearAuthCallback()},
  onAuth:(fn)=>supa().auth.onAuthStateChange((event)=>{setTimeout(()=>fn(event),0)}),
  get recovery(){return new URLSearchParams(location.search).get('auth')==='recovery'}
 };
})();
