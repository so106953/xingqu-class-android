const pad = n => String(n).padStart(2, '0')
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function parseDate(s) { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,0,0,0,0) }
function summarize(course, now = new Date()) {
  const start = parseDate(course.startDate)
  start.setDate(start.getDate() + (Number(course.weekday)-start.getDay()+7)%7)
  const [h,m] = course.endTime.split(':').map(Number)
  let completed = Number(course.initialUsed), next = null
  const records = []
  for (let i=0; i<10400 && completed<course.total; i++) {
    const day = new Date(start); day.setDate(day.getDate()+i*7)
    const key = dateKey(day), skipped = !!(course.skips || {})[key]
    const end = new Date(day); end.setHours(h,m,0,0)
    if (end > now) { next = {date:key, skipped}; break }
    if (!skipped) completed++
    records.push({date:key, skipped, source:'regular', type:skipped?'请假':'已上',start:course.startTime,end:course.endTime,note:skipped?'请假，不扣课':'每周课程'})
  }
  const manual=(course.manualRecords||[]).map(r=>({...r,source:'manual',skipped:!r.deduct,type:r.type||'补课'}))
  manual.forEach(r=>{const end=new Date(parseDate(r.date));const [mh,mm]=(r.end||course.endTime).split(':').map(Number);end.setHours(mh,mm,0,0);if(r.deduct&&end<=now&&completed<course.total)completed++})
  records.push(...manual)
  records.sort((a,b)=>String(b.date).localeCompare(String(a.date)))
  return {...course, completed, remaining:Math.max(0,course.total-completed), percent:Math.round(completed/course.total*100), next, records, weekdayLabel:['日','一','二','三','四','五','六'][course.weekday]}
}
