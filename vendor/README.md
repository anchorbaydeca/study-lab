`firebase.js` is the Firebase JavaScript SDK 13.2.0 (app, auth and Firestore Lite), bundled
with esbuild from the official `firebase` npm package so the Study Lab loads it from its own
site. Rebuild: `npm i firebase esbuild`, then bundle an entry file that re-exports the
functions `cloud.js` imports (`esbuild entry.js --bundle --format=esm --minify`).
