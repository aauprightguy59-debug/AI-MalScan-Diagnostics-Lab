import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aimalscan.app',
  appName: 'AI-MalScan Diagnostics',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
