# Tab Debt Killer

A Chrome extension (Manifest V3) for people who live with 20+ open tabs. It groups your tabs automatically, saves whole browsing sessions so you can close them without fear, and brings forgotten tabs back when you start typing about the same topic.

All processing happens in your browser. No accounts, no servers, no browsing data leaves the device.

## Features

- **Auto tab grouping.** Clusters open tabs by website and turns each cluster into a named, color-coded Chrome tab group. Single-tab clusters are left alone, and grouping can run automatically once a window passes a tab threshold you choose.
- **Session save and restore.** Saves every tab in a window as a named session, restored into the current window or a new one. Sessions can be renamed and deleted from a side panel.
- **Tab resurfacing.** While you type on a page, a content script scores your text against saved tabs (title, URL and page description) by keyword overlap and suggests the top matches in a small overlay.
- **Settings.** Grouping threshold, resurfacing on/off, match sensitivity and how long the overlay stays visible.
- **Free and Pro tiers.** The free tier keeps up to 5 sessions. Pro is unlocked with a license key validated through the Lemon Squeezy API.

## Tech stack

JavaScript (ES modules) · Chrome Extension APIs (`tabs`, `tabGroups`, `storage`, `scripting`, `sidePanel`) · Vite · Jest

## Project structure

```
src/
  background.js     service worker: message router, grouping, sessions, licensing
  content.js        resurfacing overlay injected into pages
  grouping.js       clustering logic (pure, unit-tested)
  scoring.js        tokenizing and ranking logic (pure, unit-tested)
  storage.js        chrome.storage wrappers
  popup/            toolbar popup
  sidebar/          session manager side panel
  settings/         options page
tests/              Jest tests for grouping and scoring
Tab_Debt_Killer_SRS.md   full software requirements specification
```

The grouping and scoring logic lives in pure modules with no Chrome API calls, so it can be unit-tested in Node.

## Getting started

```bash
npm install
npm run build        # outputs the unpacked extension to dist/
```

Then open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked** and select the `dist/` folder.

For development, `npm run dev` rebuilds on every change.

## Tests

```bash
npm test
```

## Status

Working v1. The requirements, architecture and data flow are documented in [`Tab_Debt_Killer_SRS.md`](Tab_Debt_Killer_SRS.md).

## Author

Built by [Ukasha Hassan](https://ukasha-hassan.vercel.app).
