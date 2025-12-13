const fs = require('fs');
if (process.env.CAPTCHA_PROVIDER==='recaptcha') {
  if (!process.env.RECAPTCHA_SITE_KEY) {
    throw new Error('Missing RECAPTCHA_SITE_KEY configuration');
  }
  fs.mkdirSync('frontend/api', {recursive: true});
  fs.writeFileSync('frontend/api/recaptcha',
    JSON.stringify({success: true, recaptcha_site_key: process.env.RECAPTCHA_SITE_KEY}));
  console.log('generated: frontend/api/recaptcha');
}