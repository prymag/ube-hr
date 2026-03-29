# Frontend

React + Vite boilerplate following the modern folder structure.

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will open automatically at `http://localhost:3000` and display "Hello World".

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Folder Structure

```
frontend/
├── src/
│   ├── app/              # App entry and root configuration
│   │   ├── index.jsx     # Render root
│   │   ├── App.jsx       # Root component
│   │   ├── routes/       # Route config
│   │   ├── providers/    # Global providers
│   │   └── styles/       # Global styles
│   ├── features/         # Feature modules
│   └── shared/           # Reusable code
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── types/
│       └── styles/
├── public/               # Static assets
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
└── package.json
```

This structure supports scalable React development with clear separation of concerns.
