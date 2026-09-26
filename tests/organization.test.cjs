const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const elements = {};
const handlers = {};
let writes = 0;
let uuid = 0;
const context = vm.createContext({
  document:{addEventListener(){},getElementById(id){return elements[id] ||= {innerHTML:'',textContent:''};}},
  data:{presets:[],meals:[],events:[]}, save(){writes++;},
  esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  handle(name,fn){handlers[name]=fn;}, crypto:{randomUUID(){return 'test-'+(++uuid);}},
  today(){return '2026-09-26';}, selectedDate:'2026-09-26',updateStrengthPicker(){}
});
vm.runInContext(fs.readFileSync(path.join(root,'organization.js'),'utf8'),context);
assert.equal(vm.runInContext('PRESET_CATEGORIES.length',context),6);
assert.equal(context.mealCategory({name:'Legacy'}),'Uden kategori');
assert.equal(context.mealCategory({category:'Hygge'}),'Hygge');
assert.equal(context.activityTimingError('18:00','19:30',false),'');
assert.notEqual(context.activityTimingError('18:00','17:30',false),'');
assert.notEqual(context.activityTimingError('18:00','18:00',false),'');
assert.equal(context.activityTimingError('23:30','01:00',true),'');
assert.notEqual(context.activityTimingError('18:00','19:00',true),'');
assert.notEqual(context.activityTimingError('25:00','26:00',false),'');
assert.match(context.activityTimeLabel({time:'18:00'}),/sluttid ikke angivet/);
assert.equal(context.activityTimeLabel({time:'23:30',endTime:'01:00',endsNextDay:true}),'23:30–01:00 (+1 dag)');
context.data.presets=[{id:'legacy',name:'Brød',kcal:300,protein:12},{id:'hygge',name:'Popcorn',category:'Hygge'}];
context.data.meals=[{id:'logged',name:'Brød'}];
context.renderPresetGroups();
assert.match(elements.presetCategories.innerHTML,/Uden kategori/);
context.deleteSavedMeal('legacy');
assert.equal(context.data.presets.length,1);
assert.equal(context.data.meals.length,1);
assert.match(elements.presetFeedback.innerHTML,/Fortryd/);
context.undoSavedMealDeletion();
assert.equal(context.data.presets.length,2);
assert.equal(context.data.presets[0].id,'legacy');
context.undoSavedMealDeletion();
assert.equal(context.data.presets.length,2);
assert.equal(writes,2);
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
for (const [name,next] of [['eventForm','liftForm'],['mealForm','recoveryForm']]) {
  const start = app.indexOf("handle('"+name+"',");
  const end = app.indexOf("handle('"+next+"',",start);
  assert.ok(start>=0&&end>start);
  vm.runInContext(app.slice(start,end),context);
}
vm.runInContext('resetMealMode=()=>{}; selectFoodView=()=>{}; resetActivityEditor=()=>{}',context);
const form={reset(){},elements:{date:{value:''}}};
handlers.mealForm({name:' Havregrød ',kcal:'350',protein:'20',category:'Morgenmad',presetOnly:'true'},form);
assert.equal(context.data.meals.length,1,'Saving a favorite must not log food');
assert.equal(context.data.presets.at(-1).name,'Havregrød');
assert.equal(context.data.presets.at(-1).category,'Morgenmad');
handlers.mealForm({name:'Snack',kcal:'200',protein:'15',category:'Efter træning',savePreset:'on'},form);
assert.equal(context.data.meals.length,2);
assert.equal(context.data.meals.at(-1).category,'Efter træning');
for(const type of ['Sportstræning','Styrke','Kamp']) handlers.eventForm({type,date:'2026-09-26',time:'18:00',endTime:'19:30'},form);
assert.equal(context.data.events.length,3);
const event=context.data.events[1];event.custom='preserve';
handlers.eventForm({editId:event.id,type:'Styrke',date:'2026-09-26',time:'19:00',endTime:'20:00'},form);
assert.equal(context.data.events.length,3,'Editing must not duplicate an activity');
assert.equal(context.data.events[1].endTime,'20:00');
assert.equal(context.data.events[1].custom,'preserve');
assert.throws(()=>handlers.eventForm({type:'Kamp',time:'20:00',endTime:'18:00'},form));
assert.equal(context.data.events.length,3);
handlers.eventForm({type:'Kamp',time:'23:00',endTime:'01:00',endsNextDay:'on'},form);
assert.equal(context.data.events.at(-1).endsNextDay,true);
console.log('PASS: categories, legacy data, deletion/undo, meal saving, activity times and editing');
