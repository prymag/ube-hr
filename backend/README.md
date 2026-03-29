# UBE HR Backend

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Build

```bash
npm run build
```

### Start Production

```bash
npm start
```

## API Endpoints

- `GET /api/hello` - Returns "Hello World!"

## Project Structure

Following the modular (feature-based) architecture:

```
src/
├── modules/
│   └── hello/          # Hello World feature module
│       ├── hello.routes.ts
│       ├── hello.controller.ts
│       ├── hello.service.ts
│       └── index.ts
├── shared/             # Reusable utilities, constants, types
├── providers/          # External integrations
├── middlewares/        # Express middlewares
├── config/             # Configuration files
├── app.ts              # Express app setup
└── server.ts           # Server entry point
```

## Testing the API

```bash
curl http://localhost:3000/api/hello
```

Response:
```json
{
  "message": "Hello World!"
}
```
