function leaveTime(course,date){const entry=course.skips?.[date];if(entry&&typeof entry==='object'&&entry.markedAt)return new Date(entry.markedAt).toLocaleString('zh-CN');return entry?'此前版本未记录':''}
function courseGroup(course){const key=(COURSE_TYPES.find(t=>t.key===course.imageKey)||matchCourse(course.name)).key;const groups={basketball:'运动类',badminton:'运动类',pingpong:'运动类',football:'运动类',tennis:'运动类',swimming:'运动类',skating:'运动类',english:'语言与阅读',reading:'语言与阅读',writing:'语言与阅读',painting:'艺术类',piano:'艺术类',guitar:'艺术类',violin:'艺术类',dance:'艺术类',singing:'艺术类',martial:'运动类',robot:'思维与科技',chess:'思维与科技',math:'思维与科技'};return groups[key]||'其他兴趣'}
function courseType(course){return (COURSE_TYPES.find(t=>t.key===course.imageKey)||matchCourse(course.name)).label}
const courseColors=['FFF1F7','EAF6FF','FFF8DD','ECF9F1','F2EDFF','FFF0E7','EAF7F5','EEF3FF']
const cellBorder={top:{style:'thin',color:{rgb:'C9D9E8'}},bottom:{style:'thin',color:{rgb:'C9D9E8'}},left:{style:'thin',color:{rgb:'C9D9E8'}},right:{style:'thin',color:{rgb:'C9D9E8'}}}
function exportRecords(){
  if(!window.XLSX){notify('Excel 导出组件尚未加载，请刷新页面后重试');return}
  const generatedAt=new Date(),rows=[]
  courses.forEach(course=>{
    const summary=summarize(course,generatedAt)
    const counts={total:summary.total,used:summary.completed,remaining:summary.remaining}
    summary.records.slice().reverse().forEach(record=>rows.push({group:courseGroup(course),category:courseType(course),name:course.name,status:'进行中',...counts,date:record.date,start:course.startTime,end:course.endTime,type:record.skipped?'请假':'已上',leave:record.skipped?leaveTime(course,record.date):'',change:record.skipped?0:-1,note:record.skipped?'请假，不扣课':'课程结束后扣 1 节'}))
    if(course.initialUsed>0)rows.push({group:courseGroup(course),category:courseType(course),name:course.name,status:'进行中',...counts,date:`${course.startDate} 前`,start:'',end:'',type:'历史已上',leave:'',change:-course.initialUsed,note:'由“此前已上课时”填写'})
  })
  rows.sort((a,b)=>{const order=`${a.group}|${a.category}|${a.name}`.localeCompare(`${b.group}|${b.category}|${b.name}`,'zh-CN');return order||String(b.date).localeCompare(String(a.date))})
  const header=['课程大类','课程分类','课程名称','课程状态','总课时','已上课时','剩余课时','上课日期','上课时间','下课时间','记录类型','请假登记时间','课时变化','说明']
  const data=rows.map(row=>[row.group,row.category,row.name,row.status,row.total,row.used,row.remaining,row.date,row.start,row.end,row.type,row.leave,row.change,row.note])
  const worksheet=XLSX.utils.aoa_to_sheet([header,...data])
  worksheet['!cols']=[{wch:12},{wch:14},{wch:16},{wch:11},{wch:10},{wch:12},{wch:12},{wch:15},{wch:12},{wch:12},{wch:12},{wch:22},{wch:10},{wch:28}]
  worksheet['!autofilter']={ref:`A1:N${Math.max(1,data.length+1)}`}
  const headerStyle={fill:{patternType:'solid',fgColor:{rgb:'2D5E8C'}},font:{bold:true,color:{rgb:'FFFFFF'}},alignment:{horizontal:'center',vertical:'center'},border:cellBorder}
  header.forEach((_,column)=>{const ref=XLSX.utils.encode_cell({r:0,c:column});worksheet[ref].s=headerStyle})
  const colorByCourse=new Map()
  rows.forEach((row,index)=>{
    if(!colorByCourse.has(row.name))colorByCourse.set(row.name,courseColors[colorByCourse.size%courseColors.length])
    const rowStyle={fill:{patternType:'solid',fgColor:{rgb:colorByCourse.get(row.name)}},font:{color:{rgb:'1F3D5C'}},alignment:{vertical:'center'},border:cellBorder}
    for(let column=0;column<header.length;column++){const ref=XLSX.utils.encode_cell({r:index+1,c:column});worksheet[ref].s=rowStyle}
  })
  const overview=XLSX.utils.aoa_to_sheet([['兴趣课时记录'],['导出时间',generatedAt.toLocaleString('zh-CN')],[],['颜色说明','同一课程使用同一种浅色填充，方便快速区分。'],['说明','请假记录不扣课；已上记录扣 1 节。']])
  overview['!cols']=[{wch:16},{wch:48}]
  overview.A1.s={fill:{patternType:'solid',fgColor:{rgb:'2D5E8C'}},font:{bold:true,color:{rgb:'FFFFFF',sz:14}},alignment:{horizontal:'center'},border:cellBorder}
  ;['A2','B2','A4','B4','A5','B5'].forEach(ref=>overview[ref].s={border:cellBorder,fill:{patternType:'solid',fgColor:{rgb:'EDF6FC'}}})
  const summaryHeader=['课程大类','课程分类','课程名称','总课时','已上课时','请假次数','剩余课时','每周上课日','上课时间','自动统计开始日期','下次课程']
  const summaryRows=courses.map(course=>{const item=summarize(course,generatedAt),leaves=item.records.filter(r=>r.skipped).length;return [courseGroup(course),courseType(course),course.name,item.total,item.completed,leaves,item.remaining,'星期'+item.weekdayLabel,course.startTime+'–'+course.endTime,course.startDate,item.next?item.next.date:'本期已完成']})
  const summarySheet=XLSX.utils.aoa_to_sheet([summaryHeader,...summaryRows])
  summarySheet['!cols']=[{wch:12},{wch:14},{wch:16},{wch:10},{wch:12},{wch:10},{wch:12},{wch:13},{wch:16},{wch:18},{wch:16}]
  summaryHeader.forEach((_,column)=>{const ref=XLSX.utils.encode_cell({r:0,c:column});summarySheet[ref].s=headerStyle})
  summaryRows.forEach((row,index)=>{const color=courseColors[index%courseColors.length],style={fill:{patternType:'solid',fgColor:{rgb:color}},font:{color:{rgb:'1F3D5C'}},alignment:{vertical:'center'},border:cellBorder};for(let column=0;column<summaryHeader.length;column++){summarySheet[XLSX.utils.encode_cell({r:index+1,c:column})].s=style}})
  summarySheet['!autofilter']={ref:`A1:K${Math.max(1,summaryRows.length+1)}`}
  const workbook=XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook,overview,'导出说明')
  XLSX.utils.book_append_sheet(workbook,summarySheet,'课程汇总')
  XLSX.utils.book_append_sheet(workbook,worksheet,'上课记录')
  XLSX.writeFile(workbook,`兴趣课时记录_${dateKey(generatedAt)}.xlsx`,{compression:true})
  notify('标准 Excel 表格已导出')
}
const exportButton=document.createElement('button')
exportButton.type='button';exportButton.className='export-records';exportButton.textContent='导出 Excel'
exportButton.addEventListener('click',exportRecords)
document.querySelector('.course-toolbar>div').prepend(exportButton)
