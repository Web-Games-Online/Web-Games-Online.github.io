import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createBareServer } from '@nebula-services/bare-server-node';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import basicAuth from 'express-basic-auth';
import mime from 'mime';
import fetch from 'node-fetch';
import config from './config.js';

// Configuration & Constants
const __dirname = process.cwd();
const server = http.createServer();
const app = express();
const bareServer = createBareServer('/fq/');
const PORT = process.env.PORT || 8080;
const CACHE_TTL = process.env.CACHE_TTL || 30 * 24 * 60 * 60 * 1000; // Default: 30 Days
const cache = new Map();

// Initialize the server
console.log(chalk.yellow("🚀 Starting server..."));

// Basic Authentication (if enabled)
if (config.challenge !== false) {
  console.log(chalk.green("🔒 Password protection is enabled! Listing logins below"));
  Object.entries(config.users).forEach(([username, password]) => {
    console.log(chalk.blue(`Username: ${username}, Password: ${password}`));
  });
  app.use(basicAuth({ users: config.users, challenge: true }));
}

// Middleware Setup
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'static')));
app.use('/fq', cors({ origin: true }));

// Route Handlers
const routes = [
  { path: '/yz', file: 'apps.html' },
  { path: '/up', file: 'games.html' },
  { path: '/play.html', file: 'games.html' },
  { path: '/vk', file: 'settings.html' },
  { path: '/rx', file: 'tabs.html' },
  { path: '/', file: 'index.html' },
];

routes.forEach(route => {
  app.get(route.path, (_req, res) => {
    res.sendFile(path.join(__dirname, 'static', route.file));
  });
});

// Fallback for 404
app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'static', '404.html'));
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'static', '500.html'));
});

// Caching and Asset Fetching
app.get('/e/*', async (req, res, next) => {
  try {
    if (cache.has(req.path)) {
      const { data, contentType, timestamp } = cache.get(req.path);
      if (Date.now() - timestamp > CACHE_TTL) {
        cache.delete(req.path);  // Expire cache after TTL
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        return res.end(data);  // Return cached data
      }
    }

    const baseUrls = {
      '/e/1/': 'https://raw.githubusercontent.com/qrs/x/fixy/',
      '/e/2/': 'https://raw.githubusercontent.com/3v1/V5-Assets/main/',
      '/e/3/': 'https://raw.githubusercontent.com/3v1/V5-Retro/master/',
    };

    let reqTarget;
    for (const [prefix, baseUrl] of Object.entries(baseUrls)) {
      if (req.path.startsWith(prefix)) {
        reqTarget = baseUrl + req.path.slice(prefix.length);
        break;
      }
    }

    if (!reqTarget) return next();  // No matching route, pass to next middleware

    const asset = await fetch(reqTarget);
    if (!asset.ok) return next();  // If fetch failed, pass to next middleware

    const data = Buffer.from(await asset.arrayBuffer());
    const ext = path.extname(reqTarget);
    const contentType = ext === '.unityweb' ? 'application/octet-stream' : mime.getType(ext);

    cache.set(req.path, { data, contentType, timestamp: Date.now() });  // Cache the fetched asset
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);

  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).send("Error fetching the asset");
  }
});

// Bare Server Handling
server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);  // Use Express for all other requests
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();  // Reject the connection if not handled by Bare Server
  }
});

// Server Listening
server.on('listening', () => {
  console.log(chalk.green(`🌍 Server is running on http://localhost:${PORT}`));
});

server.listen({ port: PORT });
