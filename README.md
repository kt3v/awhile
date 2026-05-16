# awhile

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**awhile** is a private map of your life, month by month.

It turns your life into a simple scrollable grid: one row per year, one square per month. Add memories, write about what is happening right now, mark important chapters, and slowly build a personal archive of the moments and seasons that shaped you.

Use it as a memory map, a visual diary, or a quiet place to step back and see how your life is unfolding.

<img src="screenshot.png" width="300" />

## Why awhile?

Most calendars are built for what comes next. awhile is built for what has already happened, what is happening now, and what you want to remember.

It is not a productivity dashboard. It is a small personal archive: a place for life chapters, quiet milestones, moves, relationships, jobs, projects, grief, recovery, travel, ordinary months, and everything that does not fit neatly into a task list.

awhile can be retrospective, but it does not have to be only about the past. You can use it as a personal diary too: write about the current month, save what happened today, attach images, and let the archive grow as life unfolds.

## What you can do

- **See your life at a glance:** Every year becomes a row, every month becomes a cell.
- **Use it as a personal diary:** Write about the month you are living through right now. Capture current events, thoughts, photos, decisions, moods, and small details before they blur.
- **Remember specific moments:** Add notes, images, memories, milestones, or reflections to any month.
- **Mark life chapters:** Use colored ranges for periods like university, a city you lived in, a relationship, a job, a project, or a difficult season.
- **Keep it private:** awhile is self-hosted. Your data stays with you, stored as plain files on your own machine or server.

## Privacy

No accounts. No tracking. No cloud sync by default.

Your notes, tags, settings, and uploaded images are stored in the local `data/` directory. Backing up your life timeline is as simple as copying that folder.

---

## Quick Start

awhile runs on your own computer or server. Once installed, you open it in a browser and your data is saved locally in the project's `data/` folder.

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Git](https://git-scm.com/)
- [PM2](https://pm2.keymetrics.io/) (`npm install -g pm2`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kt3u/awhile
   cd awhile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start with PM2 (builds automatically, then starts the server):
   ```bash
   pm2 start ecosystem.config.cjs
   ```

4. (Optional) Auto-start on system reboot:
   ```bash
   pm2 save
   pm2 startup
   ```

5. Open your browser and navigate to [http://localhost:3001](http://localhost:3001).

> **Without PM2:** `npm start` also works — it builds and starts the server in one step.

---

## Maintenance

### Updating

To update to the latest version:

```bash
git pull
npm install
pm2 restart awhile
```

The restart automatically rebuilds the frontend before launching.

### Data & Backups

All your data lives in the `./data/` directory, created automatically on first run:

- `data/awhile.json` — notes, tags, and settings (plain JSON)
- `data/images/` — uploaded images referenced by notes

**To create a backup:**
```bash
cp -r data/ data.backup/
```

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for the full text.

<p align="center">
  <a href="https://x.com/1hrOk" style="text-decoration: none;">weird_drop ✖ indie-indie</a>
</p>
