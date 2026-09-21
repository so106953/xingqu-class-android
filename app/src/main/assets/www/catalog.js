const COURSE_TYPES = [
  {key:'basketball',label:'篮球',words:['篮球','basketball'],image:'assets/basketball.png'},
  {key:'english',label:'英语',words:['英语','英文','english'],image:'assets/english.png'},
  {key:'badminton',label:'羽毛球',words:['羽毛球','badminton'],source:'Badminton/3D/badminton_3d.png'},
  {key:'pingpong',label:'乒乓球',words:['乒乓','ping pong'],source:'Ping pong/3D/ping_pong_3d.png'},
  {key:'football',label:'足球',words:['足球','soccer','football'],source:'Soccer ball/3D/soccer_ball_3d.png'},
  {key:'tennis',label:'网球',words:['网球','tennis'],source:'Tennis/3D/tennis_3d.png'},
  {key:'swimming',label:'游泳',words:['游泳','swim'],source:'Person swimming/Default/3D/person_swimming_3d_default.png'},
  {key:'painting',label:'绘画',words:['绘画','美术','画画','素描','水彩','国画','painting','art'],source:'Artist palette/3D/artist_palette_3d.png'},
  {key:'piano',label:'钢琴',words:['钢琴','电子琴','键盘','piano'],source:'Musical keyboard/3D/musical_keyboard_3d.png'},
  {key:'guitar',label:'吉他',words:['吉他','尤克里里','guitar'],source:'Guitar/3D/guitar_3d.png'},
  {key:'violin',label:'小提琴',words:['小提琴','violin'],source:'Violin/3D/violin_3d.png'},
  {key:'dance',label:'舞蹈',words:['舞蹈','芭蕾','跳舞','街舞','拉丁','dance','ballet'],source:'Ballet shoes/3D/ballet_shoes_3d.png'},
  {key:'martial',label:'武术',words:['武术','跆拳道','空手道','柔道','功夫'],source:'Martial arts uniform/3D/martial_arts_uniform_3d.png'},
  {key:'robot',label:'编程',words:['编程','机器人','机器人','coding','scratch','python'],source:'Robot/3D/robot_3d.png'},
  {key:'chess',label:'棋类',words:['围棋','象棋','国际象棋','棋','chess'],source:'Chess pawn/3D/chess_pawn_3d.png'},
  {key:'math',label:'数学',words:['数学','珠心算','数独','算术','奥数','math'],source:'Abacus/3D/abacus_3d.png'},
  {key:'singing',label:'声乐',words:['声乐','唱歌','歌唱','主持','口才','朗诵','sing'],source:'Microphone/3D/microphone_3d.png'},
  {key:'reading',label:'阅读',words:['阅读','语文','读书','绘本','作文','reading'],source:'Open book/3D/open_book_3d.png'},
  {key:'skating',label:'轮滑',words:['轮滑','滑冰','溜冰','skate'],source:'Roller skate/3D/roller_skate_3d.png'},
  {key:'writing',label:'书法',words:['书法','写字','硬笔','练字'],source:'Writing hand/Default/3D/writing_hand_3d_default.png'},
  {key:'other',label:'其他兴趣',words:[],source:'Graduation cap/3D/graduation_cap_3d.png'}
].map(t=>({...t,image:t.image||`assets/courses/${t.key}.png`}))
const COURSE_SCENES={
  basketball:'assets/basketball.png',english:'assets/english.png',
  badminton:'assets/course-scenes/sports.png',pingpong:'assets/course-scenes/sports.png',football:'assets/course-scenes/sports.png',tennis:'assets/course-scenes/sports.png',swimming:'assets/course-scenes/sports.png',skating:'assets/course-scenes/sports.png',martial:'assets/course-scenes/sports.png',
  painting:'assets/course-scenes/arts.png',piano:'assets/course-scenes/arts.png',guitar:'assets/course-scenes/arts.png',violin:'assets/course-scenes/arts.png',dance:'assets/course-scenes/arts.png',singing:'assets/course-scenes/arts.png',
  reading:'assets/course-scenes/language.png',writing:'assets/course-scenes/language.png',
  robot:'assets/course-scenes/thinking.png',chess:'assets/course-scenes/thinking.png',math:'assets/course-scenes/thinking.png',other:'assets/course-scenes/thinking.png'
}
function matchCourse(name){const n=String(name).toLowerCase();return COURSE_TYPES.find(t=>t.words.some(w=>n.includes(w)))||COURSE_TYPES.at(-1)}
function coursePicture(c){if(c.imageKey==='custom'&&/^data:image\/(png|jpeg|webp);base64,/.test(c.customImage||''))return c.customImage;const type=COURSE_TYPES.find(t=>t.key===c.imageKey)||matchCourse(c.name);return COURSE_SCENES[type.key]||type.image}
if(typeof module!=='undefined')module.exports={COURSE_TYPES,matchCourse,coursePicture}
