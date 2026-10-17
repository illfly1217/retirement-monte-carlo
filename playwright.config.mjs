import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',fullyParallel:false,workers:1,timeout:60000,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{baseURL:'http://127.0.0.1:4175/retirement-monte-carlo/',trace:'retain-on-failure'},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4175/retirement-monte-carlo/',env:{PORT:'4175',BASE_PATH:'/retirement-monte-carlo/'},reuseExistingServer:!process.env.CI},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'mobile-chromium',use:{...devices['Pixel 7']}}],
});
