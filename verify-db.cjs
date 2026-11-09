// Executes the production migration against isolated Postgres (PGlite).
// Supabase-owned auth/storage schemas are represented by minimal fixtures.
const {PGlite}=require('./test-deps.cjs')('@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const db=new PGlite();let checks=0,profileA,profileB,session;
async function test(name,fn){await fn();checks++;console.log('PASS',name)}
async function as(user,fn,role='authenticated'){await db.exec('begin');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);await db.exec('set local role '+role);const value=await fn();await db.exec('commit');return value}catch(e){await db.exec('rollback');throw e}}
(async()=>{
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
 create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,delete on storage.objects to authenticated;
 insert into auth.users values('${A}'),('${B}');`);
 await test('Production migrations execute on Postgres',async()=>{for(const file of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));if(fs.existsSync('session-management.sql'))await db.exec(fs.readFileSync('session-management.sql','utf8'))});
 await test('Accounts can create their own profiles',async()=>{profileA=(await as(A,()=>db.query("insert into mb_profiles(name) values('Alice') returning id"))).rows[0].id;profileB=(await as(B,()=>db.query("insert into mb_profiles(name) values('Bob') returning id"))).rows[0].id});
 await test('Profile reads are isolated by account',async()=>{const result=await as(A,()=>db.query('select name from mb_profiles'));assert.deepEqual(result.rows,[{name:'Alice'}])});
 await test('Accounts cannot create profiles under another owner',()=>assert.rejects(as(A,()=>db.query("insert into mb_profiles(user_id,name) values($1,'Forged')",[B])),/row-level security/));
 await test('Signed-out requests cannot read account tables',()=>assert.rejects(as(null,()=>db.query('select * from mb_profiles'),'anon'),/permission denied/));
 await test('Session ownership must match its parent profile',()=>assert.rejects(as(A,()=>db.query("insert into mb_sessions(id,profile_id,name,file_name,dataset_path,bar_count,state) values('33333333-3333-4333-8333-333333333333',$1,'Bad','test.csv',auth.uid()::text||'/'||'33333333-3333-4333-8333-333333333333'||'/dataset.json',30,'{\"version\":1}')",[profileB])),/foreign key/));
 await test('An owner can create a named session with private dataset path',async()=>{const id='33333333-3333-4333-8333-333333333333';const result=await as(A,()=>db.query("insert into mb_sessions(id,profile_id,name,file_name,dataset_path,bar_count,state) values($1,$2,'Practice','test.csv',$3,30,'{\"version\":1}') returning id",[id,profileA,A+'/'+id+'/dataset.json']));session=result.rows[0].id});
 await test('Other accounts cannot read or update a session',async()=>{assert.equal((await as(B,()=>db.query('select * from mb_sessions'))).rows.length,0);assert.equal((await as(B,()=>db.query('update mb_sessions set revision=2 where id=$1 returning id',[session]))).rows.length,0)});
 await test('Session ownership columns cannot be reassigned by a browser client',()=>assert.rejects(as(A,()=>db.query('update mb_sessions set user_id=$1,revision=2 where id=$2',[B,session])),/permission denied/));
 await test('Revision-checked saves reject stale writes',async()=>{const first=await as(A,()=>db.query('update mb_sessions set revision=2 where id=$1 and revision=1 returning revision',[session]));assert.equal(first.rows[0].revision,2);assert.equal((await as(A,()=>db.query('update mb_sessions set revision=2 where id=$1 and revision=1 returning revision',[session]))).rows.length,0)});
 await test('Server rejects saves that skip a revision',()=>assert.rejects(as(A,()=>db.query('update mb_sessions set revision=9 where id=$1',[session])),/advance by one/));
 await test('Dataset bucket is private',async()=>{assert.equal((await db.query("select public from storage.buckets where id='mb-datasets'")).rows[0].public,false)});
 await test('Owners can upload and read their own dataset objects',async()=>{await as(A,()=>db.query("insert into storage.objects(bucket_id,name) values('mb-datasets',$1)",[A+'/'+session+'/dataset.json']));assert.equal((await as(A,()=>db.query('select * from storage.objects'))).rows.length,1)});
 await test('Other accounts cannot read, delete, or upload into the owner folder',async()=>{assert.equal((await as(B,()=>db.query('select * from storage.objects'))).rows.length,0);assert.equal((await as(B,()=>db.query('delete from storage.objects returning id'))).rows.length,0);await assert.rejects(as(B,()=>db.query("insert into storage.objects(bucket_id,name) values('mb-datasets',$1)",[A+'/forged.json'])),/row-level security/)});
 await test('Owners can clean up failed uploads',async()=>{assert.equal((await as(A,()=>db.query('delete from storage.objects returning id'))).rows.length,1)});
 await test('Renaming preserves state and requires the latest revision',async()=>{const result=await as(A,()=>db.query("update mb_sessions set name='Renamed practice',revision=3 where id=$1 and revision=2 and deleted_at is null returning name,state",[session]));assert.equal(result.rows[0].name,'Renamed practice');assert.deepEqual(result.rows[0].state,{version:1});assert.equal((await as(A,()=>db.query("update mb_sessions set name='Stale edit',revision=3 where id=$1 and revision=2 returning id",[session]))).rows.length,0)});
 await test('Other accounts cannot rename or mark a session for deletion',async()=>{assert.equal((await as(B,()=>db.query('update mb_sessions set deleted_at=now(),revision=4 where id=$1 returning id',[session]))).rows.length,0)});
 await test('Deleting hides the session before dataset cleanup and prevents resurrection',async()=>{await as(A,()=>db.query('update mb_sessions set deleted_at=now(),revision=4 where id=$1 and revision=3',[session]));assert.equal((await as(A,()=>db.query('select id from mb_sessions where deleted_at is null'))).rows.length,0);await assert.rejects(as(A,()=>db.query('update mb_sessions set deleted_at=null,revision=5 where id=$1',[session])),/has been deleted/);assert.equal((await as(A,()=>db.query('delete from mb_sessions where id=$1 and deleted_at is not null returning id',[session]))).rows.length,1)});
 console.log(checks+' database isolation checks passed.');await db.close();
})().catch(async e=>{console.error(e);await db.close();process.exitCode=1});
