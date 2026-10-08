/* Match energy is a planning assumption, never a measurement or a food log. */
function gamesOnDate(date){return data.events.filter(e=>e.date===date&&e.type==='Kamp');}
function matchDayAllowance(){const value=data.profile.matchDayKcal;return value==null?600:Math.min(2000,Math.max(0,Number(value)||0));}
const estimateWithoutMatchDay=estimateEnergy;
function matchDayGoal(date,estimate=estimateWithoutMatchDay()){
 const games=gamesOnDate(date),extra=games.length*matchDayAllowance();
 if(!data.energy?.useAsGoal||!estimate){const base=Number(data.profile.kcalGoal);return base>0?Math.round(base+extra):null;}
 const c=estimate.components;
 if(c.season==='sessions'){
  if(!games.length&&date===today())return estimate.today;
  const events=data.events.filter(e=>e.date===date);
  return Math.round(estimate.activeBase+events.reduce((sum,e)=>sum+(e.type==='Kamp'?matchDayAllowance():estimate.sessionCost[e.type]||0),0)+c.surplus);
 }
 const start=weekStart(date),hasGames=data.events.some(e=>e.type==='Kamp'&&e.date>=start&&e.date<=shiftDate(start,6));
 return Math.round(estimate.average-(hasGames?c.matches:0)+extra);
}
estimateEnergy=function(){const e=estimateWithoutMatchDay();if(e&&data.energy?.useAsGoal)e.today=matchDayGoal(today(),e);return e;};
currentKcalGoal=function(date=today()){return matchDayGoal(date);};
function matchDayMarkup(date){
 const games=gamesOnDate(date);if(!games.length)return '';
 const en=appLanguage()==='en',t=(da,eng)=>en?eng:da,goal=date>=today()?matchDayGoal(date):null;
 const rows=[
  ['🍚',t('2–4 timer før','2–4 hours before'),t('Et måltid med kulhydrat','A carbohydrate-rich meal'),t('Fx ris eller pasta med kylling eller tofu. Vælg mad, du kender, og en portion din mave tåler.','Try rice or pasta with chicken or tofu. Choose familiar food and a portion you tolerate.')],
  ['🍌',t('1–2 timer før','1–2 hours before'),t('En lille snack, hvis du har brug for den','A small snack if needed'),t('Fx en banan eller lyst brød med marmelade. Hold igen med meget fedt og fibre tæt på kampstart.','Try a banana or white bread with jam. Avoid large amounts of fat and fibre close to the start.')],
  ['💧',t('Under kampen','During the match'),t('Hav drikkedunken klar','Keep your water bottle ready'),t('Drik i pauserne efter dit behov. Ved længere eller flere kampe kan en kulhydratdrik eller en let snack være praktisk.','Drink during breaks according to your needs. For longer or multiple matches, a carbohydrate drink or light snack can be useful.')],
  ['🥪',t('Efter kampen','After the match'),t('Kulhydrat + protein','Carbohydrate + protein'),t('Fx en sandwich og mælk, eller ris med kylling eller bønner. Spis en snack, hvis der er længe til næste måltid.','Try a sandwich and milk, or rice with chicken or beans. Have a snack if your next meal is a long way off.')]
 ];
 return `<div class="card-top"><h2>${t('Mad på kampdag','Match-day food')}</h2><span>🤾</span></div><p class="foot">${games.map(g=>esc(g.title||t('Kamp','Match'))+' · '+esc(activityTimeLabel(g))).join('<br>')}</p>${goal?`<p class="matchday-target"><strong>${uiNumber(goal)} kcal</strong> ${t('dagsmål','daily target')}</p>`:''}<p class="foot">${date<today()?t('Forslag til kampdagen. Historiske kaloriemål er ikke gemt.','Match-day ideas. Historical targets are not stored.'):goal?t('Kampenergi i målet: ','Match energy included: ')+uiNumber(games.length*matchDayAllowance())+' kcal.':t('Sæt et kaloriemål i Profil for at få et kampdagsmål.','Set a calorie target in Profile to get a match-day target.')}</p><details class="matchday-details"><summary>${t('Hvad kan jeg spise?','What can I eat?')}</summary>${rows.map(([icon,time,title,body])=>`<div class="matchday-row"><span>${icon}</span><div><small>${time}</small><strong>${title}</strong><p>${body}</p></div></div>`).join('')}<p class="foot">${t('Forslag — ikke en obligatorisk madplan eller automatisk madlog. Tilpas til appetit, allergier og hvad du tåler.','Suggestions — not a mandatory meal plan or an automatic food log. Adapt to appetite, allergies and tolerance.')} <a href="https://www.sportsdietitians.com.au/wp-content/uploads/2015/04/Eating-Drinking-Before-Sport-Aug-10.pdf" target="_blank" rel="noopener">${t('Før kamp','Before sport')}</a> · <a href="https://www.sportsdietitians.com.au/wp-content/uploads/2015/04/Eating-and-drinking-during-and-after-sport-Aug-10.pdf" target="_blank" rel="noopener">${t('Under og efter','During and after')}</a></p></details>`;
}
function renderMatchDayCards(){[['matchDayOverview',overviewDate],['matchDayFood',foodLogDate()]].forEach(([id,date])=>{const el=document.getElementById(id);if(el){el.innerHTML=matchDayMarkup(date);el.hidden=!gamesOnDate(date).length;}});}
const matchDashboardBase=renderDashboard;
renderDashboard=function(){matchDashboardBase();renderMatchDayCards();};
const matchEnergyBase=renderEnergy;
renderEnergy=function(){matchEnergyBase();const foot=document.querySelector('#energyResult .card .foot');if(foot)foot.textContent=smoothText('Dagsmålet følger kalenderen. I sæsonmodeller flyttes det fordelte kamptillæg til kampdagene i uger med kalenderkampe. I modellen Efter mine pas erstattes kampens tidligere estimat, så den ikke tælles dobbelt. 400/450 kcal og det valgte kamptillæg er planlægningsantagelser, ikke målt forbrug. Behov varierer; især unge bør få individuel hjælp fra en sportsdiætist.','The daily target follows the calendar. Season models move the weekly match allowance to scheduled match days. The session model replaces its old match estimate to avoid double counting. Allowances are planning assumptions, not measured expenditure. Needs vary; young athletes in particular should seek individual advice from a sports dietitian.');};
const matchProjectionBase=renderWeightProjection;
renderWeightProjection=function(){matchProjectionBase();if(gamesOnDate(today()).length){const text=smoothText('Kampdagens ekstra energi dækker aktivitet og skal ikke fremskrives som vægtøgning for en hel uge. Følg din faktiske vægtudvikling over tid.','Extra match-day energy covers activity and should not be projected as weight gain for a whole week. Follow your actual weight trend over time.');document.getElementById('weightProjection').textContent=text;document.getElementById('weightProjectionHome').textContent=text;}};
document.addEventListener('DOMContentLoaded',()=>{
 for(const [id,anchor]of [['matchDayOverview','dashboardStats'],['matchDayFood','mealCategoryRows']]){const card=document.createElement('article');card.id=id;card.className='card matchday-card';card.hidden=true;document.getElementById(anchor).after(card);}
 const settings=document.createElement('article');settings.className='card';settings.innerHTML=`<h2>${smoothText('Energi på kampdag','Match-day energy')}</h2><form id="matchDaySettings"><label class="field">${smoothText('Kcal pr. kamp i kalenderen','Kcal per scheduled match')}<input name="kcal" type="number" min="0" max="2000" step="1" required value="${matchDayAllowance()}"></label><p class="foot">${smoothText('600 kcal er et justerbart startestimat, ikke målt forbrug. Med manuelt mål lægges tillægget oven på dit almindelige dagsmål. Har dit manuelle mål allerede kampenergi med, kan du sætte tillægget til 0.','600 kcal is an adjustable starting estimate, not measured expenditure. With a manual target, it is added to your regular daily target. Set it to 0 if your manual target already includes match energy.')}</p><button class="button secondary" type="submit">${smoothText('Gem kamptillæg','Save match allowance')}</button></form>`;document.getElementById('profile').append(settings);
 document.getElementById('matchDaySettings').addEventListener('submit',e=>{e.preventDefault();data.profile.matchDayKcal=Number(e.target.elements.kcal.value);save();toast(smoothText('Kamptillæg gemt','Match allowance saved'));});
 document.getElementById('foodLogDate').addEventListener('change',renderMatchDayCards);render();
});
