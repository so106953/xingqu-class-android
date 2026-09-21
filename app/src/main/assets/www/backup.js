function backupCourses(){
  const profile=profiles.find(p=>p.id===activeProfileId)
  const payload={app:'兴趣课时本',version:2,exportedAt:new Date().toISOString(),childName:profile?.name||'孩子',courses}
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'})
  const href=URL.createObjectURL(blob),link=document.createElement('a');link.href=href;link.download=`兴趣课时本_${profile?.name||'孩子'}_备份_${dateKey(new Date())}.json`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);notify(`${profile?.name||'当前孩子'}的备份文件已导出`)
}
function restoreCourses(file){
  const reader=new FileReader()
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result),incoming=Array.isArray(data)?data:data.courses
      if(!Array.isArray(incoming)||!incoming.length||!incoming.every(c=>c&&c.id&&c.name&&c.startDate&&Number(c.total)>0&&c.skips&&typeof c.skips==='object'))throw new Error()
      const normalized=incoming.map(c=>({...c,total:Number(c.total),initialUsed:Number(c.initialUsed)||0,weekday:Number(c.weekday),skips:c.skips||{},manualRecords:Array.isArray(c.manualRecords)?c.manualRecords:[]}))
      if(persist(normalized))notify(`已恢复到当前孩子：${normalized.length} 门课程`)
    }catch{notify('恢复失败：请选择本网站导出的备份文件')}
  }
  reader.readAsText(file,'utf-8')
}
const backupButton=document.querySelector('#backup-data'),restoreInput=document.querySelector('#restore-data')
backupButton.addEventListener('click',backupCourses)
restoreInput.addEventListener('change',e=>{const file=e.target.files[0];if(file)restoreCourses(file);e.target.value=''})
