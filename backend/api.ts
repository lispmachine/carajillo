
import express, { Router } from "express";
import { middleware as errorMiddleware } from "./error";

import { subscribe, SubscribeRequest } from "./subscribe";
import { getMailingLists } from "./loops";
import { configuration as captchaConfiguration } from "./recaptcha";

export const app = express();

// There is no need for ETag.
// API responses are non cacheable.
// Also there is no risk of "mir-air collision".
// @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/ETag
app.set('etag', false);

// Do not expose the tech stack
app.set('x-powered-by', false);

// Netlify serves as proxy for the express app
// @see https://expressjs.com/en/guide/behind-proxies.html
// @todo loopback only?
app.set('trust proxy', true);

const router = Router();

router.get("/subscribe", async (req, res) => {
  const response = await getMailingLists();
  res.json(response);
});
router.post("/subscribe", async (req, res) => {
  const response = await subscribe(req.body as SubscribeRequest);
  res.json(response);
});
router.put("/subscribe", async (req, res) => {

});

router.get("/captcha", async (req, res) => {
  res.json({success: true, ...captchaConfiguration(), generated: true});
});

router.get("/test", async (req, res) => {
  res.json({
    hostname: req.hostname,
    url: req.originalUrl,
    ip: req.ip,
    ips: req.ips,
  });
});

// @todo set headers Cache-Control...
// @todo use cors https://expressjs.com/en/resources/middleware/cors.html
app.use("/api/", express.json(), router, errorMiddleware);