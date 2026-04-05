// delivers the frontend assets to the client based on the app they request
// the url segment determines the app, eg /users -> frontends/users/dist or /admin -> frontends/admin/dist
// this allows the user to add more frontend apps supported by a single api

import express, { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

class FrontendAssetsService {
  private frontendsDir = path.join(process.cwd(), 'frontends');

  /**
   * Returns an Express router that serves built frontend apps.
   * Each subdirectory of frontends/ containing a dist/ folder is served at /<dirname>/.
   * SPA fallback: any unmatched GET under /<dirname>/ returns that app's index.html.
   */
  middleware (): Router {
    const router = Router();
    const apps = this.discoverApps();

    if (apps.length === 0) {
      console.log('FrontendAssetsService: No built frontend apps found');
      return router;
    }

    console.log(`FrontendAssetsService: Serving apps — ${apps.join(', ')}`);

    for (const appName of apps) {
      const distPath = path.join(this.frontendsDir, appName, 'dist');

      // Serve static assets for this app
      router.use(`/${appName}`, express.static(distPath, { index: 'index.html' }));

      // SPA fallback — serve index.html for any unmatched route under this app
      router.get(new RegExp(`^/${appName}(/.*)?$`), (req: Request, res: Response, next: NextFunction) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
        next();
      });
    }

    return router;
  }

  private discoverApps (): string[] {
    if (!fs.existsSync(this.frontendsDir)) {
      return [];
    }

    return fs.readdirSync(this.frontendsDir).filter((entry) => {
      const entryPath = path.join(this.frontendsDir, entry);
      const distPath = path.join(entryPath, 'dist');
      try {
        return fs.statSync(entryPath).isDirectory() && fs.existsSync(distPath);
      } catch {
        return false;
      }
    });
  }
}

export default new FrontendAssetsService();