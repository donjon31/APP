/* Data-compatible organization of meals, activities and navigation. */
const PRESET_CATEGORIES = [
  ['Morgenmad','Morgenmad','☀️'], ['Frokost','Frokost','🥪'],
  ['Aftensmad','Aftensmad','🍲'], ['Før træning','Før træning','🍌'],
  ['Efter træning','Efter træning','🥣'], ['Hygge','Til hygge','🍿']
];
let presetCategory = 'Morgenmad';
let removedPreset = null;
function mealCategory(meal) {
  return PRESET_CATEGORIES.some(([key]) => key === meal.category) ? meal.category : 'Uden kategori';
}
function activityTimeLabel(event) {
  return String(event.time || '—') + (event.endTime ? '–' + event.endTime + (event.endsNextDay ? ' (+1 dag)' : '') : ' · sluttid ikke angivet');
}
function activityTimingError(start, end, nextDay) {
  if (!/^\d{2}:\d{2}$/.test(start || '') || !/^\d{2}:\d{2}$/.test(end || '')) return 'Angiv både starttid og sluttid.';
  const minutes = value => Number(value.slice(0,2))*60 + Number(value.slice(3));
  if (minutes(start) >= 1440 || minutes(end) >= 1440 || Number(start.slice(3)) > 59 || Number(end.slice(3)) > 59) return 'Angiv gyldige tidspunkter.';
  const duration = minutes(end) - minutes(start) + (nextDay ? 1440 : 0);
  if (duration <= 0) return 'Sluttiden skal være efter starttiden. Markér næste dag ved træning over midnat.';
  if (duration > 1440) return 'En aktivitet kan højst vare 24 timer.';
  return '';
}
function renderPresetGroups() {
  const categories = [...PRESET_CATEGORIES];
  if (data.presets.some(p => mealCategory(p) === 'Uden kategori')) categories.push(['Uden kategori','Uden kategori','📁']);
  if (!categories.some(([key]) => key === presetCategory)) presetCategory = 'Morgenmad';
  document.getElementById('presetCategories').innerHTML = categories.map(([key,label,emoji]) => {
    const count = data.presets.filter(p => mealCategory(p) === key).length;
    return `<button type="button" data-preset-category="${esc(key)}" aria-pressed="${presetCategory===key}"><span aria-hidden="true">${emoji}</span><span>${label}</span><small>${count}</small></button>`;
  }).join('');
  const meals = data.presets.filter(p => mealCategory(p) === presetCategory);
  document.getElementById('presets').innerHTML = meals.length ? meals.map(p => `<article class="saved-meal"><div class="saved-meal-heading"><div><h3>${esc(p.name)}</h3><p>${esc(p.kcal)} kcal · ${esc(p.protein)} g protein</p></div><button type="button" class="button secondary" data-action="preset" data-value="${esc(p.id)}" aria-label="Log ${esc(p.name)}">+ Log</button></div><details class="meal-options"><summary>Redigér / slet</summary><label class="field">Flyt til kategori<select data-preset-move="${esc(p.id)}">${mealCategory(p)==='Uden kategori'?'<option value="Uden kategori">Vælg kategori</option>':''}${PRESET_CATEGORIES.map(([key,label])=>`<option value="${esc(key)}" ${mealCategory(p)===key?'selected':''}>${label}</option>`).join('')}</select></label><button type="button" class="delete-preset" data-preset-delete="${esc(p.id)}" aria-label="Slet fast måltid ${esc(p.name)}">Slet fast måltid</button></details></article>`).join('') : '<div class="preset-empty"><strong>Plads til dine favoritter</strong><p>Ingen faste måltider i denne kategori endnu.</p></div>';
}
function deleteSavedMeal(id) {
  const index = data.presets.findIndex(p => p.id === id);
  if (index < 0) return;
  removedPreset = {meal:data.presets[index],index};
  data.presets.splice(index,1);
  save();
  const feedback = document.getElementById('presetFeedback');
  feedback.innerHTML = '<span>Måltidet er fjernet. Dagens log er uændret.</span><button type="button" id="undoPresetDelete">Fortryd</button>';
}
function undoSavedMealDeletion() {
  if (!removedPreset) return;
  if (!data.presets.some(p => p.id === removedPreset.meal.id)) data.presets.splice(Math.min(removedPreset.index,data.presets.length),0,removedPreset.meal);
  presetCategory = mealCategory(removedPreset.meal);
  removedPreset = null;
  save();
  document.getElementById('presetFeedback').textContent = 'Måltidet er gendannet.';
}
function resetMealMode() {
  const form = document.getElementById('mealForm');
  form.elements.presetOnly.value = '';
  form.closest('.card').querySelector('h2').textContent = 'Log måltid';
  form.querySelector('button[type="submit"],button:not([type])').textContent = 'Tilføj måltid';
  form.elements.savePreset.closest('label').hidden = false;
}
function selectFoodView(view) {
  document.querySelectorAll('[data-food-view]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.foodView===view)));
  document.querySelectorAll('[data-food-panel]').forEach(panel => panel.hidden = panel.dataset.foodPanel!==view);
  if (view !== 'log') resetMealMode();
}
function resetActivityEditor() {
  const form = document.getElementById('eventForm');
  form.elements.editId.value = '';
  form.elements.endTime.setCustomValidity('');
  document.getElementById('eventTimeError').textContent = '';
  document.getElementById('cancelEventEdit').hidden = true;
  form.querySelector('button:not([type])').textContent = 'Gem aktivitet';
}
document.addEventListener('DOMContentLoaded', () => {
  // Four deliberate destinations, instead of one long food page.
  const fuel = document.getElementById('fuel');
  const log = document.getElementById('mealForm').closest('.card');
  const saved = document.getElementById('presets').closest('.card');
  const ideas = document.getElementById('mealSuggestions').closest('.card');
  const search = document.getElementById('foodSearchForm').closest('.card');
  const todayCard = document.createElement('div'); todayCard.className = 'card';
  const todayList = document.getElementById('mealList');
  todayCard.append(todayList.previousElementSibling,todayList);
  const nav = document.createElement('nav'); nav.className = 'food-navigation'; nav.setAttribute('aria-label','Mad og energi');
  nav.innerHTML = [['log','Log'],['saved','Faste'],['ideas','Idéer'],['search','Søg']].map(([key,label]) => `<button type="button" data-food-view="${key}" aria-pressed="${key==='log'}">${label}</button>`).join('');
  const panels = [['log',[log,todayCard]],['saved',[saved]],['ideas',[ideas]],['search',[search]]].map(([key,cards]) => {
    const panel = document.createElement('div'); panel.dataset.foodPanel = key; panel.hidden = key!=='log'; panel.append(...cards); return panel;
  });
  fuel.replaceChildren(nav,...panels);
  const month = document.getElementById('monthCalendar');
  const weekScroll = document.getElementById('week').closest('.scroll');
  [month.previousElementSibling,month].forEach(el=>el.dataset.calendarPanel='month');
  [weekScroll.previousElementSibling,weekScroll,document.getElementById('weekAdvice')].forEach(el=>{el.dataset.calendarPanel='week';el.hidden=true;});
  const calendarNav=document.createElement('nav');calendarNav.className='food-navigation calendar-navigation';calendarNav.setAttribute('aria-label','Kalendervisning');
  calendarNav.innerHTML='<button type="button" data-calendar-view="month" aria-pressed="true">Måned</button><button type="button" data-calendar-view="week" aria-pressed="false">Uge</button>';
  document.getElementById('plan').prepend(calendarNav);
  document.querySelector('.tab[data-tab="plan"]').classList.remove('desktop-tab');
  document.querySelector('.tab[data-tab="chat"]').classList.add('desktop-tab');
  document.getElementById('moreMenu').innerHTML = '<div class="card-top"><h2>Mere</h2><button class="icon-button" data-ui="more-close" aria-label="Luk menu">×</button></div><p class="menu-group-label">DIN FORM</p>'+[['recovery','Restitution'],['progress','Udvikling']].map(([id,title])=>`<button data-action="tab" data-value="${id}">${uiIcon(id)}${title}${uiIcon('arrow')}</button>`).join('')+'<p class="menu-group-label">PERSONLIGT</p>'+[['chat','HARPEX AI · demo'],['profile','Profil & indstillinger']].map(([id,title])=>`<button data-action="tab" data-value="${id}">${uiIcon(id)}${title}${uiIcon('arrow')}</button>`).join('');
  // Advanced tools remain available but do not dominate the primary screens.
  function foldCard(card, title) {
    if (!card) return;
    const details = document.createElement('details'); details.className = 'card compact-tools';
    const summary = document.createElement('summary'); summary.textContent = title;
    const body = document.createElement('div'); body.className = 'compact-tools-body';
    card.replaceWith(details); while (card.firstChild) body.append(card.firstChild);
    details.append(summary,body);
  }
  foldCard(document.getElementById('liftForm').closest('.card'),'Log en anden øvelse');
  foldCard(document.getElementById('exportData').closest('.card'),'Backup og import af data');
  renderPresetGroups();
  const eventForm = document.getElementById('eventForm');
  function validateTime() {
    const message = activityTimingError(eventForm.elements.time.value,eventForm.elements.endTime.value,eventForm.elements.endsNextDay.checked);
    eventForm.elements.endTime.setCustomValidity(message);
    document.getElementById('eventTimeError').textContent = message;
    return !message;
  }
  ['time','endTime','endsNextDay'].forEach(name => eventForm.elements[name].addEventListener('input',validateTime));
  eventForm.addEventListener('submit', event => {
    if (!validateTime()) {event.preventDefault();event.stopImmediatePropagation();eventForm.reportValidity();}
  },true);
  document.getElementById('cancelEventEdit').addEventListener('click', () => {eventForm.reset();eventForm.elements.date.value=selectedDate;updateStrengthPicker();resetActivityEditor();});
  document.getElementById('newPreset').addEventListener('click', () => {
    selectFoodView('log'); const form = document.getElementById('mealForm'); form.reset();
    form.elements.presetOnly.value = 'true'; form.elements.savePreset.checked = true;
    form.elements.savePreset.closest('label').hidden = true;
    form.elements.category.value = presetCategory==='Uden kategori'?'Morgenmad':presetCategory;
    form.closest('.card').querySelector('h2').textContent = 'Nyt fast måltid';
    form.querySelector('button:not([type])').textContent = 'Gem fast måltid';form.elements.name.focus();
  });
});
document.addEventListener('click', event => {
  const calendarView=event.target.closest('[data-calendar-view]');
  if(calendarView){document.querySelectorAll('[data-calendar-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===calendarView)));document.querySelectorAll('[data-calendar-panel]').forEach(p=>p.hidden=p.dataset.calendarPanel!==calendarView.dataset.calendarView);}
  if(event.target.closest('[data-action="exercise"]'))document.getElementById('liftForm').closest('details').open=true;
  const category = event.target.closest('[data-preset-category]');
  if (category) {presetCategory=category.dataset.presetCategory;renderPresetGroups();}
  const deletion = event.target.closest('[data-preset-delete]');
  if (deletion) deleteSavedMeal(deletion.dataset.presetDelete);
  if (event.target.closest('#undoPresetDelete')) undoSavedMealDeletion();
  const view = event.target.closest('[data-food-view]');
  if (view) {resetMealMode();selectFoodView(view.dataset.foodView);}
  const edit = event.target.closest('[data-edit-event]');
  if (edit) {
    const activity = data.events.find(e=>e.id===edit.dataset.editEvent); if (!activity) return;
    const form=document.getElementById('eventForm');form.reset();resetActivityEditor();
    form.elements.type.value=activity.type;form.elements.date.value=activity.date;updateStrengthPicker();
    form.elements.title.value=activity.title;form.elements.editId.value=activity.id;form.elements.time.value=activity.time||'';
    form.elements.endTime.value=activity.endTime||'';form.elements.endsNextDay.checked=!!activity.endsNextDay;
    if(activity.type==='Styrke')document.getElementById('strengthEventChoice').value=activity.title;
    form.querySelector('button:not([type])').textContent='Gem ændringer';document.getElementById('cancelEventEdit').hidden=false;
    form.scrollIntoView({behavior:'smooth',block:'start'});form.elements.time.focus({preventScroll:true});
  }
});
document.addEventListener('change', event => {
  const input=event.target.closest('[data-preset-move]'); if (!input) return;
  const meal=data.presets.find(p=>p.id===input.dataset.presetMove);
  if (meal&&PRESET_CATEGORIES.some(([key])=>key===input.value)) {meal.category=input.value;presetCategory=input.value;save();toast('Kategori gemt');}
});
