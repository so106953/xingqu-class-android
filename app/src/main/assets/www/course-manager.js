// Extends the existing course tracker while retaining its storage key and history.
let draftImage='',coursePage=0
const coursesPerPage=4
function cropUploadedImage(source){return new Promise(resolve=>{const crop=document.createElement('section');crop.className='crop-editor';crop.innerHTML='<b>自由裁剪图片</b><small>拖动图片调整位置，也可以用滑杆缩放和微调。</small><canvas width="280" height="280"></canvas><label>缩放<input class="crop-zoom" type="range" min="1" max="3" step="0.01" value="1"></label><label>左右<input class="crop-x" type="range" min="-140" max="140" step="1" value="0"></label><label>上下<input class="crop-y" type="range" min="-140" max="140" step="1" value="0"></label><div><button type="button" class="secondary crop-cancel">取消</button><button type="button" class="primary crop-apply">应用裁剪</button></div>';document.querySelector('.picture-field').insertAdjacentElement('afterend',crop);const canvas=crop.querySelector('canvas'),ctx=canvas.getContext('2d'),img=new Image(),zoom=crop.querySelector('.crop-zoom'),x=crop.querySelector('.crop-x'),y=crop.querySelector('.crop-y');let drag=null;const draw=()=>{const scale=Math.max(canvas.width/img.width,canvas.height/img.height)*Number(zoom.value),w=img.width*scale,h=img.height*scale,dx=(canvas.width-w)/2+Number(x.value),dy=(canvas.height-h)/2+Number(y.value);ctx.fillStyle='#e8f5fb';ctx.fillRect(0,0,280,280);ctx.drawImage(img,dx,dy,w,h)};img.onload=draw;img.src=source;[zoom,x,y].forEach(i=>i.oninput=draw);canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,ox:Number(x.value),oy:Number(y.value)};canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!drag)return;x.value=Math.max(-140,Math.min(140,drag.ox+e.clientX-drag.x));y.value=Math.max(-140,Math.min(140,drag.oy+e.clientY-drag.y));draw()};canvas.onpointerup=()=>drag=null;crop.querySelector('.crop-cancel').onclick=()=>{crop.remove();resolve(null)};crop.querySelector('.crop-apply').onclick=()=>{draw();const output=document.createElement('canvas');output.width=512;output.height=512;output.getContext('2d').drawImage(canvas,0,0,512,512);crop.remove();resolve(output.toDataURL('image/jpeg',.9))}})}
function render(){
  const data=courses.map(c=>summarize(c)),total=data.length
  const pageTotal=Math.max(1,Math.ceil(total/coursesPerPage))
  coursePage=Math.max(0,Math.min(coursePage,pageTotal-1))
  document.querySelector('#summary').textContent=data.reduce((n,c)=>n+c.remaining,0)+'节剩余 · 已上'+data.reduce((n,c)=>n+c.completed,0)+'节'
  const reminders=data.filter(c=>c.next).sort((a,b)=>a.next.date.localeCompare(b.next.date)).slice(0,3)
  const nowDate=dateKey(new Date()),tomorrow=dateKey(new Date(Date.now()+86400000))
  document.querySelector('#lesson-reminders').innerHTML=reminders.length?`<h2>🔔 上课提醒</h2><div class="reminder-list">${reminders.map(c=>{const when=c.next.date===nowDate?'今天':c.next.date===tomorrow?'明天':c.next.date.slice(5).replace('-','月')+'日';return `<div class="reminder-item"><b>${esc(c.name)}</b> · ${when} ${c.startTime}–${c.endTime}${c.next.skipped?' · 已请假':''}</div>`}).join('')}</div>`:'<h2>🔔 上课提醒</h2><p class="reminder-empty">暂时没有待上的课程。</p>'
  document.querySelector('#course-count').textContent=total?`${total} 门兴趣班 · 第 ${coursePage+1}/${pageTotal} 页`:'0 门兴趣班'
  const previous=document.querySelector('#archive-list'),next=document.querySelector('#next-page')
  previous.hidden=next.hidden=pageTotal<2;previous.disabled=coursePage===0;next.disabled=coursePage===pageTotal-1
  const shown=data.slice(coursePage*coursesPerPage,(coursePage+1)*coursesPerPage)
  document.querySelector('#courses').innerHTML=shown.length?shown.map(c=>`<article class="course-row" aria-label="${esc(c.name)}课程"><div class="day-label">星期${c.weekdayLabel}</div><img class="course-art" src="${esc(coursePicture(c))}" alt="${esc(c.name)}配图"><div class="course-info"><h3>${esc(c.name)}</h3><p class="time">${c.startTime} – ${c.endTime}</p><div class="progress-caption">${c.remaining} 节剩余</div><div class="progress" role="progressbar" aria-label="${esc(c.name)}已上课时" aria-valuenow="${c.completed}" aria-valuemin="0" aria-valuemax="${c.total}"><span style="width:${c.percent}%"></span></div><div class="course-meta"><span>已上${c.completed} / 共${c.total}节</span><span>${c.next?'下次 '+c.next.date.slice(5).replace('-','月')+'日'+(c.next.skipped?' · 已请假':''):'本期已完成'}</span></div></div><div class="actions"><button class="settings" data-action="edit" data-id="${esc(c.id)}"><img class="ui-icon" src="assets/gear.svg" alt="">设置</button><button class="primary" data-action="history" data-id="${esc(c.id)}"><img class="ui-icon" src="assets/records.svg" alt="">上课记录</button><button class="manual-course" data-action="manual" data-id="${esc(c.id)}">补课 / 调课</button>${c.next?`<button class="secondary" data-action="skip" data-id="${esc(c.id)}" data-date="${c.next.date}"><img class="ui-icon" src="assets/calendar.svg" alt="">${c.next.skipped?'取消请假':'下次请假'}</button>`:''}</div></article>`).join(''):'<div class="empty-courses"><h3>准备开启新的兴趣之旅</h3><p>点击“添加兴趣班”，记录孩子喜欢的每一件事。</p></div>'
}
function edit(id){
  historyId=null
  const existing=courses.find(c=>c.id===id)
  const c=existing||{id:crypto.randomUUID(),name:'',total:16,initialUsed:0,weekday:6,startTime:'10:30',endTime:'12:00',startDate:dateKey(new Date()),skips:{},imageKey:'auto'}
  draftImage=c.customImage||''
  content.innerHTML=head(existing?c.name+' · 课程设置':'添加兴趣班')+`<form id="settings-form"><div class="form-grid"><label class="wide">课程名称<input name="name" placeholder="例如：羽毛球、钢琴、绘画" value="${esc(c.name)}" required maxlength="30"></label>${!existing?'<div class="quick-types wide" aria-label="常用课程">'+['羽毛球','游泳','绘画','钢琴','舞蹈','编程'].map(n=>`<button type="button" data-preset="${n}">${n}</button>`).join('')+'</div>':''}<div class="picture-field wide"><img id="picture-preview" src="${esc(coursePicture(c))}" alt="课程配图预览"><div><label>课程配图<select name="imageKey"><option value="auto">按课程名称自动匹配</option>${COURSE_TYPES.map(t=>`<option value="${t.key}" ${c.imageKey===t.key?'selected':''}>${t.label}</option>`).join('')}<option value="custom" ${c.imageKey==='custom'?'selected':''}>自己上传的图片</option></select></label><p id="match-note"></p><label class="upload-label">上传自己的图片<input type="file" id="image-file" accept="image/png,image/jpeg,image/webp"></label><small>PNG / JPG / WebP，最大 100 MB；仅保存在本机。</small></div></div><label>总课时（节）<input name="total" type="number" min="1" max="1000" step="1" value="${c.total}" required></label><label>开始日期之前已上（节）<input name="initialUsed" type="number" min="0" max="1000" step="1" value="${c.initialUsed}" required></label><label>自动统计开始日期<input name="startDate" type="date" min="2000-01-01" max="2100-12-31" value="${c.startDate}" required></label><label>每周上课日<select name="weekday">${['日','一','二','三','四','五','六'].map((w,i)=>`<option value="${i}" ${i===Number(c.weekday)?'selected':''}>星期${w}</option>`).join('')}</select></label><label>开始时间<input type="time" name="startTime" value="${c.startTime}" required></label><label>结束时间<input type="time" name="endTime" value="${c.endTime}" required></label></div><p class="hint">${existing?'修改课表会重新统计历史。中途换课表时，请把开始日期设为新课表生效日，并填写此前已上课时。':'默认 16 节、周六 10:30–12:00，请按实际情况修改。'} 每次课程结束扣 1 节，请假不扣课。</p><p class="error" id="error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-action="close">取消</button><button class="primary" type="submit">${existing?'保存设置':'添加课程'}</button></div>${existing?'<button class="delete-course" type="button" id="delete-course">删除这门课程</button>':''}</form>`
  const form=document.querySelector('#settings-form'), nameInput=form.elements.name, imageSelect=form.elements.imageKey
  function preview(){
    const matched=matchCourse(nameInput.value), type=imageSelect.value
    document.querySelector('#picture-preview').src=coursePicture({name:nameInput.value,imageKey:type,customImage:draftImage})
    document.querySelector('#match-note').textContent=type==='auto'?(matched.key==='other'?'未找到专属图片，可手动选择或上传。':'已匹配：'+matched.label):type==='custom'?(draftImage?'已使用上传图片':'请先上传一张图片'):'已选择：'+COURSE_TYPES.find(t=>t.key===type).label
  }
  nameInput.oninput=preview;imageSelect.onchange=preview
  form.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{nameInput.value=b.dataset.preset;imageSelect.value='auto';preview()})
  document.querySelector('#image-file').onchange=async e=>{
    const file=e.target.files[0];if(!file)return
    const error=document.querySelector('#error')
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>100*1024*1024){error.textContent='请选择不超过 100 MB 的 PNG、JPG 或 WebP 图片。';e.target.value='';return}
    const submit=form.querySelector('[type="submit"]');submit.disabled=true
    try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});const img=new Image();img.src=data;await img.decode();if(!form.isConnected)return;const cropped=await cropUploadedImage(data);if(!cropped)return;draftImage=cropped;imageSelect.value='custom';error.textContent='';preview()}catch{error.textContent='这张图片无法读取，请换一张图片。'}finally{submit.disabled=false}
  }
  preview();dialog.showModal()
  if(existing&&window.AndroidBridge){const calendarButton=document.createElement('button');calendarButton.type='button';calendarButton.className='secondary';calendarButton.textContent='同步手机日历';calendarButton.onclick=()=>window.AndroidBridge.syncCalendar(existing.id);form.querySelector('.form-actions').insertAdjacentElement('beforebegin',calendarButton)}
  form.onsubmit=e=>{
    e.preventDefault();const values=Object.fromEntries(new FormData(form)), n={...c,...values,customImage:values.imageKey==='custom'?draftImage:''}
    n.name=n.name.trim();for(const k of ['total','initialUsed','weekday'])n[k]=Number(n[k])
    if(!n.name||!Number.isInteger(n.total)||n.total<1||n.total>1000||!Number.isInteger(n.initialUsed)||n.initialUsed<0||n.initialUsed>n.total||n.endTime<=n.startTime){document.querySelector('#error').textContent='请检查课时数量；已上不能超过总课时，结束时间须晚于开始时间。';return}
    if(n.imageKey==='custom'&&!draftImage){document.querySelector('#error').textContent='请先上传图片，或选择自动匹配。';return}
    const next=existing?courses.map(x=>x.id===id?n:x):[...courses,n]
    if(persist(next)){dialog.close();notify(existing?'课程设置已保存':'新兴趣班已添加')}
  }
  if(existing)document.querySelector('#delete-course').onclick=()=>{
    content.innerHTML=head('删除课程')+`<p class="hint">确定删除“${esc(c.name)}”？这门课程的设置、上课记录和请假记录将永久删除，无法恢复。</p><div class="form-actions"><button class="secondary" id="cancel-remove">保留课程</button><button class="primary" id="confirm-remove">确认删除</button></div>`
    document.querySelector('#cancel-remove').onclick=()=>edit(id)
    document.querySelector('#confirm-remove').onclick=()=>{if(persist(courses.filter(x=>x.id!==id))){dialog.close();notify('课程已删除')}}
  }
}
function showArchived(){historyId=null;content.innerHTML=head('已收起课程')+courses.filter(c=>c.archived).map(c=>`<div class="record"><div>${esc(c.name)}<small>课时与记录均已保留</small></div><button class="secondary" data-restore="${esc(c.id)}">恢复课程</button></div>`).join('');if(!dialog.open)dialog.showModal();content.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{if(persist(courses.map(c=>c.id===b.dataset.restore?{...c,archived:false}:c))){dialog.close();notify('课程已恢复')}})}
document.querySelector('#add-course').onclick=()=>edit()
document.querySelector('#archive-list').onclick=()=>{coursePage=Math.max(0,coursePage-1);render()}
document.querySelector('#next-page').onclick=()=>{coursePage=Math.min(Math.ceil(courses.length/coursesPerPage)-1,coursePage+1);render()}
if(courses.some(c=>c.archived))persist(courses.map(c=>c.archived?{...c,archived:false}:c))
else render()
function showArchived(){
  historyId=null
  content.innerHTML=head('已收起课程')+courses.filter(c=>c.archived).map(c=>`<div class="record"><div>${esc(c.name)}<small>课时与记录均已保留</small></div><div class="archive-actions"><button class="secondary" data-restore="${esc(c.id)}">恢复课程</button><button class="archive-link" data-remove="${esc(c.id)}">删除</button></div></div>`).join('')
  if(!dialog.open)dialog.showModal()
  content.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>{if(persist(courses.map(c=>c.id===b.dataset.restore?{...c,archived:false}:c))){dialog.close();notify('课程已恢复')}})
  content.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.remove,c=courses.find(c=>c.id===id)
    content.innerHTML=head('删除课程')+`<p class="hint">确定删除“${esc(c.name)}”？这门课程的设置和上课记录将永久删除，无法恢复。</p><div class="form-actions"><button class="secondary" id="cancel-remove">保留课程</button><button class="primary" id="confirm-remove">确认删除</button></div>`
    document.querySelector('#cancel-remove').onclick=showArchived
    document.querySelector('#confirm-remove').onclick=()=>{if(persist(courses.filter(c=>c.id!==id))){dialog.close();notify('课程已删除')}}
  })
}

function manualRecord(id){
  const course=courses.find(c=>c.id===id);if(!course)return
  content.innerHTML=head(course.name+' · 补课 / 调课')+`<form id="manual-form"><div class="form-grid"><label>记录类型<select name="type"><option value="补课">补课（扣 1 节）</option><option value="调课">调课（扣 1 节）</option><option value="临时停课">临时停课（不扣课）</option></select></label><label>上课日期<input name="date" type="date" value="${dateKey(new Date())}" required></label><label>开始时间<input name="start" type="time" value="${course.startTime}" required></label><label>结束时间<input name="end" type="time" value="${course.endTime}" required></label><label class="wide">备注（可选）<input name="note" maxlength="60" placeholder="例如：周三补课"></label></div><p class="hint">若原定每周课程已取消，请在“上课记录”中将原日期标为请假，避免重复扣课。</p><p class="error" id="error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" data-action="close">取消</button><button class="primary" type="submit">保存记录</button></div></form>`
  dialog.showModal()
  document.querySelector('#manual-form').onsubmit=e=>{
    e.preventDefault();const values=Object.fromEntries(new FormData(e.target)),deduct=values.type!=='临时停课'
    if(values.end<=values.start){document.querySelector('#error').textContent='结束时间须晚于开始时间。';return}
    const record={id:crypto.randomUUID(),date:values.date,start:values.start,end:values.end,type:values.type,deduct,note:values.note.trim(),createdAt:new Date().toISOString()}
    if(persist(courses.map(c=>c.id===id?{...c,manualRecords:[...(c.manualRecords||[]),record]}:c))){dialog.close();notify(values.type+'记录已保存')}
  }
}
