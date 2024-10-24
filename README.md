# discord-api

Fetch data from the Discord API and save it in the database

Run `npm run dev` in your terminal to start a development server
Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
Run `npm run deploy` to publish your worker

Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
`Env` object can be regenerated with `npm run cf-typegen`.
