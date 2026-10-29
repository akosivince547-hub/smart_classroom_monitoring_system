# Campus Rooms

A Vue 3 and Vite prototype for classroom availability and schedule management at the CCS San Carlos Campus.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Try the demo

Enter a display name on the welcome screen, then choose a role:

- **Student:** Browse room availability by time slot, make a reservation, and cancel your own reservations.
- **Faculty:** Review scheduled classes and confirm an early room release.
- **Admin:** Add or remove classes from the master schedule and manually reset reservations and early releases.

Changes are stored in the browser's local storage. This is a front-end demo: role selection is not authentication, data is not shared between users or devices, and daily reset is a manual action rather than a server-side midnight job. Connect the app to an authenticated API and database before using it for real campus scheduling.
