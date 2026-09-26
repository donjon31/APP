/* Shared immutable definitions; private overrides live in the local profile export. */
function ensureLibraryProfile() {
  let changed=false;
  if(!data.userId){data.userId=crypto.randomUUID();changed=true;}
  if(!data.trainingLibraries||typeof data.trainingLibraries!=='object'){data.trainingLibraries={};changed=true;}
  if(!data.trainingLibraries[data.userId]){data.trainingLibraries[data.userId]={exercises:[],overrides:{},workouts:[]};changed=true;}
  const lib=data.trainingLibraries[data.userId];
  if(!Array.isArray(lib.exercises))lib.exercises=[];
  if(!Array.isArray(lib.workouts))lib.workouts=[];
  if(!lib.overrides||typeof lib.overrides!=='object')lib.overrides={};
  if(changed)localStorage.setItem(KEY,JSON.stringify(data));
  return lib;
}
function globalExercises() {
  const raws=Object.values(STRENGTH_PLANS).flatMap(plans=>plans.flatMap(p=>p[1]));
  ['Frivend|3|5','Squat|3|8','Bagskulder m. elastik|3|12','Bænkpres|3|8','Planken|3|1'].forEach(raw=>raws.push(raw));
  return [...new Map(raws.map(raw=>{const [name,,,equipment='',alternative='']=raw.split('|');return [name,{id:'global:'+name,name,equipment,alternative,shared:true}];})).values()];
}
function availableExercises() {
  return [...globalExercises(),...ensureLibraryProfile().exercises.filter(e=>e.userId===data.userId)];
}
function workoutRecords(mode) {
  const lib=ensureLibraryProfile();
  return [...STRENGTH_PLANS[mode].map(([name,raws],planIndex)=>{
    const key=mode+':'+name;
    return {id:key,name,shared:true,entries:lib.overrides[key]||raws.map((raw,i)=>{const [exercise,sets,reps]=raw.split('|');return {id:'seed:'+mode+':'+planIndex+':'+i,exerciseId:'global:'+exercise,sets,reps,original:raw};})};
  }),...lib.workouts.filter(w=>w.userId===data.userId)];
}
function workoutEntryRaw(entry) {
  const exercise=availableExercises().find(e=>e.id===entry.exerciseId);
  if(!exercise)return null;
  return [exercise.name,entry.sets,entry.reps,exercise.equipment||'',exercise.alternative||''].join('|');
}
function personalPlans() {
  return Object.fromEntries([0,1,2].map(mode=>[mode,workoutRecords(mode).map(w=>[w.name,w.entries.map(workoutEntryRaw).filter(Boolean)])]));
}
function workoutEntryId(mode,planIndex,index) {
  return workoutRecords(mode)[planIndex]?.entries.filter(e=>workoutEntryRaw(e)!==null)[index]?.id||String(index);
}
function editWorkoutEntries(mode,index,transform) {
  const lib=ensureLibraryProfile(),record=workoutRecords(mode)[index];
  if(!record)throw Error('Workout not found');
  const entries=transform(record.entries.map(e=>({...e})));
  if(record.shared)lib.overrides[record.id]=entries;
  else lib.workouts.find(w=>w.id===record.id&&w.userId===data.userId).entries=entries;
}
function libraryName(value){return String(value||'').trim().replaceAll('|','·').slice(0,100);}
function createPrivateExercise(name) {
  const clean=libraryName(name);if(!clean)throw Error('Navn mangler');
  const lib=ensureLibraryProfile();
  if(availableExercises().some(e=>e.name.toLocaleLowerCase()===clean.toLocaleLowerCase()))throw Error('Øvelsen findes allerede i biblioteket');
  const exercise={id:crypto.randomUUID(),userId:data.userId,name:clean};lib.exercises.push(exercise);return exercise;
}
function visibleCustomFoods() {
  return (data.customFoods||[]).filter(f=>!f.userId||f.userId===data.userId);
}
function saveBasicFood(values) {
  ensureLibraryProfile();
  const name=libraryName(values.name),kcal=Number(values.kcal),protein=Number(values.protein);
  if(!name||!['g','ml'].includes(values.unit)||!Number.isFinite(kcal)||kcal<0||kcal>1000||!Number.isFinite(protein)||protein<0||protein>100)throw Error('Tjek navn og næringsindhold pr. 100 g/ml');
  const food={id:crypto.randomUUID(),userId:data.userId,source:'manual',name,brand:libraryName(values.brand),kcal,protein,unit:values.unit};
  data.customFoods.push(food);return food;
}
