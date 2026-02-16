# Convert — Universal File Converter

<p align="center">
  <img src="public/favicon.svg" width="80" height="80" alt="Convert Logo">
</p>

<p align="center">
  <strong>Transform any file format right in your browser.</strong><br>
  No uploads, complete privacy. Powered by WebAssembly.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## ✨ Features

- **🔒 100% Private** — All processing happens in your browser. Your files never leave your device.
- **⚡ WebAssembly Powered** — Using FFmpeg, ImageMagick, and more running natively in your browser.
- **🎯 Universal Conversion** — Convert between any format — images, videos, audio, documents, even across categories!
- **🎨 Beautiful UI** — Modern, elegant interface with smooth animations and dark mode.
- **📱 Responsive** — Works great on desktop and mobile devices.

## 🛠️ Tech Stack

- **[Astro](https://astro.build/)** — Static site generation with View Transitions
- **[React](https://react.dev/)** — Interactive UI components (Islands architecture)
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling with OKLCH colors
- **[Framer Motion](https://www.framer.com/motion/)** — Fluid animations
- **[Lucide Icons](https://lucide.dev/)** — Beautiful icon set

## 🚀 Development

### Prerequisites

- Node.js 22+
- npm or bun

### Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/convert.git
cd convert

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to see the app.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |

## 📦 Deployment

### GitHub Pages

1. **Fork this repository**

2. **Update `astro.config.mjs`:**
   ```js
   export default defineConfig({
     site: 'https://yourusername.github.io',
     base: '/convert', // your repo name
   });
   ```

3. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: **GitHub Actions**

4. **Push to `main` branch** — The GitHub Action will automatically build and deploy.

### Manual Deployment

```bash
npm run build
# Deploy the `dist/` folder to your hosting provider
```

## 📁 Project Structure

```
convert/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   ├── layouts/         # Astro layouts
│   ├── pages/           # Route pages
│   └── styles/          # Global styles
├── astro.config.mjs     # Astro configuration
└── package.json
```

## 🙏 Credits

- Original [Convert](https://github.com/p2r3/convert) project by [p2r3](https://github.com/p2r3)
- UI reimagined with Astro + React + Tailwind

## 📝 License

MIT License — feel free to use this project however you'd like!
