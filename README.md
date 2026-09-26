# HARPEX

Local-first athlete app with onboarding, training plans and logs, weekly/monthly calendars, food logging and CSV import, recovery check-ins, exercise progress, and a demo AI chat.

## Telefonsimulator

På en computer åbner HARPEX i en interaktiv telefonramme med mobil-layout, statuslinje, bundnavigation og separat scrolling inde i telefonen. Rammen tilpasses automatisk vinduets størrelse. Brug simulatorens knapper til at skifte tema, vise onboarding eller gå til overblikket via hjemindikatoren. Onboarding-knappen sletter ikke dine gemte data.

På en mobil fylder appen skærmen uden en ekstra telefonramme. Det er en browserbaseret app-simulator, ikke en iOS-/Android-emulator eller en native app.

## GitHub og Vercel

1. Pak ZIP-filen ud, og upload de udpakkede filer til dit GitHub-repository. Upload ikke selve ZIP-filen som appen.
2. Sørg for, at `index.html` og `vercel.json` ligger i roden af dit repository.
3. Opret et projekt i Vercel, og importér dit GitHub-repository.
4. Brug Framework Preset **Other** og Root Directory **./**. Den medfølgende `vercel.json` slår build fra og bruger projektets rod som output.
5. Klik **Deploy**. Ingen API-nøgler eller miljøvariabler er nødvendige.

Opsætningen følger [Vercels vejledning til statiske projekter](https://vercel.com/docs/builds/configure-a-build#skip-build-step). Denne pakke er klargjort til deployment, men er ikke publiceret til Vercel endnu.

Data gemmes lokalt i den enkelte browser, ikke på en server. Eksportér dine data fra den lokale app og importér dem på Vercel-adressen, hvis du vil flytte dem. AI-chatten er fortsat kun en lokal demo.

## Run locally

From this folder:

```sh
ruby -run -e httpd . -p 4173 -b 127.0.0.1
```

Open http://127.0.0.1:4173/. The app is static and requires no build or package installation.

## Data and themes

- Sæsonmodel i Profil og onboarding: In-season bruger 450 kcal/dag til hallen, 600 kcal pr. kamp fordelt over syv dage samt estimeret styrketræning. Off-season medregner kun styrketræning. Begge lægger 400 kcal/dag til ved gradvis vægtøgning, 0 ved vedligehold. Basis inkluderer hverdagsaktivitet (ikke kun BMR). Det er faste planlægningsantagelser, ikke dokumenteret individuelt forbrug eller en garanti for muskelvækst. Kalenderen lægges ikke oveni sæsonmodellen.
- Eksisterende profiler bevarer modellen “Efter mine pas”, indtil man vælger en sæsonmodel. Vægtøgningstillægget er nu 400 kcal i alle modeller. Manuelle kaloriemål ændres ikke, før brugeren vælger at bruge beregningen.
- Faste måltider kan oprettes uden at logge mad, kategoriseres som morgenmad, frokost, aftensmad, snacks før/efter træning eller hygge og slettes med mulighed for at fortryde. Ældre favoritter uden kategori bevares under “Uden kategori”. Tidligere måltidslogs berøres ikke af sletning af en favorit.
- Kalenderaktiviteter har starttid og sluttid samt mulighed for at slutte næste dag. “Ret tid” redigerer eksisterende aktiviteter. Ældre aktiviteter beholder deres starttid; en manglende sluttid vises tydeligt og kan tilføjes.
- Bundmenuen giver direkte adgang til Overblik, Kalender, Mad, Udvikling og Mere. Træning åbnes fra overblikket eller Mere. Mad er opdelt i Log, Faste, Idéer og Søg.
- Vælg en dag i kalenderen eller overblikket for at se dens mad, kcal, protein, søvn, loggede løft og planlagte aktiviteter. I går vises som “I går”; ældre dage med dato. Historiske kaloriemål er ikke gemt, så gamle dage viser ikke dagens mål som et historisk mål.
- Kaloriekortet åbner grafer over registrerede kalorier og faktiske vægtmålinger. Vælg 1 dag, 7 dage, 14 dage, en rullende måned, et rullende år, siden start eller eget datointerval. Perioder slutter på den valgte overbliksdag (højst i dag). Tomme dage tælles ikke som 0 kcal. Ved flere vejninger samme dag bruges den sidst gemte.
- Min startdato gemmes sammen med dine data og bestemmer summen siden start. Datoen sletter eller ændrer ikke gamle registreringer. Vægtmålinger kan registreres med dato.
- Gem øvelse nulstiller kun den gemte øvelse. Andre indtastede sæt, reps og kilo bevares separat pr. dato, pas og øvelse, også når du skifter pas og kommer tilbage. Ugemte kladder lever kun i den åbne fane og er ikke gemte træningslogs.
- Profile and logs are saved in browser local storage. Existing PULS data uses the same storage key for compatibility.
- Existing PULS and new HARPEX exports can both be imported through Profile.
- The theme button and Profile appearance controls switch light/dark themes. The choice persists locally; new installations start in the reference-inspired dark theme.
- Onboarding can be reopened from Profile. Answers are applied when the final step is saved.
- AI chat uses explicitly labeled, deterministic demo replies. There is no model, API key, API connection, or network request in the chat.
- The original food-product search contacts Open Food Facts only when submitted.

## Source

- `history.js`, `history.css`: historisk overblik, periodevalg, kalorie-/vægtgrafer og startdato.
- `workout-drafts.js`: uafhængige indtastninger pr. øvelse.
- `tests/history.test.cjs`, `tests/history-browser.cjs`: dato-/beregningstests og browserregression. Browsertesten kræver Playwright og Chrome og bruger en isoleret browserprofil.
- `organization.js`, `organization.css`: måltidskategorier, slet/fortryd, tidsvalidering, aktivitetsredigering og opdelt navigation.
- `tests/organization.test.cjs`: datakompatibilitet og regressionstests. Kør med `node tests/organization.test.cjs`.
- `identity.js`, `identity.css`: original SVG card illustrations, three-screen introduction, muted green/coral/ochre design system, compact choices and reduced-motion-aware transitions. No generated photographs are included.
- `index.html`, `simulator.css`, `simulator.js`: telefonrammen og simulatorens kontroller.
- `app.html`: den interaktive mobilapp, indlæst i simulatorens egen viewport.
- `app.js`: existing athlete features and local data handling, integrated from the newer supplied release.
- `experience.js`: onboarding, dashboard, theme preference, and demo chat.
- `theme.css`: neutral light/dark design and responsive layouts.
- `sw.js`: offline shell cache.

The supplied reference is a still image. No video frames were extracted; 20 fps extraction needs a video file.
