const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const KEY='interest-class-web-v1', dialog=document.querySelector('#dialog'), content=document.querySelector('#dialog-content')
const today=dateKey(new Date());let courses,historyId=null
const defaults=()=>[{id:'basketball',name:'篮球',total:16,initialUsed:0,weekday:6,startTime:'10:30',endTime:'12:00',startDate:today,skips:{},manualRecords:[]},{id:'english',name:'英语',total:16,initialUsed:0,weekday:0,startTime:'13:20',endTime:'15:20',startDate:today,skips:{},manualRecords:[]}]
try{const saved=JSON.parse(localStorage.getItem(KEY));courses=Array.isArray(saved)&&saved.every(c=>c.id&&c.startDate&&c.total>0&&c.skips)?saved:defaults()}catch{courses=defaults()}
courses=courses.map(c=>({...c,manualRecords:Array.isArray(c.manualRecords)?c.manualRecords:[]}))
try{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(courses))}catch{} 
function notify(s){const e=document.querySelector('#toast');e.textContent=s;e.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>e.classList.remove('show'),2500)}
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));courses=next;render();return true}catch{notify('保存失败，请检查浏览器存储权限');return false}}
function head(title){return `<div class="modal-head"><h2 id="dialog-title">${esc(title)}</h2><button class="close" data-action="close" aria-label="关闭">关闭</button></div>`}
function history(id){historyId=id;const c=summarize(courses.find(c=>c.id===id));content.innerHTML=head(c.name+' · 上课记录')+`<p class="hint">可用“补课 / 调课”登记临时课程。每周课程请假不扣课；手动补课和调课默认扣 1 节。</p>`+(c.records.length?c.records.map(r=>`<div class="record"><div>${r.date}<small>${esc(r.type|| (r.skipped?'请假 · 未扣课':'已上 · 扣 1 节'))}${r.note?' · '+esc(r.note):''}</small></div>${r.source==='manual'?'<button class="secondary" data-action="remove-manual" data-id="'+esc(id)+'" data-record="'+esc(r.id)+'">删除记录</button>':`<button class="secondary" data-action="skip" data-id="${esc(id)}" data-date="${r.date}">${r.skipped?'恢复上课':'标记请假'}</button>`}</div>`).join(''):'<div class="empty">还没有到期的课程<br><small>可点击“补课 / 调课”补充记录</small></div>');if(!dialog.open)dialog.showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const {action,id,date,record}=b.dataset;if(action==='close')dialog.close();if(action==='edit')edit(id);if(action==='history')history(id);if(action==='manual')manualRecord(id);if(action==='remove-manual'){const next=courses.map(c=>c.id===id?{...c,manualRecords:c.manualRecords.filter(r=>r.id!==record)}:c);if(persist(next))history(id)}if(action==='skip'){const next=courses.map(c=>{if(c.id!==id)return c;const skips={...c.skips};if(skips[date])delete skips[date];else skips[date]={markedAt:new Date().toISOString()};return {...c,skips}});if(persist(next)){if(dialog.open&&historyId)history(historyId);notify('请假状态已更新')}}});dialog.addEventListener('close',()=>historyId=null);setInterval(()=>render(),30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});

// Android APK bridge: the webpage remains the visual layer, while Android schedules device reminders.
;(function(){
  if(!window.AndroidBridge)return
  const originalPersist=persist
  persist=function(next){const ok=originalPersist(next);if(ok){try{window.AndroidBridge.syncCourses(JSON.stringify(next))}catch(_){}}return ok}
  try{window.AndroidBridge.syncCourses(JSON.stringify(courses))}catch(_){}
  const nativeActions=document.createElement('section')
  nativeActions.className='data-tools native-actions'
  nativeActions.innerHTML='<div><b>手机提醒</b><small>可在系统中开启课程前提醒。</small></div><button type="button">开启提醒权限</button>'
  nativeActions.querySelector('button').onclick=()=>window.AndroidBridge.requestAlarmPermission()
  document.querySelector('#lesson-reminders').insertAdjacentElement('afterend',nativeActions)
})()
