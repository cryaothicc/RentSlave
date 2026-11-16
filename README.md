# RentSlave

Compare renting and buying a home in the Philippines. Adjust assumptions such as the home price, down payment, mortgage rate, monthly rent, and investment return to see projected costs and net wealth over time in Philippine pesos.

The results are illustrative and depend on the values you enter.

## Run locally

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to create the production files in `dist/`, or `npm run preview` to serve a built copy locally.

## GitHub Pages

Pages currently publishes the repository root from `master`. That serves the source `index.html`, which points to `/src/main.tsx`. The request returns 404 and React never starts.

To deploy, set Vite's `base` to `/RentSlave/` to match the repository's Pages URL. Configure GitHub Pages to use GitHub Actions, then build with `npm ci` and `npm run build` and deploy the generated `dist/` directory as the Pages artifact.

Built with React, TypeScript, Vite, Tailwind CSS, and Recharts.
