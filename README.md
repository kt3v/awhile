# awhile

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**awhile** is a personal life timeline application that renders your life as a scrollable grid of months, with one row per year. It allows you to add notes to any month and mark life periods with color-coded range tags.

![Screenshot Placeholder](screenshot.png)

## Features

- **Visual Life Grid:** See your entire life at a glance, organized by years and months.
- **Monthly Notes:** Capture memories, milestones, or thoughts for any specific month.
- **Color-Coded Tags:** Mark significant life periods (e.g., "University," "Living in Berlin," "First Job") with range tags.
- **Self-Hosted & Private:** All data is stored locally in a single, human-readable JSON file. No cloud, no tracking.

---

## Quick Start

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

All your data is stored in `./data/awhile.json`. This file is created automatically on the first run.

**To create a backup:**
```bash
cp data/awhile.json data/awhile.backup.json
```

The data format is plain JSON, making it easy to export or manipulate if needed.

---

## Configuration

You can customize the application behavior using environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3001`  | The internal port the API server listens on. |

**Example with a custom port:**

```bash
PORT=4000 npm start
```

---

## Development

If you want to contribute, you'll need [Node.js](https://nodejs.org/) 20+. After cloning and running `npm install`, start the dev server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (Vite + API server running concurrently).

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for the full text.
