// Supports standard npm ci as well as the existing isolated development tools.
module.exports=name=>{let resolved;try{resolved=require.resolve(name)}catch{resolved=require.resolve('./.dev-tools/node_modules/'+name)}return require(resolved)};
