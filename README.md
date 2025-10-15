# Mobile Survey Application

Mobile Survey Application is an offline-capable data collection tool built with React. Field teams can sync structured survey templates from a remote JSON endpoint, capture responses (including photos, attachments, and GPS coordinates), and store everything locally in the browser via IndexedDB. When you're back online, survey results can be exported as a ZIP archive for further processing.

## ✨ Key Features

- **Offline-first storage** powered by [Dexie](https://dexie.org/) (IndexedDB).
- **Template syncing** from a remote JSON URL with version checks.
- **Flexible question types**: text, dropdown, attachment upload, camera capture, and geolocation.
- **Survey instance management** with create/edit/delete flows per template.
- **Bulk export** that zips JSON results plus any captured files for analysis.

## 🧱 Tech Stack

- [React 19](https://react.dev/) + [React Router 6](https://reactrouter.com/) for UI and navigation.
- [Dexie](https://dexie.org/) for IndexedDB interactions.
- [Axios](https://axios-http.com/) for HTTP requests.
- [JSZip](https://stuk.github.io/jszip/) and [FileSaver](https://github.com/eligrey/FileSaver.js/) for exports.
- [Create React App](https://create-react-app.dev/) build tooling via `react-scripts@5`.
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + Jest for unit testing.

## ✅ Prerequisites

- **Node.js** ≥ 18.17.0 (LTS recommended).
- **npm** ≥ 9 (bundled with recent Node builds).

Verify your toolchain:

```powershell
node -v
npm -v
```

> 💡 If you're using a Node version manager (nvm, fnm, volta), switch to an LTS release before installing dependencies.

## 🚀 Setup

1. **Clone the repository**
	 ```powershell
	 git clone https://github.com/kankan-sarkar/MobileSurveyApplication.git
	 cd MobileSurveyApplication
	 ```
2. **Install dependencies**
	 ```powershell
	 npm install
	 ```
3. **Start the development server**
	 ```powershell
	 npm start
	 ```
	 The app opens on [http://localhost:3000](http://localhost:3000). Hot reloading is enabled, so edits update automatically.

If you prefer Yarn or PNPM, remove the existing `package-lock.json` and install with your package manager of choice; the scripts below remain the same.

## 📦 Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Runs the app in development mode with hot reloading. |
| `npm test` | Launches Jest in watch mode. See note below for CI usage. |
| `npm run build` | Produces an optimized production bundle in `build/`. |
| `npm run eject` | Copies CRA's build configuration into the repo (irreversible). |

### Running Tests Non-Interactively

CRA's default test runner watches for file changes. In automated environments (CI/CD), disable watch mode:

```powershell
$Env:CI = "true"
npm test
```

### Production Build

```powershell
npm run build
```

The build artifacts land in `build/`. Deploy the folder to any static hosting provider (Netlify, Vercel, S3, Firebase Hosting, etc.).

## 🗂️ Project Structure

```
src/
├── App.js              # Application routes
├── pages/              # Dashboard, SurveyInstances, SurveyForm, NotFound
├── db/db.js            # Dexie database schema definitions
├── App.css / index.css # Global styling (currently minimal)
├── App.test.js         # Smoke test verifying dashboard renders
└── reportWebVitals.js  # Optional performance reporting hook
```

## 📝 Survey Template Format

Templates are expected to be JSON documents accessible via HTTPS. The dashboard's **Sync Link** field fetches and validates the payload. A minimal template looks like this:

```json
{
	"id": "household-survey",
	"title": "Household Survey",
	"version": 2,
	"sections": [
		{
			"id": "demographics",
			"title": "Demographics",
			"questions": [
				{
					"id": "respondent-name",
					"label": "Respondent name",
					"type": "textbox"
				},
				{
					"id": "photo",
					"label": "Household photo",
					"type": "camera"
				}
			]
		}
	]
}
```

**Required fields**

- `id` – Unique string identifier used as the template primary key.
- `title` – Display name shown in the dashboard and exports.
- `version` – Used to detect updates when syncing.
- `sections` – Array of sections, each with `questions`.

**Supported question types**

- `textbox` – Freeform multi-line text.
- `dropdown` – Renders a `<select>`; include an `options` array.
- `camera` – Prompts for photo capture or upload.
- `attachment` – Accepts file uploads; provide `accept` MIME filters.
- `location` – Captures latitude/longitude using the browser geolocation API.

When exporting, answers are written to `results.json` and binary blobs are stored under the `attachments/` folder in the generated ZIP.

## 📤 Working with Survey Data

1. **Add a template** via the dashboard by pasting a template URL into the Sync Link field.
2. **Create instances** to capture responses for that template.
3. **Fill out the survey**; uploads and locations are preserved locally.
4. **Save** to persist data to IndexedDB.
5. **Export All** to download a ZIP containing `results.json` + attachments for offline transfer.

All data stays in the browser storage until explicitly deleted. Use the Delete buttons on templates or instances to remove local copies.

## 🧪 Testing Notes

- DOM assertions rely on `@testing-library/jest-dom` matchers (configured in `src/setupTests.js`).
- The sample `App.test.js` ensures the dashboard renders; add more tests to cover survey flows as needed.

## 🔧 Troubleshooting

- **IndexedDB disabled**: Ensure the browser allows local storage and not in private/incognito mode.
- **Geolocation blocked**: Browsers require HTTPS (or localhost) and explicit user permission.
- **Template sync fails**: Confirm the URL returns valid JSON matching the format above and that CORS headers allow your origin.
- **Build errors on Windows**: Clear caches with `npm cache clean --force` and reinstall dependencies.

## 📄 License

This project is distributed under the terms of the [LICENSE](./LICENSE) file.
