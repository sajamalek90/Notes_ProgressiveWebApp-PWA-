# ✦ Nota — Notes with Purpose

> A beautiful, focused, offline-ready notes app built with pure HTML, CSS & JavaScript — no frameworks, no dependencies, no account required.

![Nota Preview](https://img.shields.io/badge/PWA-Ready-8B5CF6?style=flat-square&logo=googlechrome&logoColor=white)
![HTML CSS JS](https://img.shields.io/badge/Stack-HTML%20%2F%20CSS%20%2F%20JS-93C5FD?style=flat-square)
![License](https://img.shields.io/badge/License-Apache%202.0-FDBA74?style=flat-square)

---

## 📁 Project Structure

```
notea-en/
├── index.html                  # Main app shell
├── sw.js                       # Service Worker (offline + caching)
├── styles/
│   └── index.css               # All styles & design tokens
├── js/
│   └── main.js                 # App logic, state, rendering
└── manifest_and_icons/
    └── manifest.json           # PWA manifest
```

---

## 🚀 Getting Started

No build tools, no npm install. Just open and go.

### Option 1 — Open directly
Double-click `index.html` in your file manager. The app runs fully in-browser.

### Option 2 — Local dev server (recommended for PWA features)
```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .

# Using VS Code
# Install the "Live Server" extension, then click "Go Live"
```

Then visit `http://localhost:8080` in your browser.

> **Note:** The Service Worker and PWA install prompt require the app to be served over **HTTPS** or **localhost**. Opening `index.html` directly as a `file://` URL will disable those features.

---

## ✨ Features

### 🗂 Organization
| Feature | Details |
|---|---|
| **3 Categories** | Work · Personal · Ideas — each with its own accent color |
| **Pin notes** | Pinned notes always appear at the top of every view |
| **Sidebar filters** | Filter by category or view only pinned notes |
| **Live counts** | Each filter shows a live count badge |

### 🎯 Focus
| Feature | Details |
|---|---|
| **Focus Mode** | Expands the editor full-screen to remove distractions |
| **Rich text toolbar** | Bold, Italic, Underline, bullet lists, numbered lists |
| **Live word count** | Updates in real-time as you type |
| **Keyboard shortcuts** | `Ctrl+S` save · `Ctrl+N` new note · `Esc` close |

### 📖 Clarity
| Feature | Details |
|---|---|
| **Card previews** | See title, content snippet, category & timestamp at a glance |
| **Relative timestamps** | "Just now", "2h ago", "3d ago" |
| **Grid & List views** | Toggle between card grid and compact list |
| **Typography** | *Lora* (display) + *DM Sans* (body) for comfortable reading |

### ⚡ Productivity
| Feature | Details |
|---|---|
| **Instant search** | Searches across titles and note content simultaneously |
| **3-way sort** | Newest first · Oldest first · Alphabetical |
| **Local storage** | All notes saved automatically in the browser — no account needed |
| **Sample notes** | Pre-loaded on first run to get you started immediately |

---

## 📱 Progressive Web App (PWA)

Nota is a fully compliant PWA. Here's how it's implemented:

### Service Worker (`sw.js`)
Uses a **cache-first** strategy for local assets:

```
Request comes in
       │
       ▼
  Cache hit? ──Yes──▶ Serve from cache (instant)
       │
       No
       │
       ▼
  Fetch from network ──▶ Cache the response ──▶ Serve to user
```

External resources (Google Fonts) use **network-first** with a cache fallback so the app still renders offline with the last fetched fonts.

### Manifest (`manifest.json`)
```json
{
  "name": "Nota App",
  "display": "standalone",
  "theme_color": "#8B5CF6",
  "background_color": "#FFFDF7"
}
```

### Offline support
- All app assets are pre-cached on first install
- Notes are saved to `localStorage` — available with zero network
- An offline toast notification appears when the connection drops
- Old cache versions are automatically cleaned up on SW activation

### Install prompt
When the browser detects the app is installable, an **"Install App"** button appears at the bottom of the sidebar.

---

## 🎨 Color System

| Role | Name | Hex |
|---|---|---|
| Primary | Lavender | `#8B5CF6` |
| Secondary | Sky Blue | `#93C5FD` |
| Accent | Peach | `#FDBA74` |
| Background | Cream White | `#FFFDF7` |
| Cards | Pastel Yellow | `#FEF9C3` |
| Text Main | Soft Black | `#334155` |
| Text Secondary | Gray | `#94A3B8` |
| Border | — | `#F1F5F9` |
| Success | — | `#86EFAC` |
| Danger | — | `#FCA5A5` |

All colors are defined as **CSS custom properties** in `:root` inside `index.css`, making them easy to theme or override.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + N` | Create a new note |
| `Ctrl + S` | Save the current note |
| `Esc` | Close the editor modal |

---

## 🗄️ Data Storage

Notes are stored in the browser's `localStorage` under the key `nota-notes` as a JSON array.

### Note schema
```js
{
  id:         "lzf3kx9ab",   // Unique ID (base-36 timestamp + random)
  title:      "My note",
  content:    "<p>HTML content</p>",
  category:   "work",        // "work" | "personal" | "ideas"
  pinned:     false,
  createdAt:  1714320000000, // Unix timestamp (ms)
  updatedAt:  1714323600000
}
```

> **Heads up:** Clearing browser data or `localStorage` will erase all notes. For persistence across devices, consider adding a cloud sync layer via the Fetch API or a backend of your choice.

---

## 🧩 Extending the App

Some ideas for taking Nota further:

- **Dark mode** — add a `[data-theme="dark"]` attribute and override the CSS variables
- **Tags** — extend the note schema with a `tags: []` field and add a tag filter to the sidebar
- **Markdown support** — swap `contenteditable` for a library like [marked.js](https://marked.js.org/)
- **Export** — add a button that serializes notes to `.json` or plain `.txt`
- **Cloud sync** — POST notes to any REST API or use Firebase Firestore as a backend
