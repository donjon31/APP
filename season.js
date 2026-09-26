/* User-requested planning assumptions, not measured energy expenditure. */
function seasonEnergyComponents(input,activeBase,sessionCost) {
  const count=(value,max)=>Math.min(max,Math.max(0,Number(value)||0));
  const season=['in','off'].includes(input.season)?input.season:'sessions';
  const strength=count(input.strengthSessions,14)*sessionCost.Styrke/7;
  const hall=season==='in'?450:season==='off'?0:count(input.sportSessions,14)*sessionCost.Sportstræning/7;
  const matches=season==='off'?0:count(input.matchSessions,7)*(season==='in'?600:sessionCost.Kamp)/7;
  const surplus=input.energyGoal==='gain'?400:0;
  const maintenance=activeBase+strength+hall+matches;
  return {season,strength,hall,matches,surplus,maintenance,total:Math.round(maintenance+surplus)};
}
function seasonSelector(value='sessions') {
  return `<label class="field span">Sæsonmodel<select name="season"><option value="sessions" ${value==='sessions'?'selected':''}>Efter mine pas · eksisterende model</option><option value="in" ${value==='in'?'selected':''}>In-season · +450 kcal til hallen</option><option value="off" ${value==='off'?'selected':''}>Off-season · styrketræning</option></select></label><p class="foot">In-season: +450 kcal/dag til hallen og 600 kcal pr. kamp fordelt over ugen. Off-season: kun styrkepas, ingen hal- eller kamptillæg. Har du også sport eller kampe uden for sæsonen, vælg “Efter mine pas”. Ved vægtøgning lægges 400 kcal/dag til i alle modeller.</p>`;
}
