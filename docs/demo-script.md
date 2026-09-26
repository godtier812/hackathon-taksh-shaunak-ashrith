# MindTrace demo (3 minutes)

## Before going on stage
- Reset history: close the app, delete `sessions.json` (the path is printed in the terminal at startup, normally `%APPDATA%\mindtrace-backend\sessions.json`), then start `npm run dev`. The app re-seeds four weeks of check-ins.
- Start the website (`cd frontend` then `npm run dev`), open http://localhost:3000/dashboard and check the top-bar badge says **Live**.
- Turn "Read instructions aloud" on. Test the mic once.
- Optional but better: replace the text-to-speech demo clips with real voices. Record each script in `backend/src/renderer/src/lib/scripts.ts`, click **Download recording** on the results screen, and save it as `backend/src/renderer/public/samples/<task>-<healthy|markers>.webm`. A `.webm` file takes priority over the `.wav` placeholder.

## Script
1. **Problem (20 s):** Around 75% of dementia cases go undiagnosed. Speech changes, like longer pauses, slower speech and word-finding trouble, can appear years before a diagnosis, and a voice check-in costs nothing.
2. **Home (15 s):** Four weeks of check-ins. The score is drifting down, but slowly enough that family wouldn't notice.
3. **Live check-in (60 s):** Choose *Read aloud*. The app reads the instructions out loud, which helps older users. Read the passage *with deliberate long pauses and a few "um"s*, then press Stop.
4. **Results (40 s):** Point at the amber pause map ("computed live from my voice"), the baseline comparison ("we compare you to *you*, not to a population"), the metric cards and the transcript highlights.
5. **Caregiver website (20 s):** Switch to localhost:3000/dashboard. The new check-in is already on the chart, rendered from the desktop app's API. Optionally press **Analyze new conversation** to record one from the website: the desktop app analyzes it and both views update. The app is the processing engine; the website is the family's window into it.
6. **Report (15 s):** History → Doctor report → Save as PDF. "This is what you bring to your GP."
7. **Close (10 s):** Audio never leaves the device. Next steps: a Whisper + Claude provider behind the same interface, and a cloud database behind the same API.

## If the mic fails
Use **Sample with memory-related markers** on the record screen.

## Honest answers to likely questions
- *Is the transcript real?* The acoustic markers are measured live. The language layer is a demo provider behind a swappable interface.
- *Is this a diagnosis?* No. It's a screening aid that flags changes relative to the person's own baseline.
- *How does the website get data?* The desktop app runs a local API on 127.0.0.1. The website reads sessions from it and can post recordings for the app to analyze.
