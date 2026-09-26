# EchoMind

A voice check-in app that screens for early speech markers of Alzheimer's and dementia.

- `app/`: Electron desktop app. It records, analyzes and stores check-ins, exports the doctor report, and serves the local API.
- `docs/website-integration.md`: how the website reads check-ins and sends recordings to the app.
- `docs/demo-script.md`: the pitch.

## Run the app
    cd app
    npm install
    npm run dev

The app's API is then available at http://127.0.0.1:4317/api.

## Test
    cd app
    npm test
