<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18MsnlGCD-kf0HbmEN5Wozn4vFYFBDXhf

## Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- npm

### Installation
```bash
npm install
```
Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

### Development
Start the development server:
```bash
npm run dev
```

### Build
Build for production:
```bash
npm run build
```

### Lint & Test
Check code quality:
```bash
npm run lint
npm run format
```

Run tests:
```bash
npm run test
```

## Deployment
This project is configured to deploy to **GitHub Pages** automatically via GitHub Actions.

1. Push changes to the `main` branch.
2. Go to repository **Settings** -> **Pages**.
3. Set the source to **GitHub Actions**.
4. The workflow will build and deploy the site.

## Technologies
- React 19
- TypeScript
- Vite
- Firebase
- Google GenAI
