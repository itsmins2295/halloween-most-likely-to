# 🎃 Halloween Most Likely To — multiplayer party game

A real-time multiplayer Halloween voting game. Project the host screen onto a TV, and have guests scan the QR code to vote on their own phones.

## Getting it online (recommended: Render)

1. Create a new **private or public GitHub repository** and upload these files, keeping the `public` folder intact.
2. At https://dashboard.render.com/ select **New → Web Service**, connect the repository.
3. Choose **Node**, set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Deploy; open the resulting `https://...onrender.com` URL on the computer connected to your TV, then press **Create a Game**.
5. Guests scan the QR code to join. Everyone votes from their phone. The host presses **Reveal results** and then **Next round**.

**Important:** On the free Render service, the site may take time to wake after inactivity, and a restart or new deployment will erase current games. Keep the app on one server instance, and avoid restarting it during the party. Test from two different phones beforehand.

## Local use / developer preview

```sh
npm install
npm start
```

Open http://localhost:3000 on your computer. To connect other devices locally, you must use your computer's LAN IP and have network access; for a QR code that reliably works for all guests, publish via a public HTTPS URL.

## Features

- Up to 60 guest players per room; randomly generated room codes.
- 20 Halloween questions.
- Big-screen host lobby and room QR.
- Private one-vote-per-player ballots on phones.
- Live progress: count of submitted votes (not choices) until reveal.
- Live results bar chart and host-controlled rounds.
- Refresh/reconnect support (guest IDs stored on device, host credentials stored for tab session).

## Constraints

The app stores game state in server memory, not a database. On server restart, rooms reset. Votes are anonymous to the host screen but the backend sees player IDs. Guests need network access to the deployed site. This is a casual party game, not a tamper-proof or security-audited election system.
