# study-lab

Anchor Bay DECA Study Lab: the chapter's exam-prep study app.

## What's here
- `index.html` – the app: spaced-repetition sessions, question bank, key terms, timed set, mock exam, student sign-in and the advisor dashboard (advisors only)
- `cloud.js` – student accounts and saved progress through Firebase (project `anchor-bay-deca-study-lab`, owned by the chapter's Google account)
- `vendor/firebase.js` – the Firebase SDK, bundled so the site loads it from itself (see `vendor/README.md`)
- `firestore.rules` – database security rules; paste into Firebase console › Firestore › Rules after any change
- `data/<cluster>.json` – chapter-written questions and key terms for each cluster
- `assets/` – Anchor Bay DECA logo; `fonts/` – Montserrat (SIL Open Font License, see `fonts/OFL-Montserrat.txt`), the free web stand-in for the Design System's Gotham

## How accounts work
- Students sign in with their school email and a password they make. The app turns the email into a scrambled ID (first 20 hex characters of SHA-256 of `abdeca-study-lab|<email>`), and Firebase only ever sees `<id>@abdeca-studylab.invalid`. No names or emails are stored in Firebase.
- Progress saves on the device at once and to the account within seconds; every save merges with the account's copy, so a phone and a school computer don't overwrite each other.
- Forgotten password: delete the student's account in Firebase console › Authentication (search for their ID, shown in the dashboard's CSV) and have them create it again. Progress is kept because it is stored under the ID, not the login.
- Advisors: add a document named by the advisor's ID to the `advisors` collection in Firestore. The dashboard's roster (names and emails) stays in the advisor's browser.

## Testing locally
`firebase emulators:start --only auth,firestore --project demo-studylab`, serve this folder, and open `http://localhost:PORT/index.html?emu`.

Started Nov 11, 2026 from the claude.ai version (artifact version 1794258569-c0f7), with student accounts added the same day.
