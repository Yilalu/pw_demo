# EcoLife

EcoLife is a local-first website for learning about everyday sustainable living and keeping track of small changes you want to try. Browse practical eco tips, explore example reusable products, and—if you create an account—save tips, favorite products, and manage personal activities from your dashboard.

EcoLife is an educational and organizational tool, not an online shop: the product cards are examples and do not process orders. Making a purchase is not required to use the site. The only required external service is Open-Meteo, used by the home-page weather card to look up a city and show its current conditions in Fahrenheit and miles per hour.

## What the application does

### Frontend

The frontend is a React single-page application built with Vite. It renders the pages in your browser, sends account and application-data requests to the local Express API, and displays API responses or validation errors.

### Backend server

The backend is an Express server running on your computer. It:

- Provides the JSON API documented below.
- Validates account, profile, and activity input.
- Hashes passwords with bcrypt before storing them.
- Creates a signed, HTTP-only session cookie after registration or login.
- Checks that private requests are signed in and only read or change the current user's records.
- Creates and seeds the SQLite database when the server starts for the first time.
- Serves the built React application as well as the API in production mode.

### SQLite database

The database is a regular local file, not a cloud database. By default, it is created at `data/ecolife.db`. SQLite tables store users, sample tips and products, saved-tip bookmarks, product favorites, and user activities. Foreign-key constraints connect personal records to their owner.

### Weather service

The weather card runs in the browser and calls Open-Meteo directly; it does not use an EcoLife `/api` endpoint:

1. It sends the city text to the Open-Meteo Geocoding API.
2. It takes the first matching city's coordinates and requests its current weather.
3. It displays the returned temperature in °F and wind speed in mph.

The last successfully selected city is remembered in that browser's local storage. If the visitor has no previously selected city, a signed-in visitor's profile location is suggested automatically. Weather therefore requires an internet connection. EcoLife does not send city-weather requests through or store them in the Express/SQLite backend.

## Requirements

- Node.js 20 LTS or newer
- npm (included with Node.js)
- An internet connection to use the Open-Meteo weather lookup

Check the installed versions in PowerShell:

```powershell
node --version
npm --version
```

## Install and run in development

Run these commands from the EcoLife project directory:

```powershell
npm install
npm run dev
```

The `dev` command starts both services:

| Service | Default address | Purpose |
| --- | --- | --- |
| Vite React frontend | <http://localhost:5173> | Website used in the browser |
| Express API | <http://localhost:3000> | Local backend and JSON endpoints |

Open <http://localhost:5173> in your browser. Vite forwards requests beginning with `/api` to Express on port 3000, so the browser uses the same frontend origin for the app's API requests. Leave the development terminal running while using the app; press **Ctrl+C** in it to stop both services.

You do not have to run a separate database setup or migration command. On server startup, the app creates the database directory, creates any missing tables, and inserts sample eco tips and products if those tables are empty.

### Check that the server is running

Visit <http://localhost:3000/api/health>, or run:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

The server should return:

```json
{"status":"ok"}
```

To check public data, visit <http://localhost:3000/api/tips> or <http://localhost:3000/api/products>. The private `/api/activities` endpoint should return **401 Unauthorized** until you sign in.

## Environment configuration

The project includes an [.env.example](./.env.example) file. Environment variables are optional for ordinary local development. To configure them, copy the example to `.env` in the project root and edit the values:

```powershell
Copy-Item .env.example .env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | TCP port used by the Express server. If changed during development, update the `/api` proxy in `vite.config.js` to point to the new port. |
| `SESSION_SECRET` | Local-development fallback in `server/index.js` | Secret used to sign session cookies. Set a long, random, private value, especially when sharing your computer or running in production. |
| `DATABASE_PATH` | `./data/ecolife.db` | SQLite file path. Relative paths are resolved from the project directory; parent directories are created automatically. |
| `NODE_ENV` | Development unless set | Set to `production` to serve the production build and enable production cookie settings. |

Do not share or commit your `.env` file. The example secret is only a placeholder; it is not intended as a production secret.

## Accounts, sessions, and personal data

1. Register at `/register`, providing a name, email, and password of at least eight characters.
2. The server validates the input, stores a bcrypt password hash—not the plain-text password—and starts a session.
3. The browser stores the session identifier in an HTTP-only cookie. Client-side JavaScript cannot read the cookie.
4. The frontend sends that cookie automatically with same-origin requests.
5. Private API routes identify the account from the session rather than accepting a `user_id` from the browser.

The dashboard lets the signed-in user create, complete or uncomplete, and remove activities, and update their name and location. Saved tips, favorites, activities, and profile updates are scoped to the authenticated account. The public tips and product responses include bookmark/favorite status for the current session when signed in.

The default Express session store is in memory. Sessions are lost when the server process restarts. This setup is convenient for a local development application; a deployed production application should use a durable session store and secure deployment settings.

## API reference

All EcoLife API routes start with `/api`. Request and response bodies use JSON unless noted. Routes marked **Yes** require an authenticated session cookie. Private data can only be accessed or changed by its owning account.

### Health and authentication

| Method | Endpoint | Sign-in? | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | No | Checks server availability. Returns `{"status":"ok"}`. |
| `GET` | `/api/auth/me` | No | Returns the current session's public user, or `{"user":null}` when signed out. |
| `POST` | `/api/auth/register` | No | Creates an account and signs it in. Body: `{"name":"Alex Green","email":"alex@example.com","password":"at-least-8-characters"}`. Returns `201` and the public user; duplicate email returns `409`. |
| `POST` | `/api/auth/login` | No | Signs in to an existing account. Body: `{"email":"alex@example.com","password":"your-password"}`. Invalid credentials return `401`. |
| `POST` | `/api/auth/logout` | No | Ends the current session and clears its cookie. |

### Eco tips and bookmarks

| Method | Endpoint | Sign-in? | Description |
| --- | --- | --- | --- |
| `GET` | `/api/tips` | No | Lists sample eco tips. Includes `bookmarked: 0` or `1` for the current user when signed in. |
| `GET` | `/api/bookmarks` | Yes | Lists the signed-in user's saved tips. |
| `PUT` | `/api/bookmarks/:tipId` | Yes | Saves the specified existing tip. Repeating the request does not create duplicates. Returns `{"bookmarked":true}`. |
| `DELETE` | `/api/bookmarks/:tipId` | Yes | Removes that tip from the signed-in user's saved tips. Returns `{"bookmarked":false}`. |

### Products and favorites

| Method | Endpoint | Sign-in? | Description |
| --- | --- | --- | --- |
| `GET` | `/api/products` | No | Lists sample products. Includes `favorited: 0` or `1` for the current user when signed in. |
| `GET` | `/api/favorites` | Yes | Lists the signed-in user's favorite products. |
| `PUT` | `/api/favorites/:productId` | Yes | Adds the specified existing product to favorites. Repeating the request does not create duplicates. Returns `{"favorited":true}`. |
| `DELETE` | `/api/favorites/:productId` | Yes | Removes the product from the signed-in user's favorites. Returns `{"favorited":false}`. |

### Personal activities and profile

| Method | Endpoint | Sign-in? | Description |
| --- | --- | --- | --- |
| `GET` | `/api/activities` | Yes | Lists only the current user's activities. |
| `POST` | `/api/activities` | Yes | Creates a personal activity. Body: `{"title":"Walk to the market","category":"Transport"}`. Title is required; category defaults to `Everyday`. Returns `201` and the new activity. |
| `PATCH` | `/api/activities/:activityId` | Yes | Updates completion status. Body: `{"completed":true}` or `{"completed":false}`. |
| `DELETE` | `/api/activities/:activityId` | Yes | Deletes an activity owned by the current user. |
| `PATCH` | `/api/profile` | Yes | Updates the current user's name and location. Body: `{"name":"Alex Green","location":"Portland"}`. Location may be an empty string. |

### Example API calls

Public tip listing works directly in a browser:

<http://localhost:3000/api/tips>

Use PowerShell to check an endpoint that does not require sign-in:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod http://localhost:3000/api/products
```

The API uses a session cookie for authenticated requests. For manual testing, a REST client such as the VS Code REST Client, Postman, or Insomnia can retain cookies between requests. Send the login/register JSON request first, keep the returned `ecolife.sid` cookie, then send the desired authenticated request with that cookie. From the running website, register or sign in normally; the frontend includes the cookie automatically.

### Test with Postman

An importable Postman collection is included at [`postman/EcoLife.postman_collection.json`](./postman/EcoLife.postman_collection.json).

1. Start the app with `npm run dev` and make sure `http://localhost:3000/api/health` returns `{"status":"ok"}`.
2. In Postman, select **Import**, choose **Files**, and open `postman/EcoLife.postman_collection.json`.
3. Open the **EcoLife Local API** collection. Its `baseUrl` variable defaults to `http://localhost:3000`; change it if your server uses another port.
4. Send **Start here → Health check** to confirm the API responds.
5. Send **Authentication → Register a new user**. The request creates a unique email automatically. Postman saves the returned `ecolife.sid` cookie in its cookie jar for `localhost`.
6. Send **Authentication → Current signed-in user** to confirm the session, then send requests in **Tips and bookmarks**, **Products and favorites**, or **Activities and profile**. Requests marked “sign-in required” use that saved cookie.

The collection automatically stores an ID after **List tips**, **List products**, and **Create an activity**, so the bookmark, favorite, completion, and delete examples can use those IDs. Run the corresponding list/create request first if an ID variable is empty.

The collection uses `GreenExample123!` as its example password. The password is only a Postman collection variable for creating a local test account; it is not a production credential. The collection makes a fresh email each time you register, so repeated tests do not fail because an account already exists. Postman displays each response body and status in its response panel; the Health, registration, list, and activity-create requests also include basic response tests.

Validation and access errors are JSON responses. Common HTTP statuses include:

- `200`: request succeeded.
- `201`: account or activity created.
- `400`: missing, malformed, or invalid input.
- `401`: sign-in required or login credentials invalid.
- `404`: API route or requested record not found; private activity operations also use `404` when a record does not belong to the current user.
- `409`: an account already exists for that email address.
- `500`: unexpected server error.

## Weather lookup

The home-page weather search uses:

- Geocoding: `GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json`
- Current forecast: `GET https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`

Enter a city in the weather card and press **Get weather**. If the city is not found or Open-Meteo is unavailable, the card displays an error instead of showing made-up or outdated readings. Weather lookups go from the browser to Open-Meteo, and do not create a server-side API endpoint or save the city's forecast in SQLite.

## Production build

To build the static frontend:

```powershell
npm run build
```

Vite writes the compiled frontend to `dist/`. To serve both that frontend and the API from Express:

```powershell
$env:NODE_ENV = "production"
$env:SESSION_SECRET = "replace-with-a-long-random-secret"
npm start
```

Then open <http://localhost:3000>. To persist configuration across shells, use a private `.env` file rather than setting temporary PowerShell variables. The production server expects the frontend build to exist; run `npm run build` again after frontend changes.

## Project structure

```text
eco_life/
├── data/                       # Created at runtime; local SQLite database
├── server/
│   ├── db.js                   # SQLite schema, database setup, and sample data
│   └── index.js                # Express API, sessions, validation, static hosting
├── src/
│   ├── components/             # Reusable UI, layout, cards, and weather widget
│   ├── context/AuthContext.jsx # Shared authentication state
│   ├── hooks/useToast.js        # Reusable success/error message behavior
│   ├── lib/api.js              # Frontend API helper and shared categories
│   ├── pages/                  # Home, About, tips, products, auth, dashboard
│   ├── App.jsx                 # Providers and application routes
│   ├── main.jsx                # React application entry point
│   └── styles.css              # Responsive styles for the application
├── tests/
│   ├── seed.spec.js            # Browser seed used by the planner/generator agents
│   ├── e2e/                    # Destination for tests generated by the agent
│   │   ├── <feature>/          # Group generated specs by feature
│   ├── fixtures/               # Reusable Playwright fixtures
│   ├── pages/                  # Page objects: locators and UI actions
│   ├── utils/                  # Test-only helper functions
│   └── data/                   # Static test data
├── examples/
│   └── playwright-docs.spec.js # Playwright documentation example; outside the EcoLife test suite
├── specs/                      # Playwright test plans
├── playwright/
│   └── .auth/                  # Optional saved auth state; ignored by Git
├── playwright.config.js        # Chromium project, local base URL, and dev-server lifecycle
├── .env.example                # Documented local configuration template
├── index.html                  # HTML entry point
├── package.json                # Dependencies and npm scripts
└── vite.config.js              # Vite configuration and development API proxy
```

## npm scripts

| Command | Description |
| --- | --- |
| `npm install` | Installs frontend and backend dependencies. |
| `npm run dev` | Starts the Express API and Vite development server together. |
| `npm run dev:server` | Starts/restarts the Express API as server files change. |
| `npm run dev:client` | Starts the Vite frontend development server. |
| `npm run build` | Creates an optimized production frontend in `dist/`. |
| `npm start` | Starts the Express server; serves `dist/` when `NODE_ENV=production`. |
| `npm run preview` | Previews the built frontend using Vite's preview server. |

## Playwright tests

For AI-assisted testing with Playwright MCP, Playwright CLI, and the Planner/Generator/Healer agents, see the team guide in [docs/playwright-ai/](./docs/playwright-ai/00-start-here.md).

Playwright runs the tests against the local app. The configured test directory is `tests/`, so Playwright discovers matching spec files there and recursively in subdirectories such as `tests/e2e/`. This project uses JavaScript test files with Playwright's `.spec.js` or `.test.js` filename patterns.

Install the Chromium browser once after installing npm dependencies:

```powershell
npx playwright install chromium
```

From the project directory, first list the tests Playwright will discover:

```powershell
npx playwright test --list
```

Run all discovered tests:

```powershell
npx playwright test
```

Playwright starts the Express API and Vite frontend automatically using the `webServer` settings in `playwright.config.js`; you do not need to start `npm run dev` in a separate terminal. To run the seed smoke test in the root of `tests/`, pass its path using forward slashes:

```powershell
npx playwright test tests/seed.spec.js
```

To watch the browser while a test runs, add `--headed`:

```powershell
npx playwright test tests/seed.spec.js --headed
```

Use forward slashes in Playwright's file filter even when running from PowerShell. For example, use `npx playwright test tests/seed.spec.js`, not `npx playwright test .\tests\seed.spec.js`. The backslashes in the latter can be interpreted as regular-expression escapes.

`tests/seed.spec.js` is the first end-to-end smoke test: its fixture creates a unique account through the API, then the test signs in through the website and checks that the dashboard opens. It validates the sign-in flow, but it does not sign in or seed state for other tests—Playwright gives each test an isolated browser context. Add further `.spec.js` tests under `tests/e2e/`; import the shared `test` and `expect` from `tests/fixtures/index.js` using the appropriate relative path, and reuse page objects under `tests/pages/` and synthetic-account helpers under `tests/utils/`.

### When a test fails

1. Read the failed test name and assertion/call log printed in the terminal.
2. Open the HTML report for detailed errors, call logs, and any artifacts the test collected:

```powershell
npx playwright show-report
```

3. To rerun only the tests that failed in the previous run:

```powershell
npx playwright test --last-failed
```

4. To reproduce a failure and save a trace even when running locally (local retries are disabled):

```powershell
npx playwright test tests/seed.spec.js --trace retain-on-failure
```

Open the report again and select the failed test's trace to inspect actions, DOM snapshots, and network activity. Test output and failure artifacts are saved under `test-results/`; the HTML report is under `playwright-report/`. Both locations are excluded from Git.

For interactive debugging, run a specific test with Playwright Inspector:

```powershell
npx playwright test tests/seed.spec.js --debug
```

Playwright's browser cache and saved authentication state are also excluded from Git.

## Troubleshooting

- **Port 3000 or 5173 is already in use:** Stop the other process using that port, or configure a different API port and change the Vite `/api` proxy to match.
- **The website loads but API calls fail:** Confirm both development processes are running and that `http://localhost:3000/api/health` returns `{"status":"ok"}`.
- **A private API request returns 401:** Sign in through the website first. Manually issued requests need the current `ecolife.sid` session cookie.
- **The weather card cannot find a city:** Try its common English name or a nearby larger city. City names can be shared by different places; Open-Meteo returns its first match.
- **Database path or permissions error:** Check that the configured database directory is writable. Parent directories are created automatically, but the operating system must allow file creation there.
- **A change is not visible in production:** Run `npm run build` again, then restart `npm start`.
