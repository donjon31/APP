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

- Profile and logs are saved in browser local storage. Existing PULS data uses the same storage key for compatibility.
- Existing PULS and new HARPEX exports can both be imported through Profile.
- The theme button and Profile appearance controls switch light/dark themes. The choice persists locally; new installations start in the reference-inspired dark theme.
- Onboarding can be reopened from Profile. Answers are applied when the final step is saved.
- AI chat uses explicitly labeled, deterministic demo replies. There is no model, API key, API connection, or network request in the chat.
- The original food-product search contacts Open Food Facts only when submitted.

## Source

- `identity.js`, `identity.css`: original SVG card illustrations, three-screen introduction, muted green/coral/ochre design system, compact choices and reduced-motion-aware transitions. No generated photographs are included.
- `index.html`, `simulator.css`, `simulator.js`: telefonrammen og simulatorens kontroller.
- `app.html`: den interaktive mobilapp, indlæst i simulatorens egen viewport.
- `app.js`: existing athlete features and local data handling, integrated from the newer supplied release.
- `experience.js`: onboarding, dashboard, theme preference, and demo chat.
- `theme.css`: neutral light/dark design and responsive layouts.
- `sw.js`: offline shell cache.

The supplied reference is a still image. No video frames were extracted; 20 fps extraction needs a video file.
