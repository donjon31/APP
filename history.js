/* Date-aware overview and actual, local nutrition/weight history. */
function historyDateValid(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && value>='1900-01-01' && value<='2100-12-31' && localDate(new Date(value+'T12:00:00')) === value;
}
function historyLabel(date, now=today()) {
  if (date===now) return 'I dag';
  if (date===shiftDate(now,-1)) return 'I går';
  return new Date(date+'T12:00:00').toLocaleDateString(appLocale(),{day:'numeric',month:'short',year:'numeric'});
}
function historyMonthBack(end, months) {
  const d=new Date(end+'T12:00:00'),day=d.getDate();
  d.setDate(1);d.setMonth(d.getMonth()-months);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
  d.setDate(Math.min(day,last));return localDate(d);
}
function historyRange(period,end,start) {
  if (period==='since') return [start,end];
  if (period==='month'||period==='year') return [shiftDate(historyMonthBack(end,period==='year'?12:1),1),end];
  return [shiftDate(end,1-Number(period)),end];
}
function historySeries(source,start,end) {
  const meals=new Map(),weights=new Map();
  source.meals.forEach(m=>{if(m.date>=start&&m.date<=end){const row=meals.get(m.date)||{kcal:0,count:0};row.kcal+=Number(m.kcal)||0;row.count++;meals.set(m.date,row);}});
  source.progress.forEach(m=>{if(m.type==='Vægt (kg)'&&m.date>=start&&m.date<=end&&Number(m.value)>0&&Number.isFinite(Number(m.value)))weights.set(m.date,Number(m.value));});
  const rows=[];
  for(let date=start;date<=end;date=shiftDate(date,1)) rows.push({date,kcal:meals.has(date)?meals.get(date).kcal:null,count:meals.get(date)?.count||0,weight:weights.get(date)??null});
  return rows;
}
let overviewDate=today(),historyPeriod='7',historyCustom=null;
function historyStart() {
  const dates=[...data.meals,...data.progress,...data.lifts].map(x=>x.date).filter(historyDateValid).sort();
  return historyDateValid(data.trackingStart)?data.trackingStart:dates[0]||today();
}
function selectOverviewDate(date) {
  if(!historyDateValid(date))return;
  overviewDate=date;selectedDate=date;weekAnchor=weekStart(date);monthAnchor=date.slice(0,7)+'-01';
  localStorage.setItem('puls-selected-date',date);
  document.querySelector('#eventForm [name=date]').value=date;
  updateStrengthPicker();render();showTab('home');
  window.scrollTo({top:0,behavior:'instant'});
}
const historyDashboardBase=renderDashboard;
renderDashboard=function() {
  historyDashboardBase();
  const date=overviewDate, label=historyLabel(date),meals=data.meals.filter(m=>m.date===date),lifts=data.lifts.filter(l=>l.date===date),events=data.events.filter(e=>e.date===date),check=data.recovery[date];
  const kcal=meals.reduce((n,m)=>n+(Number(m.kcal)||0),0),protein=meals.reduce((n,m)=>n+(Number(m.protein)||0),0);
  const historical=date!==today();
  const goal=historical?null:Number(currentKcalGoal())||null;
  document.getElementById('dashboardStats').innerHTML=`<button type="button" class="stat-card calorie-card history-calories" data-history-open><span><span class="stat-label">${uiIcon('fuel')}Kalorier · ${esc(label.toLowerCase())}</span><strong class="stat-number">${meals.length?uiNumber(kcal):'—'} <small>kcal</small></strong><span class="stat-detail">${!meals.length?'Ingen måltider registreret':goal?'Dagens mål: '+uiNumber(goal)+' kcal':meals.length+' måltider registreret'}</span></span><span class="history-open-label">Se udvikling ${uiIcon('arrow')}</span></button><article class="stat-card"><span class="stat-label">Protein</span><strong class="stat-number">${meals.length?uiNumber(protein):'—'} <small>g</small></strong><span class="stat-detail">Fra dagens madlog</span></article><article class="stat-card"><span class="stat-label">Søvn</span><strong class="stat-number">${check?uiNumber(check.sleep):'—'} <small>timer</small></strong><span class="stat-detail">${check?'Energi: '+esc(check.energy)+'/10':'Intet check-in registreret'}</span></article>`;
  if(document.getElementById('overviewDate')) document.getElementById('overviewDate').value=date;
  const start=weekStart(date);
  document.getElementById('dashboardWeek').innerHTML=Array.from({length:7},(_,i)=>{const d=shiftDate(start,i),logged=data.meals.some(m=>m.date===d)||data.lifts.some(l=>l.date===d);return `<button type="button" class="week-dot ${d===date?'current ':''}${logged?'has-log':''}" data-history-date="${d}" aria-label="Vis overblik for ${esc(historyLabel(d))}" aria-pressed="${d===date}"><span>${['M','T','O','T','F','L','S'][i]}</span><strong>${Number(d.slice(-2))}</strong></button>`;}).join('');
  document.getElementById('weekSummary').textContent='Ugen omkring '+label.toLowerCase();
  document.querySelector('.daily-strip .eyebrow').textContent='DIT OVERBLIK';
  const recent=document.getElementById('recentActivity');
  recent.closest('.card').querySelector('h2').textContent='Registreret denne dag';
  recent.closest('.card').querySelector('.tag').textContent=label;
  recent.innerHTML=[...meals.map(m=>`<div class="history-log-row"><span>${esc(m.name)}<small>Måltid · ${esc(m.category||'Mad')}</small></span><strong>${uiNumber(m.kcal)} kcal<small>${uiNumber(m.protein)} g protein</small></strong></div>`),...lifts.map(l=>`<div class="history-log-row"><span>${esc(l.exercise)}<small>Logget styrketræning</small></span><strong>${esc(l.sets)} × ${esc(l.reps)}<small>${esc(l.kg||0)} kg</small></strong></div>`)].join('')||'<p class="foot">Ingen måltider eller øvelser registreret denne dag. Det betyder ikke nødvendigvis, at du ikke har spist eller trænet.</p>';
  const next=document.getElementById('next');next.closest('.card').querySelector('h2').textContent='Dagens kalender';
  next.innerHTML=events.map(e=>`<div class="history-log-row"><span>${esc(e.title||e.type)}<small>${esc(e.type)} · planlagt</small></span><strong>${esc(activityTimeLabel(e))}</strong></div>`).join('')||'<p class="foot">Ingen aktiviteter i kalenderen denne dag.</p>';
  ['.workout-card','.food-card','.checkin-card','.projection','.quick-tracks'].forEach(s=>document.querySelector('#home '+s).hidden=historical);
  document.querySelector('#home .quick-tracks').previousElementSibling.hidden=historical;
  const heading=document.querySelector('.heading-action');heading.hidden=historical||!document.getElementById('home').classList.contains('active');
  if(document.getElementById('home').classList.contains('active')) {
    document.getElementById('pageTitle').textContent=label;
    document.getElementById('pageSubtitle').textContent=historical?'Din mad, træning og restitution denne dag.':'Træning, mad og restitution.';
    document.getElementById('date').textContent=new Date(date+'T12:00:00').toLocaleDateString(appLocale(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  }
  renderHistory();
};
const historyShowTabBase=showTab;
showTab=function(id){historyShowTabBase(id);if(id==='home')renderDashboard();if(id==='progress'){renderHistory();document.querySelector('[data-ui="more"]').classList.remove('active');}};
function historyChart(rows,key) {
  const values=rows.filter(r=>r[key]!==null);
  if(!values.length)return `<div class="history-empty">${key==='kcal'?'Ingen måltider':'Ingen vægtmålinger'} i perioden.<small>${key==='kcal'?'Log dine måltider for at se din udvikling.':'Gem en måling nedenfor for at følge din vægt.'}</small></div>`;
  const max=Math.max(...values.map(r=>r[key])),min=key==='kcal'?0:Math.min(...values.map(r=>r[key]))-1,high=key==='kcal'?Math.max(1,max)*1.1:max+1;
  const x=i=>44+(i+.5)*280/rows.length,y=v=>146-(v-min)/(high-min)*116;
  let marks='';
  if(key==='kcal') marks=rows.map((r,i)=>r.kcal===null?'':`<rect x="${x(i)-Math.max(.4,230/rows.length)/2}" y="${y(r.kcal)}" width="${Math.max(.4,230/rows.length)}" height="${Math.max(1,146-y(r.kcal))}" rx="1" fill="var(--green)"><title>${esc(historyLabel(r.date))}: ${uiNumber(r.kcal)} kcal</title></rect>`).join('');
  else {const points=rows.map((r,i)=>r.weight===null?null:{x:x(i),y:y(r.weight),r}).filter(Boolean);marks=`<polyline points="${points.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="var(--coral)" stroke-width="2" stroke-dasharray="4 3"/>`+points.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--coral)"><title>${esc(historyLabel(p.r.date))}: ${uiNumber(p.r.weight)} kg</title></circle>`).join('');}
  return `<svg class="history-chart" viewBox="0 0 340 178" role="img" aria-label="${key==='kcal'?'Registrerede kalorier pr. dag':'Registrerede vægtmålinger i kg'} fra ${esc(rows[0].date)} til ${esc(rows.at(-1).date)}">${[0,.5,1].map(t=>`<line x1="44" x2="326" y1="${146-t*116}" y2="${146-t*116}" stroke="var(--line)"/><text x="37" y="${150-t*116}" text-anchor="end">${uiNumber(Math.round((min+(high-min)*t)*10)/10)}</text>`).join('')}${marks}<text x="44" y="169">${rows[0].date.slice(8)}.${rows[0].date.slice(5,7)}</text><text x="326" y="169" text-anchor="end">${rows.at(-1).date.slice(8)}.${rows.at(-1).date.slice(5,7)}</text></svg>`;
}
function renderHistory() {
  const target=document.getElementById('historyContent');if(!target)return;
  const end=overviewDate>today()?today():overviewDate,start=historyStart();
  const range=historyPeriod==='custom'?historyCustom:historyRange(historyPeriod,end,start);
  if(!range||!range.every(historyDateValid)||range[0]>range[1]){target.innerHTML='<p class="foot">Vælg en startdato, der ligger før slutdatoen.</p>';return;}
  const rows=historySeries(data,...range),logged=rows.filter(r=>r.kcal!==null),total=logged.reduce((s,r)=>s+r.kcal,0),weights=rows.filter(r=>r.weight!==null),delta=weights.length>1?weights.at(-1).weight-weights[0].weight:null;
  document.getElementById('trackingStart').value=start;
  target.innerHTML=`<p class="history-range">${esc(historyLabel(range[0]))} — ${esc(historyLabel(range[1]))}</p><div class="history-totals"><div><small>Registreret i perioden</small><strong>${uiNumber(total)} <span>kcal</span></strong></div><div><small>Pr. logget dag</small><strong>${logged.length?uiNumber(Math.round(total/logged.length)):'—'} <span>kcal</span></strong></div></div><h3 class="history-chart-title">Kalorier <small>kcal / dag</small></h3>${historyChart(rows,'kcal')}<p class="foot">${logged.length} af ${rows.length} dage med madlog. Tomme dage er ikke talt som 0 kcal.</p><h3 class="history-chart-title">Vægt <small>kg</small></h3>${historyChart(rows,'weight')}<p class="foot">${delta===null?'Mindst to måledage kræves for at vise ændringen.':`${delta>0?'+':''}${uiNumber(Math.round(delta*100)/100)} kg mellem periodens første og sidste måling.`} Kun faktiske målinger; seneste måling bruges ved flere på samme dag.</p><details class="history-data"><summary>Se dagene og deres tal</summary>${rows.filter(r=>r.kcal!==null||r.weight!==null).map(r=>`<button type="button" data-history-date="${r.date}"><span>${esc(historyLabel(r.date))}</span><strong>${r.kcal===null?'Ingen madlog':uiNumber(r.kcal)+' kcal'}<small>${r.weight===null?'Ingen vejning':uiNumber(r.weight)+' kg'}</small></strong></button>`).join('')||'<p class="foot">Ingen registreringer i perioden.</p>'}</details>`;
  const since=historySeries(data,start,today()).filter(r=>r.kcal!==null),sum=since.reduce((n,r)=>n+r.kcal,0);
  document.getElementById('historySinceTotal').textContent=uiNumber(sum)+' kcal registreret siden '+historyLabel(start).toLowerCase();
}
document.addEventListener('DOMContentLoaded',()=>{
  const toolbar=document.createElement('div');toolbar.className='overview-datebar';toolbar.innerHTML='<button type="button" data-history-shift="-1" aria-label="Forrige dag">‹</button><label><span>Vælg dag</span><input type="date" id="overviewDate" aria-label="Dato på overblik"></label><button type="button" data-history-shift="1" aria-label="Næste dag">›</button><button type="button" data-history-today>I dag</button>';
  document.getElementById('home').prepend(toolbar);
  const progress=document.createElement('article');progress.className='card history-card';progress.innerHTML=`<div class="history-card-top"><div><span class="eyebrow">DIN UDVIKLING</span><h2>Energi & vægt</h2></div><label><span class="sr-only">Vælg periode</span><select id="historyPeriod" aria-label="Vælg periode"><option value="1">1 dag</option><option value="7" selected>Sidste 7 dage</option><option value="14">Sidste 14 dage</option><option value="month">Sidste måned</option><option value="year">År</option><option value="since">Siden start</option><option value="custom">Eget interval</option></select></label></div><form id="historyCustom" class="history-custom" hidden><label class="field">Fra<input name="from" type="date" required max="${today()}"></label><label class="field">Til<input name="to" type="date" required max="${today()}"></label><button class="button secondary" type="submit">Vis interval</button><p id="historyError" class="form-error" role="alert"></p></form><div id="historyContent" aria-live="polite"></div><div class="history-start"><label class="field">Min startdato<input id="trackingStart" type="date" max="${today()}" aria-describedby="historySinceTotal"></label><p id="historySinceTotal" class="foot"></p></div>`;
  document.getElementById('progress').prepend(progress);
  const entry=document.createElement('button');entry.className='history-entry';entry.dataset.historyOpen='';entry.innerHTML=uiIcon('progress')+'<span><strong>Din udvikling</strong><small>Kalorier, vægt og dine fremskridt</small></span>'+uiIcon('arrow');document.getElementById('dashboardStats').after(entry);
  // Five main destinations: training is still one tap from overview and More.
  document.querySelector('.tab[data-tab="train"]').classList.add('desktop-tab');
  document.querySelector('.tab[data-tab="progress"]').classList.remove('desktop-tab');
  const moreProgress=document.querySelector('#moreMenu [data-value="progress"]');if(moreProgress){moreProgress.dataset.value='train';moreProgress.innerHTML=uiIcon('train')+'Træning'+uiIcon('arrow');}
  pageCopy.progress=['Udvikling','Din energi, vægt og træning over tid.','Udvikling'];
  const weightDate=document.createElement('label');weightDate.className='field';weightDate.innerHTML=`Dato<input name="date" type="date" value="${today()}" max="${today()}" required>`;document.getElementById('progressForm').prepend(weightDate);
  renderDashboard();
});
document.addEventListener('click',e=>{
  const date=e.target.closest('[data-history-date]');if(date)selectOverviewDate(date.dataset.historyDate);
  const calendar=e.target.closest('[data-action="date"]');if(calendar)selectOverviewDate(calendar.dataset.value);
  const shift=e.target.closest('[data-history-shift]');if(shift)selectOverviewDate(shiftDate(overviewDate,Number(shift.dataset.historyShift)));
  if(e.target.closest('[data-history-today]'))selectOverviewDate(today());
  if(e.target.closest('[data-history-open]')){showTab('progress');window.scrollTo({top:0,behavior:'instant'});}
});
document.addEventListener('change',e=>{
  if(e.target.id==='overviewDate')selectOverviewDate(e.target.value);
  if(e.target.id==='historyPeriod') {historyPeriod=e.target.value;document.getElementById('historyCustom').hidden=historyPeriod!=='custom';if(historyPeriod==='custom'&&!historyCustom){historyCustom=historyRange('7',overviewDate>today()?today():overviewDate);const form=document.getElementById('historyCustom');form.elements.from.value=historyCustom[0];form.elements.to.value=historyCustom[1];}renderHistory();}
  if(e.target.id==='trackingStart') {if(!historyDateValid(e.target.value)||e.target.value>today()){e.target.value=historyStart();toast('Vælg en startdato senest i dag');return;}data.trackingStart=e.target.value;save();}
});
document.addEventListener('submit',e=>{if(e.target.id!=='historyCustom')return;e.preventDefault();const from=e.target.elements.from.value,to=e.target.elements.to.value,error=document.getElementById('historyError');if(!historyDateValid(from)||!historyDateValid(to)||from>to||to>today()){error.textContent='Vælg gyldige datoer: fra skal være før til, og slutdatoen må højst være i dag.';return;}error.textContent='';historyCustom=[from,to];renderHistory();});
