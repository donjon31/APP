/* Date-based planning: seven consecutive dates, including the selected day. */
currentMode=function(){return workoutMode==='auto'?Math.min(2,gamesInNextSeven(trainingDate)):Number(workoutMode);};
function matchMealTimes(game){
 const start=/^\d{2}:\d{2}$/.test(game.time||'')?new Date(game.date+'T'+game.time+':00'):null;
 let end=/^\d{2}:\d{2}$/.test(game.endTime||'')?new Date(game.date+'T'+game.endTime+':00'):null;
 if(end&&game.endsNextDay)end.setDate(end.getDate()+1);
 if(end&&start&&end<start)end=null;
 return {meal:start?new Date(start.getTime()-180*60000):null,snack:start?new Date(start.getTime()-90*60000):null,after:end?new Date(end.getTime()+30*60000):null};
}
function mealClock(value,date,fallback){if(!value||!Number.isFinite(value.getTime()))return fallback;return (localDate(value)!==date?dateText(localDate(value))+' · ':'')+value.toLocaleTimeString(appLocale(),{hour:'2-digit',minute:'2-digit'});}
function mealOverlapsGame(time){if(!time)return false;return data.events.filter(e=>e.type==='Kamp').some(e=>{const start=new Date(e.date+'T'+e.time+':00'),end=new Date(e.date+'T'+e.endTime+':00');if(e.endsNextDay)end.setDate(end.getDate()+1);return time>=start&&time<end;});}
matchDayMarkup=function(date){
 const games=gamesOnDate(date).slice().sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));if(!games.length)return '';const t=smoothText,goal=date>=today()?matchDayGoal(date):null;
 return `<div class="card-top"><h2>${t('Mad på kampdag','Match-day food')}</h2><span>🤾</span></div>${goal?`<p class="matchday-target"><strong>${uiNumber(goal)} kcal</strong> ${t('dagsmål','daily target')}</p>`:''}<p class="foot">${t('Tidspunkterne følger din kalender. Forslagene er ikke en komplet kostplan; tilpas portioner, allergier og appetit.','Times follow your calendar. These are not a complete meal plan; adapt portions, allergies and appetite.')}</p><details class="matchday-details"><summary>${t('Hvad og hvornår skal jeg spise?','What and when can I eat?')}</summary>${games.map(game=>{
 const times=matchMealTimes(game),rows=[
 [times.meal,t('Ca. 3 timer før','About 3 hours before'),t('Måltid før kamp','Pre-match meal'),t('Fx 250 g kogte ris med 120 g tilberedt kylling eller tofu og lidt grønt. Ved en tidlig kamp kan det være havregrød med mælk og banan.','Try 250 g cooked rice with 120 g cooked chicken or tofu and a little vegetables. For an early match, porridge with milk and banana is another option.')],
 [times.snack,t('Ca. 1½ time før','About 1½ hours before'),t('Lille snack','Small snack'),t('Fx en banan eller en lys bolle med marmelade, hvis du har brug for den. Vælg noget, du ved, din mave tåler.','Try a banana or a white bread roll with jam if needed. Choose something you know you tolerate.')],
 [times.after,t('Efter kampens slut','After the match ends'),t('Mad efter kampen','Post-match food'),t('Fx en kyllingesandwich og 250 ml kakaomælk eller et alternativ, du tåler. Spis et almindeligt måltid bagefter, hvis du har brug for mere.','Try a chicken sandwich and 250 ml chocolate milk or a tolerated alternative. Have a regular meal afterwards if you need more.')]
 ];return `<h3>${esc(game.title||t('Kamp','Match'))} · ${esc(activityTimeLabel(game))}</h3>${rows.map(([time,relative,title,body])=>{const overlap=mealOverlapsGame(time);return `<div class="matchday-row"><div><small>${overlap?t('Tilpas mellem kampene','Adjust between matches'):esc(mealClock(time,date,relative))}</small><strong>${title}</strong><p>${overlap?t('Det foreslåede tidspunkt overlapper en anden kamp. Vælg en passende pause og en mindre snack, du tåler — ikke et stort måltid midt i kampen.','The suggested time overlaps another match. Choose a suitable break and a tolerated small snack, not a large meal during play.'):body}</p></div></div>`;}).join('')}`;
 }).join('')}<p class="foot">${t('Drik i pauserne efter behov. Ved tidlige kampe kan måltidet ligge tidligt; flyt eller tilpas det til søvn og hvad du tåler. Der logges ikke mad automatisk.','Drink during breaks as needed. Early matches may mean an early meal; adapt around sleep and tolerance. No food is logged automatically.')} <a href="https://www.sportsdietitians.com.au/wp-content/uploads/2015/04/Eating-Drinking-Before-Sport-Aug-10.pdf" target="_blank" rel="noopener">${t('Om mad før sport','Pre-sport food guidance')}</a></p></details>`;
};
function refreshQuickPrograms(){const f=document.getElementById('quickActivityForm'),select=document.getElementById('quickProgramChoice');if(!f||!select)return;const strength=f.elements.type.value==='Styrke',date=f.elements.date.value||today(),count=gamesInNextSeven(date),records=workoutRecords(Math.min(2,count)),previous=select.value;
 if(!strength&&f.elements.title.readOnly)f.elements.title.value='';
 document.getElementById('quickProgramField').hidden=!strength;select.disabled=!strength;select.required=strength;f.elements.title.closest('label').hidden=strength;f.elements.title.readOnly=strength;
 select.innerHTML=records.length?records.map(w=>`<option value="${esc(w.id)}">${esc(w.name)}</option>`).join(''):`<option value="">${smoothText('Ingen programmer valgt','No workouts selected')}</option>`;if(records.some(w=>w.id===previous))select.value=previous;
 document.getElementById('quickProgramHint').textContent=`${count} ${smoothText('kampe fra','matches from')} ${dateText(date)} – ${dateText(shiftDate(date,6))}. `+(records.length?smoothText('Viser dine valgte programmer for denne belastning.','Showing your selected workouts for this load.'):smoothText('Vælg et program under Træning → Programmer først.','Enable a workout under Training → Workouts first.'));
 if(strength)f.elements.title.value=records.find(w=>w.id===select.value)?.name||'';
}
const scheduledQuickBase=openQuickActivity;
openQuickActivity=function(date){scheduledQuickBase(date);refreshQuickPrograms();};
document.addEventListener('DOMContentLoaded',()=>{
 const f=document.getElementById('quickActivityForm'),field=document.createElement('label');field.className='field span';field.id='quickProgramField';field.innerHTML=`${smoothText('Vælg styrkeprogram','Choose strength workout')}<select id="quickProgramChoice" name="programId"></select><small id="quickProgramHint" class="foot"></small>`;f.elements.title.closest('label').before(field);
 for(const name of ['type','date'])f.elements[name].addEventListener('change',refreshQuickPrograms);
 f.addEventListener('submit',e=>{if(f.elements.type.value!=='Styrke')return;const record=workoutRecords(Math.min(2,gamesInNextSeven(f.elements.date.value))).find(w=>w.id===f.elements.programId.value);if(!record){e.preventDefault();e.stopImmediatePropagation();document.getElementById('quickActivityError').textContent=smoothText('Vælg et gyldigt program først.','Choose a valid workout first.');return;}f.elements.title.value=record.name;},true);
 const label=document.getElementById('gameCount').closest('label');label.childNodes[0].textContent=smoothText('Kampe de næste 7 dage','Matches in the next 7 days');render();
});
