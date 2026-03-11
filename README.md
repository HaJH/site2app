# site2app

Wrap any URL into a standalone desktop app powered by Electron.

## Features

- Custom titlebar with back/forward/reload navigation
- Ctrl+F find-in-page search
- System tray with optional close-to-tray
- Theme selection (System / Light / Dark)
- Keyboard shortcuts (zoom, fullscreen, navigation)
- Session persistence across restarts
- Desktop notifications support
- External links open in default browser (origin-based filtering)
- Settings via titlebar menu (theme, app name visibility, close-to-tray)
- Single instance (reactivates existing window)

## Requirements

- Node.js 18+
- Windows or macOS

## Quick Start

```bash
npx site2app --name "MyApp" --icon icon.png --url https://example.com
```

## Installation

```bash
npm install -g site2app
```

Or install from source:

```bash
git clone https://github.com/HaJH/site2app.git
cd site2app
npm install && npm install -g .
```

## Usage

```bash
site2app --name <name> --icon <path> --url <url> [--target <type>] [--output <path>]
```

### Options

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `--name` | Yes | App name | - |
| `--icon` | Yes | PNG icon path (min 256x256) | - |
| `--url` | Yes | URL to wrap | - |
| `--target` | No | `dir`, `portable`, `installer` | `dir` |
| `--output` | No | Output directory | `./dist` |

### Examples

```bash
# Unpacked build (fastest, good for testing)
site2app --name "Google" --icon google.png --url https://www.google.com

# Portable executable
site2app --name "Google" --icon google.png --url https://www.google.com --target portable

# Installer (NSIS on Windows, DMG on macOS)
site2app --name "Google" --icon google.png --url https://www.google.com --target installer

# Local dev server
site2app --name "DevServer" --icon server.png --url http://localhost:3000
```

## Build Targets

| Target | Windows | macOS |
|--------|---------|-------|
| `dir` | Unpacked folder | Unpacked folder |
| `portable` | Portable .exe | .dmg |
| `installer` | NSIS installer | .dmg |

## Testing

```bash
npm test
```

## License

[MIT](LICENSE)
