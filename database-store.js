const fs = require('fs');
const path = require('path');
function validDatabase(value) { return Boolean(value && Array.isArray(value.patients)); }
async function loadDatabase(file) {
  try { const value=JSON.parse(await fs.promises.readFile(file,'utf8')); return validDatabase(value)?value:null; }
  catch(error){ if(error.code==='ENOENT')return null; throw error; }
}
async function saveDatabase(file,value){
  if(!validDatabase(value))throw new Error('Некорректный формат базы');
  const temporary=file+'.tmp'; const backup=file+'.backup';
  await fs.promises.mkdir(path.dirname(file),{recursive:true});
  try{await fs.promises.copyFile(file,backup);}catch(error){if(error.code!=='ENOENT')throw error;}
  await fs.promises.writeFile(temporary,JSON.stringify(value,null,2),'utf8');
  try{await fs.promises.unlink(file);}catch(error){if(error.code!=='ENOENT')throw error;}
  await fs.promises.rename(temporary,file); return true;
}
module.exports={validDatabase,loadDatabase,saveDatabase};
