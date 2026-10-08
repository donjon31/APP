function foodLogDate(){const value=document.getElementById('foodLogDate')?.value;return value&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&value<=today()?value:today();}
