/* UI layer. All records stay in the original HARPEX local data model. */
const UI_ICONS = {"pulse":"<path d=\"M5 4v16M19 4v16M5 12h14\"/>","home":"<path d=\"m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z\"/>","plan":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"3\"/><path d=\"M7 3v4m10-4v4M3 11h18\"/>","train":"<path d=\"M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12\"/>","fuel":"<path d=\"M7 3v7m-3-7v5c0 2 6 2 6 0V3M7 10v11m11 0V3c-4 0-5 10 0 10\"/>","recovery":"<path d=\"M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z\"/>","progress":"<path d=\"M4 4v16h16M7 14l4-4 4 2 5-6\"/>","profile":"<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21v-2a8 8 0 0 1 16 0v2\"/>","chat":"<path d=\"M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 1v-9.5A8.5 8.5 0 0 1 21 11.5Z\"/><path d=\"M8 10h8M8 14h5\"/>","arrow":"<path d=\"M5 12h14m-6-6 6 6-6 6\"/>","plus":"<path d=\"M12 5v14M5 12h14\"/>","check":"<path d=\"m5 12 4 4L19 6\"/>","spark":"<path d=\"m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z\"/>","more":"<circle cx=\"5\" cy=\"12\" r=\"1\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/><circle cx=\"19\" cy=\"12\" r=\"1\"/>"};
const uiIcon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (UI_ICONS[name] || UI_ICONS.pulse) + '</svg>';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
  if (window.parent !== window) window.parent.postMessage({type:'harpex-theme',theme:document.documentElement.dataset.theme,view:document.getElementById('onboarding').hidden?'app':'onboarding'},location.origin);
  const dark = document.documentElement.dataset.theme === 'dark';
  document.querySelector('meta[name="theme-color"]').content=dark?'#111111':'#ffffff';
  document.querySelectorAll('[data-ui="theme"]').forEach(button=>{
    button.setAttribute('aria-label',dark?'Skift til lyst tema':'Skift til mørkt tema');
    button.setAttribute('title',dark?'Lyst tema':'Mørkt tema');
    button.innerHTML=dark?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>':uiIcon('recovery');
  });
  document.querySelectorAll('[data-theme-choice]').forEach(button=>{
    const active=button.dataset.themeChoice===document.documentElement.dataset.theme;
    button.setAttribute('aria-pressed',String(active));
    button.classList.toggle('selected',active);
  });
}
document.addEventListener('click',event=>{
  const toggle=event.target.closest('[data-ui="theme"]');
  const choice=event.target.closest('[data-theme-choice]');
  if(!toggle&&!choice)return;
  const theme=choice?.dataset.themeChoice||(document.documentElement.dataset.theme==='dark'?'light':'dark');
  applyTheme(theme);
  try{localStorage.setItem('harpex-theme',theme)}catch{}
});

const uiNumber = value => new Intl.NumberFormat('da-DK', {maximumFractionDigits:1}).format(value);
// Only the same-origin simulator can control the embedded app.
window.addEventListener('message', event => {
  if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'harpex-simulator') return;
  if (event.data.action === 'theme') applyTheme(event.data.theme);
  if (event.data.action === 'onboarding') {
    startOnboarding();
    document.getElementById('onboarding').scrollTop = 0;
  }
  if (event.data.action === 'home') {
    if (!document.getElementById('onboarding').hidden) closeOnboarding(true);
    else showTab('home');
    window.scrollTo({top:0,behavior:'instant'});
  }
});
const pageCopy = {
  home: ['I dag', 'Træning, mad og restitution.', 'Overblik'],
  plan: ['Kalender', 'Dine træningspas og kampe.', 'Kalender'],
  train: ['Træning', 'Vælg dit pas, og log dine øvelser.', 'Træning'],
  fuel: ['Mad & energi', 'Måltider, inspiration og dine daglige mål.', 'Mad & energi'],
  recovery: ['Restitution', 'Dit daglige check-in.', 'Restitution'],
  progress: ['Udvikling', 'Dine løft og målinger over tid.', 'Udvikling'],
  profile: ['Profil', 'Dine mål og indstillinger.', 'Profil'],
  chat: ['HARPEX AI', 'Spørg om træning, mad og restitution.', 'HARPEX AI']
};
const originalRender = render;
render = function () { originalRender(); renderDashboard(); };
const originalShowTab = showTab;
showTab = function (id) {
  if (!pageCopy[id]) return;
  originalShowTab(id);
  const [title, subtitle, crumb] = pageCopy[id];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = subtitle;
  document.getElementById('breadcrumb').textContent = crumb;
  document.querySelector('.heading-action').hidden = id !== 'home';
  document.title = 'HARPEX · ' + crumb;
  closeMoreMenu();
  document.querySelector('[data-ui="more"]').classList.toggle('active',['plan','recovery','progress','profile'].includes(id));
  if (id === 'chat') renderChat();
};
function renderDashboard() {
  const meals = sameDay(data.meals);
  const kcal = meals.reduce((sum,m) => sum + Number(m.kcal || 0),0);
  const protein = meals.reduce((sum,m) => sum + Number(m.protein || 0),0);
  const kcalGoal = Number(currentKcalGoal()) || 0;
  const proteinGoal = Number(data.profile.proteinGoal) || 0;
  const checkin = data.recovery[today()];
  const score = readiness();
  const kcalPercent = kcalGoal ? Math.min(100,kcal / kcalGoal * 100) : 0;
  const proteinPercent = proteinGoal ? Math.min(100,protein / proteinGoal * 100) : 0;
  document.getElementById('topDate').textContent = new Date().toLocaleDateString('da-DK',{day:'numeric',month:'long'});
  const start = weekStart(today());
  const lifts = data.lifts.filter(l => l.date >= start && l.date <= shiftDate(start,6));
  const trainingDays = new Set(lifts.map(l => l.date)).size;
  document.getElementById('weekSummary').textContent = trainingDays + ' træningsdage logget';
  document.getElementById('dashboardWeek').innerHTML = Array.from({length:7},(_,i) => {
    const date=shiftDate(start,i);
    const active=date===today();
    const logged=data.lifts.some(l=>l.date===date)||data.events.some(e=>e.date===date);
    return '<button class="week-dot '+(active?'current ':'')+(logged?'has-log':'')+'" data-dashboard-date="'+date+'" aria-label="Åbn '+esc(dateText(date))+' i kalender" '+(active?'aria-current="date"':'')+'><span>'+['M','T','O','T','F','L','S'][i]+'</span><strong>'+Number(date.slice(-2))+'</strong></button>';
  }).join('');
  document.getElementById('dashboardStats').innerHTML =
    '<article class="stat-card calorie-card"><div><span class="stat-label">'+uiIcon('fuel')+'Kalorier i dag</span><strong class="stat-number">'+uiNumber(kcal)+' <small>kcal</small></strong><span class="stat-detail">'+(kcalGoal?uiNumber(Math.max(0,kcalGoal-kcal))+' tilbage af '+uiNumber(kcalGoal)+' kcal':'Tilføj dit mål i Profil')+'</span></div><div class="ring" aria-label="'+Math.round(kcalPercent)+' procent af kaloriemål"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="ring-bg" cx="50" cy="50" r="42"/><circle class="ring-fill" cx="50" cy="50" r="42" stroke-dasharray="'+(kcalPercent*2.639).toFixed(1)+' 263.9"/></svg>'+uiIcon('fuel').replace('<svg ','<svg class="ring-icon" ')+'</div></article>'+
    '<article class="stat-card"><span class="stat-label">'+uiIcon('train')+'Protein</span><div><strong class="stat-number">'+uiNumber(protein)+' <small>g</small></strong><span class="stat-detail">'+(proteinGoal?'af '+uiNumber(proteinGoal)+' g dagligt':'Angiv et mål i Profil')+'</span><div class="stat-track"><i style="width:'+proteinPercent+'%"></i></div></div></article>'+
    '<article class="stat-card"><span class="stat-label">'+uiIcon('recovery')+'Restitution</span><div><strong class="stat-number">'+(score===null?'—':score)+' <small>'+(score===null?'':'/ 100')+'</small></strong><span class="stat-detail">'+(checkin?uiNumber(checkin.sleep)+' timers søvn':'Klar efter dit check-in')+'</span><div class="stat-track"><i style="width:'+(score||0)+'%"></i></div></div></article>';
  if (!future().length) document.getElementById('next').innerHTML='<div class="empty-state"><span class="icon-tile">'+uiIcon('plan')+'</span><div><strong>Din kalender venter på dig</strong><p>Tilføj din næste træning eller kamp.</p></div></div><button class="text-button" data-action="tab" data-value="plan">Tilføj aktivitet '+uiIcon('plus')+'</button>';
  document.getElementById('checkinText').textContent=checkin?'Dit check-in er gemt. '+uiNumber(checkin.sleep)+' timers søvn og '+checkin.energy+'/10 i energi i dag.':'Søvn, energi og ømhed. Et kort check-in giver et bedre overblik.';
  const recent = [
    ...sameDay(data.lifts).slice(-3).map(l=>({icon:'train',name:l.exercise,detail:l.sets+' × '+l.reps+(l.kg?' · '+l.kg+' kg':''),kind:'TRÆNING'})),
    ...meals.slice(-3).map(m=>({icon:'fuel',name:m.name,detail:uiNumber(m.kcal)+' kcal · '+uiNumber(m.protein)+' g protein',kind:'MÅLTID'}))
  ].slice(-4);
  document.getElementById('recentActivity').innerHTML=recent.length?recent.map(item=>'<div class="activity-row"><span class="icon-tile">'+uiIcon(item.icon)+'</span><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.detail)+'</small></div><span>'+item.kind+'</span></div>').join(''):'<div class="empty-state"><span class="icon-tile">'+uiIcon('pulse')+'</span><div><strong>En frisk start</strong><p>Din træning og dine måltider dukker op her.</p></div></div>';
}
function closeMoreMenu() {
  document.getElementById('moreMenu').hidden=true;
  document.getElementById('menuScrim').hidden=true;
  document.querySelector('[data-ui="more"]').setAttribute('aria-expanded','false');
}
function openMoreMenu() {
  document.getElementById('moreMenu').hidden=false;
  document.getElementById('menuScrim').hidden=false;
  document.querySelector('[data-ui="more"]').setAttribute('aria-expanded','true');
}
document.getElementById('menuScrim').addEventListener('click',closeMoreMenu);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMoreMenu()});
document.addEventListener('click',e=>{
  const ui=e.target.closest('[data-ui]');
  if(ui?.dataset.ui==='more') document.getElementById('moreMenu').hidden?openMoreMenu():closeMoreMenu();
  if(ui?.dataset.ui==='more-close')closeMoreMenu();
  if(ui?.dataset.ui==='onboard')startOnboarding(true);
  const day=e.target.closest('[data-dashboard-date]');
  if(day) {
    selectedDate=day.dataset.dashboardDate;
    weekAnchor=weekStart(selectedDate);
    monthAnchor=selectedDate.slice(0,7)+'-01';
    localStorage.setItem('puls-selected-date',selectedDate);
    document.querySelector('#eventForm [name=date]').value=selectedDate;
    render();
    showTab('plan');
  }
});

// Onboarding is deliberately separate from the saved profile until Finish.
const ONBOARDING_DRAFT_KEY='puls-onboarding-draft-v1';
let onboardingStep=0;
let onboardingDraft;
let previousFocus;
function draftFromProfile() {
  const e=data.energy||{};
  return {sport:data.profile.sport||'',sex:e.sex||'',age:e.age||'',height:e.height||'',weight:e.weight||'',
    sportSessions:Number(e.sportSessions)||0,strengthSessions:Number(e.strengthSessions)||0,matchSessions:Number(e.matchSessions)||0,
    dayType:e.dayType||'',energyGoal:e.energyGoal||'',equipment:[...(data.profile.equipment||[])],useAsGoal:e.useAsGoal??true};
}
function readDraft() {
  let saved;
  try{saved=JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY))}catch{}
  const fallback=draftFromProfile();
  if(!saved||typeof saved!=='object')return fallback;
  return {...fallback,...saved,equipment:Array.isArray(saved.equipment)?saved.equipment.filter(x=>['Vægtstang','Håndvægte','Trap bar','Kabler','Medicinbold','Pull-up bar'].includes(x)):fallback.equipment};
}
function persistDraft(){try{localStorage.setItem(ONBOARDING_DRAFT_KEY,JSON.stringify(onboardingDraft))}catch{}}
function startOnboarding(restart=false) {
  previousFocus=document.activeElement;
  onboardingDraft=restart?draftFromProfile():readDraft();
  if(restart)persistDraft();
  onboardingStep=restart?1:0;
  document.getElementById('onboarding').hidden=false;
  document.getElementById('appShell').inert=true;
  document.body.style.overflow='hidden';
  renderOnboarding();
}
function closeOnboarding(preview=false) {
  document.getElementById('onboarding').hidden=true;
  document.getElementById('appShell').inert=false;
  document.body.style.overflow='';
  if(preview)sessionStorage.setItem('puls-onboarding-preview','true');
  showTab('home');
  applyTheme(document.documentElement.dataset.theme);
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
}
const onboardingSteps=[
  ['Din træning.\nDin rytme.','Træning, mad og restitution — samlet i en plan, der passer til dig.'],
  ['Hvad træner du?','Vi bruger din sport til at gøre HARPEX til dit eget.'],
  ['Hvilket køn skal vi\nbruge i beregningen?','Det bruges kun til at tilpasse dit energiestimat.'],
  ['Lad os lære dig\nlidt bedre at kende.','Dine mål starter med et par enkle oplysninger.'],
  ['Hvordan ser din\ntræningsuge ud?','Tænk på en normal uge. Du kan altid ændre det.'],
  ['Hvad fylder\ni din hverdag?','Din aktivitet uden for træning tæller også med.'],
  ['Hvad vil du\narbejde hen imod?','Vælg det udgangspunkt, der passer til dig lige nu.'],
  ['Hvad har du\nat træne med?','Vælg dit udstyr. Dine øvelser tilpasses det, du har.'],
  ['Din HARPEX\ner klar.','Et personligt udgangspunkt. Du kan justere det hele i Profil.']
];
function option(value,label,detail='',icon='') {
  const key={1:'sport',2:'sex',5:'dayType',6:'energyGoal'}[onboardingStep];
  const selected=onboardingDraft[key]===value;
  return '<button type="button" class="onboarding-option '+(selected?'selected':'')+'" role="radio" aria-checked="'+selected+'" data-choice="'+esc(value)+'">'+(icon?uiIcon(icon):'')+'<span>'+label+(detail?'<small>'+detail+'</small>':'')+'</span><span class="option-check">'+uiIcon('check')+'</span></button>';
}
function onboardingBody() {
  if(onboardingStep===0)return '<div class="welcome-emblem"><span class="brand-mark">'+uiIcon('pulse')+'</span></div><div class="welcome-list">'+[
    ['train','Træn med retning','Styrkepas, kampe og kalender.'],
    ['fuel','Find din energi','Måltider, protein og personlige mål.'],
    ['recovery','Giv plads til restitution','Søvn, energi og udvikling over tid.']
  ].map(([icon,title,detail])=>'<div><span class="icon-tile">'+uiIcon(icon)+'</span><span><strong>'+title+'</strong><small>'+detail+'</small></span></div>').join('')+'</div>';
  if(onboardingStep===1)return '<div class="onboarding-options" role="radiogroup" aria-label="Din sport">'+[
    ['Håndbold','Håndbold','På banen. I styrkerummet.','train'],['Fodbold','Fodbold','Fra træningsdag til kampdag.','train'],['Basketball','Basketball','Styrke til dit spil.','train'],['Anden sport','Anden sport','HARPEX følger din rytme.','pulse']
  ].map(x=>option(...x)).join('')+'</div>';
  if(onboardingStep===2)return '<div class="onboarding-options" role="radiogroup" aria-label="Køn til beregningen">'+option('male','Mand')+option('female','Kvinde')+option('unspecified','Vil ikke angive','Bruger et bredere startpunkt.')+'</div>';
  if(onboardingStep===3)return '<div class="onboarding-fields">'+[
    ['age','Alder','år',13,100,1,'25'],['height','Højde','cm',120,230,1,'180'],['weight','Vægt','kg',30,250,.1,'75']
  ].map(([key,label,unit,min,max,step,placeholder])=>'<label class="measurement-field"><span>'+label+'</span><span class="measurement-input"><input name="'+key+'" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="'+step+'" required value="'+esc(onboardingDraft[key])+'" placeholder="'+placeholder+'"><span>'+unit+'</span></span></label>').join('')+'</div>';
  if(onboardingStep===4)return [
    ['sportSessions','Sportstræning','Pas pr. uge',14],['strengthSessions','Styrketræning','Pas pr. uge',14],['matchSessions','Kampe','Kampe pr. uge',7]
  ].map(([key,label,detail,max])=>'<div class="schedule-stepper"><div><strong>'+label+'</strong><small>'+detail+'</small></div><div class="stepper-control"><button type="button" data-stepper="'+key+'" data-delta="-1" aria-label="Færre '+label.toLowerCase()+'" '+(Number(onboardingDraft[key])<=0?'disabled':'')+'>−</button><output aria-label="'+label+'" aria-live="polite">'+onboardingDraft[key]+'</output><button type="button" data-stepper="'+key+'" data-delta="1" aria-label="Flere '+label.toLowerCase()+'" '+(Number(onboardingDraft[key])>=max?'disabled':'')+'>+</button></div></div>').join('');
  if(onboardingStep===5)return '<div class="onboarding-options" role="radiogroup" aria-label="Din hverdag">'+option('school','Skole eller studie','Det meste af dagen sidder jeg ned.','plan')+option('office','Kontorarbejde','Mest stillesiddende arbejde.','plan')+option('walking','På benene','Jeg står og går en stor del af dagen.','progress')+option('physical','Fysisk arbejde','Min hverdag er fysisk krævende.','train')+'</div>';
  if(onboardingStep===6)return '<div class="onboarding-options" role="radiogroup" aria-label="Dit mål">'+option('maintain','Hold vægten. Byg din form.','Energi til træning og en stabil vægt.','pulse')+option('gain','Tag gradvist på.','Et højere energimål som udgangspunkt.','progress')+'</div>';
  if(onboardingStep===7)return '<div class="onboarding-equipment" role="group" aria-label="Træningsudstyr">'+['Vægtstang','Håndvægte','Trap bar','Kabler','Medicinbold','Pull-up bar'].map(eq=>{
    const selected=onboardingDraft.equipment.includes(eq);
    return '<button type="button" class="onboarding-option '+(selected?'selected':'')+'" aria-pressed="'+selected+'" data-equipment="'+eq+'"><span>'+eq+'</span><span class="option-check">'+uiIcon('check')+'</span></button>';
  }).join('')+'</div><p class="foot">Intet udstyr? Fortsæt uden at vælge noget.</p>';
  const estimate=estimateDraft();
  return '<div class="onboarding-summary"><span class="icon-tile">'+uiIcon('check')+'</span>'+
    '<div class="summary-row"><span>Din sport</span><strong>'+esc(onboardingDraft.sport)+'</strong></div>'+
    '<div class="summary-row"><span>Din uge</span><strong>'+onboardingDraft.sportSessions+' sport · '+onboardingDraft.strengthSessions+' styrke · '+onboardingDraft.matchSessions+' kampe</strong></div>'+
    '<div class="summary-row"><span>Dit fokus</span><strong>'+(onboardingDraft.energyGoal==='gain'?'Gradvis vægtøgning':'Vedligeholde vægt')+'</strong></div>'+
    '<div class="summary-row"><span>Estimeret energi</span><strong>'+(estimate?uiNumber(estimate.average)+' kcal / dag':'—')+'</strong></div></div>'+
    '<label class="summary-optin"><input name="useAsGoal" type="checkbox" '+(onboardingDraft.useAsGoal?'checked':'')+'>Brug estimatet som mit kaloriemål</label>'+
    '<p class="foot">Et startpunkt, som varierer med din krop og aktivitet. Beregningen er vejledende'+(Number(onboardingDraft.age)<20?' og ekstra usikker under 20 år':'')+'.</p>';
}
function estimateDraft() {
  const energy=data.energy;
  try{data.energy={...onboardingDraft};return estimateEnergy()}finally{data.energy=energy}
}
function renderOnboarding(focusHeading=true) {
  const [title,description]=onboardingSteps[onboardingStep];
  const root=document.getElementById('onboarding');
  root.innerHTML='<div class="onboarding-top"><span class="brand"><span class="brand-mark">'+uiIcon('pulse')+'</span>HARPEX</span><div class="onboarding-actions"><button type="button" class="theme-toggle icon-button" data-ui="theme" aria-label="Skift til mørkt tema" title="Skift tema"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg></button><button type="button" class="text-button" data-onboard="preview">Se appen først '+uiIcon('arrow')+'</button></div></div>'+
    '<div class="onboarding-layout"><aside class="onboarding-context"><div class="context-label"><span></span>BYGGET OMKRING DIG</div><h2>En plan, der<br>følger dig.</h2><p>Fra den første træning til det sidste måltid. Find din rytme med HARPEX.</p><div class="feature-chips"><span>Træning</span><span>Mad</span><span>Restitution</span></div></aside>'+
    '<form id="onboardingForm" class="onboarding-pane"><div class="onboarding-nav"><button type="button" class="onboarding-back" data-onboard="back" aria-label="Forrige trin" '+(!onboardingStep?'style="visibility:hidden"':'')+'>'+uiIcon('arrow')+'</button><div class="onboarding-progress" role="progressbar" aria-label="Opsætning" aria-valuemin="0" aria-valuemax="8" aria-valuenow="'+onboardingStep+'"><i style="width:'+Math.max(4,onboardingStep/8*100)+'%"></i></div><span class="step-count">'+(onboardingStep===0?'START':String(onboardingStep).padStart(2,'0')+' / 08')+'</span></div>'+
    '<h1 id="onboardingTitle" tabindex="-1">'+title.replace(/\n/g,'<br>')+'</h1><p class="onboarding-description">'+description+'</p><div class="onboarding-content">'+onboardingBody()+'<p id="onboardingError" class="onboarding-error" role="alert"></p></div><div class="onboarding-bottom"><button type="submit" class="button onboarding-continue">'+(onboardingStep===0?'Kom i gang':onboardingStep===8?'Åbn min HARPEX':'Fortsæt')+'</button><p>'+(onboardingStep===0?'Dine oplysninger gemmes kun på din enhed.':'Dit tempo. Dine mål. Du kan altid ændre dem.')+'</p></div></form></div>';
  applyTheme(document.documentElement.dataset.theme);
  if(focusHeading) document.getElementById('onboardingTitle').focus({preventScroll:true});
}
document.getElementById('onboarding').addEventListener('input',e=>{
  if(['age','height','weight'].includes(e.target.name)){onboardingDraft[e.target.name]=e.target.value;persistDraft()}
  if(e.target.name==='useAsGoal'){onboardingDraft.useAsGoal=e.target.checked;persistDraft()}
});
document.getElementById('onboarding').addEventListener('click',e=>{
  const button=e.target.closest('button');
  if(!button)return;
  if(button.dataset.onboard==='preview'){closeOnboarding(true);return}
  if(button.dataset.onboard==='back'){onboardingStep=Math.max(0,onboardingStep-1);renderOnboarding();return}
  if(button.dataset.choice) {
    const key={1:'sport',2:'sex',5:'dayType',6:'energyGoal'}[onboardingStep];
    onboardingDraft[key]=button.dataset.choice;persistDraft();renderOnboarding(false);
    document.querySelector('[data-choice="'+button.dataset.choice+'"]')?.focus({preventScroll:true});
  }
  if(button.dataset.equipment) {
    const eq=button.dataset.equipment;
    onboardingDraft.equipment=onboardingDraft.equipment.includes(eq)?onboardingDraft.equipment.filter(x=>x!==eq):[...onboardingDraft.equipment,eq];
    persistDraft();renderOnboarding(false);document.querySelector('[data-equipment="'+eq+'"]')?.focus({preventScroll:true});
  }
  if(button.dataset.stepper) {
    const key=button.dataset.stepper,max=key==='matchSessions'?7:14;
    onboardingDraft[key]=Math.min(max,Math.max(0,Number(onboardingDraft[key])+Number(button.dataset.delta)));
    persistDraft();renderOnboarding(false);
    document.querySelector('[data-stepper="'+key+'"][data-delta="'+button.dataset.delta+'"]')?.focus({preventScroll:true});
  }
});
document.getElementById('onboarding').addEventListener('submit',e=>{
  e.preventDefault();
  const requiredKey={1:'sport',2:'sex',5:'dayType',6:'energyGoal'}[onboardingStep];
  if(requiredKey&&!onboardingDraft[requiredKey]) {
    document.getElementById('onboardingError').textContent='Vælg en mulighed for at fortsætte.';
    return;
  }
  if(onboardingStep===3&&!e.target.reportValidity())return;
  if(onboardingStep<8){onboardingStep++;persistDraft();renderOnboarding();document.getElementById('onboarding').scrollTop=0;return}
  const estimate=estimateDraft();
  if(!estimate){onboardingStep=3;renderOnboarding();document.getElementById('onboardingError').textContent='Tjek alder, højde og vægt.';return}
  data.profile={...data.profile,sport:onboardingDraft.sport,equipment:[...onboardingDraft.equipment]};
  data.energy={...data.energy,sex:onboardingDraft.sex,age:Number(onboardingDraft.age),height:Number(onboardingDraft.height),weight:Number(onboardingDraft.weight),
    sportSessions:Number(onboardingDraft.sportSessions),strengthSessions:Number(onboardingDraft.strengthSessions),matchSessions:Number(onboardingDraft.matchSessions),
    dayType:onboardingDraft.dayType,energyGoal:onboardingDraft.energyGoal,useAsGoal:!!onboardingDraft.useAsGoal};
  data.onboarding={completed:true,version:1,completedAt:new Date().toISOString()};
  try {
    save();
    const ef=document.getElementById('energyForm'),pf=document.getElementById('profileForm');
    Object.entries(data.energy).forEach(([k,v])=>{if(ef.elements[k])ef.elements[k].value=v});
    pf.elements.sport.value=data.profile.sport;
    [...pf.elements.equipment.options].forEach(o=>o.selected=data.profile.equipment.includes(o.value));
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    closeOnboarding();toast('Din HARPEX er klar');
  } catch {document.getElementById('onboardingError').textContent='Kunne ikke gemme på enheden. Prøv igen.'}
});

// Future AI service boundary: demo mode never makes a network request.
const CHAT_KEY='puls-chat-demo-v1';
let chatHistory=[];
try {
  const saved=JSON.parse(localStorage.getItem(CHAT_KEY)||'[]');
  if(Array.isArray(saved))chatHistory=saved.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string').slice(-100);
}catch{}
function renderChat() {
  const el=document.getElementById('chatMessages');
  const welcome='<div class="chat-welcome"><span class="icon-tile">'+uiIcon('spark')+'</span><h2>Hvad vil du<br>have hjælp til?</h2><p>Her får dine spørgsmål om hverdagen som atlet snart et sted at lande.</p><div class="prompt-list">'+['Hvordan ser min træningsuge ud?','Hjælp mig med dagens måltider','Hvordan følger jeg min restitution?'].map(text=>'<button type="button" class="prompt-button" data-prompt="'+esc(text)+'">'+text+uiIcon('arrow')+'</button>').join('')+'</div></div>';
  el.innerHTML=chatHistory.length?chatHistory.map(m=>'<div class="chat-message '+m.role+'">'+(m.role==='assistant'?'<small>HARPEX AI · DEMOSVAR</small>':'')+esc(m.text)+'</div>').join(''):welcome;
  el.scrollTop=el.scrollHeight;
}
function demoReply(message) {
  const text=message.toLocaleLowerCase('da-DK');
  let detail='Du kan allerede logge træning, måltider og restitution i HARPEX.';
  if(/uge|plan|træning/.test(text)) {
    const start=weekStart(today()),events=data.events.filter(e=>e.date>=start&&e.date<=shiftDate(start,6));
    detail='Din kalender har '+events.length+' planlagte aktiviteter denne uge. Åbn Kalender for at se eller tilføje dem.';
  }else if(/mad|måltid|protein|kalori/.test(text))detail='Under Mad & energi kan du finde måltidsforslag, søge produkter og logge det, du spiser.';
  else if(/søvn|restitution|energi/.test(text))detail='Under Restitution kan du gemme søvn, energi og ømhed i dit daglige check-in.';
  return 'Dette er et lokalt demosvar. AI er endnu ikke tilsluttet.\n\n'+detail+'\n\nNår AI forbindes, kan samtalen give personlige svar.';
}
function sendChat(text) {
  const cleaned=String(text||'').trim().slice(0,2000);
  if(!cleaned)return;
  chatHistory.push({role:'user',text:cleaned},{role:'assistant',text:demoReply(cleaned)});
  chatHistory=chatHistory.slice(-100);
  try{localStorage.setItem(CHAT_KEY,JSON.stringify(chatHistory))}catch{toast('Samtalen kunne ikke gemmes på enheden')}
  document.getElementById('chatInput').value='';
  document.querySelector('.send-button').disabled=true;
  renderChat();
  document.getElementById('chatInput').focus();
}
document.getElementById('chatForm').addEventListener('submit',e=>{e.preventDefault();sendChat(document.getElementById('chatInput').value)});
document.getElementById('chatInput').addEventListener('input',e=>{document.querySelector('.send-button').disabled=!e.target.value.trim()});
document.getElementById('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendChat(e.target.value)}});
document.getElementById('chatMessages').addEventListener('click',e=>{const button=e.target.closest('[data-prompt]');if(button)sendChat(button.dataset.prompt)});

renderDashboard();
showTab(document.querySelector('.panel.active')?.id||'home');
if(!data.onboarding?.completed&&!sessionStorage.getItem('puls-onboarding-preview'))startOnboarding();

applyTheme(document.documentElement.dataset.theme);
