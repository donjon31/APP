/* Unsaved fields are independent per date, workout and exercise, in this tab only. */
const workoutDrafts=new Map();
function rememberWorkoutFields() {
  document.querySelectorAll('.exerciseForm[data-draft-key]').forEach(form=>{
    if(form.dataset.skipDraft==='true')return;
    workoutDrafts.set(form.dataset.draftKey,Object.fromEntries(['sets','reps','kg'].map(name=>[name,form.elements[name].value])));
  });
}
const renderWorkoutWithoutDrafts=renderWorkout;
renderWorkout=function() {
  rememberWorkoutFields();
  renderWorkoutWithoutDrafts();
  document.querySelectorAll('.exerciseForm').forEach(form=>{
    const index=Number(form.dataset.index),plan=STRENGTH_PLANS[currentMode()][workoutIndex];
    const key=JSON.stringify([trainingDate,currentMode(),plan[0],index,workoutExercise(plan[1][index]).name]);
    form.dataset.draftKey=key;
    const values=workoutDrafts.get(key);
    if(values)Object.entries(values).forEach(([name,value])=>{form.elements[name].value=value;});
  });
};
function saveExerciseForm(form) {
  rememberWorkoutFields();
  const key=form.dataset.draftKey,previous=workoutDrafts.get(key);
  workoutDrafts.delete(key);form.dataset.skipDraft='true';
  try {save();}
  catch(error) {
    delete form.dataset.skipDraft;
    if(previous)workoutDrafts.set(key,previous);
    throw error;
  }
}
renderWorkout();
