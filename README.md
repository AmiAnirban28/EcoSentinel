# EcoSentinel

Install dependencies in each app once:

```powershell
npm install --prefix remix-ecodsentinel-sid-10
npm install --prefix remix-v-jash-2
```

From the workspace root, start both apps with one command:

```powershell
npm run dev
```

Open http://localhost:3000 to use the main dashboard and its embedded maps. The
maps app and its API are proxied through the same origin under `/maps` and
`/api`, so you do not need to open the maps server's port directly. Stop both
servers with Ctrl+C. The VS Code task **EcoSentinel: Start Both** runs the same
command. The maps app requires Node 22+.

Choose where to open the dashboard:

- VS Code integrated browser: open the Command Palette (`Ctrl+Shift+P`), run
	**Simple Browser: Show**, and use [http://localhost:3000](http://localhost:3000).
- Regular browser: open [http://127.0.0.1:3000](http://127.0.0.1:3000).
