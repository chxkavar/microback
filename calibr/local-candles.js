/* Candle bodies stay on this browser; cloud records contain only their identity. */
'use strict';
window.CalibrLocalCandles=(()=>{
 let connection;
 function open(){if(!connection)connection=new Promise((resolve,reject)=>{const request=indexedDB.open('calibr-local-candles',1);request.onupgradeneeded=()=>request.result.createObjectStore('datasets',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(Error('Browser storage could not open. Allow site storage and try again.'))}).catch(error=>{connection=null;throw error});return connection}
 async function run(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('datasets',mode),request=action(tx.objectStore('datasets'));let value;request.onsuccess=()=>value=request.result;tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(Error('The dataset could not be kept in this browser. Check available storage and try again.'))})}
 const key=(user,profile,id)=>JSON.stringify([user,profile,id]);
 return{key,get:id=>run('readonly',store=>store.get(id)),put:(id,dataset)=>run('readwrite',store=>store.put({id,fingerprint:dataset.fingerprint,bars:dataset.bars}))};
})();
