# Setwise

**Setwise** is a full-featured workout tracking web application designed to make logging gym sessions fast while still providing detailed workout, strength, body weight, and measurement history.

Build routines, log every set, track rest times, review previous performance, create supersets, and follow your progress over time — all in one place.

**Live app:** [setwise.yaryhin.com](https://setwise.yaryhin.com)

---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src="./screenshots/home.png" width="280" /><br />
      <b>Home</b>
    </td>
    <td align="center">
      <img src="./screenshots/active-workout.png" width="280" /><br />
      <b>Active Workout</b>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./screenshots/progress.png" width="280" /><br />
      <b>Progress</b>
    </td>
    <td align="center">
      <img src="./screenshots/routines.png" width="280" /><br />
      <b>Routines</b>
    </td>
  </tr>
</table>

---

## Features

### Workout Tracking

- Start a workout from a saved routine or create a custom workout
- Log weight, reps, sets, and rest time
- Built-in workout timer
- Independent rest timers for completed sets
- View previous performance while training
- Add notes to exercises
- Add or remove sets during a workout
- Add, replace, remove, and reorder exercises
- Resume an active workout after refreshing or closing the app
- Finish and save workouts to history

### Supersets

- Link adjacent exercises into supersets
- Automatically move between exercises as sets are completed
- Track independent rest timers for each exercise
- View the relevant previous-set rest time for the currently selected exercise
- Create and unlink supersets during an active workout

### Routines

- Create custom workout routines
- Edit and delete routines
- Add existing exercises or create new ones while building a routine
- Reorder exercises
- Start workouts directly from saved routines

### Exercise Library

- Create, edit, and delete custom exercises
- Organize exercises by category
- View exercise history
- New users receive a default exercise library to make onboarding easier

### Progress Tracking

Track progress across:

- Exercises
- Body weight
- Body measurements

Exercise analytics include:

- Best set volume
- Total volume
- Best weight
- Average rest time

Progress charts support multiple time ranges:

- 1 week
- 1 month
- 3 months
- All time

Charts also display the current value, total change, and number of recorded entries.

### Body Weight Tracking

- Log body weight
- Add, edit, and delete historical entries
- Choose the date and time of each log
- Track weight changes through progress charts
- Configure weight check-in reminders

### Body Measurements

- Track measurements such as waist, chest, arms, legs, and more
- Create custom measurement types
- Rename or archive measurement types
- Add, edit, and delete measurement logs
- Track individual measurement types over time
- Configure measurement check-in reminders

### Personalization

- Light and dark themes
- Preferred body-weight unit
- Preferred workout-weight unit
- Preferred measurement unit
- Configurable first day of the week
- Configurable weight and measurement reminder frequency

### Languages

Setwise currently supports:

- English
- Ukrainian
- Russian
- Spanish

Default exercises and measurement types are also created according to the user's selected language during initial setup.

### Authentication & Persistence

- User authentication powered by Supabase
- Individual user profiles
- User-specific exercises, routines, workouts, weight logs, and measurements
- Active workout state persisted locally so an in-progress session can survive a refresh or accidental page close

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- SCSS / Sass
- CSS Modules
- Lucide React
- Classnames

### Data & Authentication

- Supabase
- Supabase Authentication
- PostgreSQL

### Charts

- Recharts

### Internationalization

- i18next
- react-i18next

### Deployment

- Netlify
- Cloudflare
- Custom domain: [setwise.yaryhin.com](https://setwise.yaryhin.com)

---

## Why I Built Setwise

Setwise started as a portfolio project for improving my React, TypeScript, and database skills.

The original idea was much smaller: build a simple gym tracker where workouts and sets could be logged.

As I began using the app during my own workouts, I kept finding things that would make the experience better — previous workout data, rest timers, routines, progress charts, supersets, body-weight tracking, measurements, workout recovery after a refresh, and more.

That gradually turned Setwise from a small practice project into a complete workout-tracking application built around real gym sessions.

The main goal throughout development has been to keep logging fast and practical while still collecting enough data to make long-term progress easy to understand.

---

## Project Structure

```text
src/
├── components/     # Reusable UI and feature components
├── locales/        # English, Spanish, Russian, and Ukrainian translations
├── pages/          # Main application pages
├── services/       # Supabase queries and application data logic
├── styles/         # Global styles and SCSS modules
├── types/          # TypeScript types
├── App.tsx         # Authentication, routing, profile setup, and reminders
├── i18n.ts         # Internationalization setup
├── main.tsx        # Application entry point
└── supabase.ts     # Supabase client configuration
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/yaryhiin/setwise.git
cd setwise
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_key
```

You will need your own Supabase project and database schema for the application data.

### 4. Start the development server

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

---

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs the TypeScript build and creates a production Vite build.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run preview
```

Serves the production build locally for previewing.

---

## Status

Setwise is actively being developed and improved.

The core workout-tracking experience is functional, with ongoing work focused on UI polish, usability improvements, additional progress insights, and future mobile support.

## License

Copyright © 2026 Tymofii Yaryhin. All rights reserved.

The source code in this repository is publicly available for **viewing and educational purposes only**.

You may:

* View the source code.
* Study it for learning and reference purposes.
* Run the project locally for personal evaluation.

You may **not**, without prior written permission:

* Copy or redistribute substantial portions of the source code.
* Modify and republish the project as your own.
* Use the code in a commercial product or service.
* Sell, sublicense, or otherwise commercially exploit the software.
* Publish a derivative version of Setwise under another name.

Setwise and its source code remain the intellectual property of **Tymofii Yaryhin**.

For permission regarding reuse or commercial use, please contact the author.

