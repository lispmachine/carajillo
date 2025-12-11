# Netlify reCAPTCHA Validator

A TypeScript serverless function for validating reCAPTCHA tokens on Netlify.

## Features

- ✅ TypeScript support
- ✅ Serverless function for reCAPTCHA v2/v3 validation
- ✅ CORS enabled
- ✅ Error handling
- ✅ Environment variable configuration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure reCAPTCHA Secret Key

Set your reCAPTCHA secret key as an environment variable in Netlify:

**Via Netlify Dashboard:**
1. Go to your site's settings
2. Navigate to "Environment variables"
3. Add `RECAPTCHA_SECRET_KEY` with your secret key value

**Via Netlify CLI:**
```bash
netlify env:set RECAPTCHA_SECRET_KEY "your-secret-key-here"
```

**For Local Development:**
Create a `.env` file in the root directory:
```
RECAPTCHA_SECRET_KEY=your-secret-key-here
```

### 3. Build

```bash
npm run build
```

### 4. Deploy

```bash
netlify deploy --prod
```

Or use the Netlify CLI to deploy:
```bash
netlify deploy
```

## Local Development

Run the Netlify development server:

```bash
npm run dev
```

The function will be available at: `http://localhost:8888/.netlify/functions/validate-recaptcha`

## Usage

### Endpoint

`POST /.netlify/functions/validate-recaptcha`

### Request Body

```json
{
  "token": "reCAPTCHA-response-token-from-client"
}
```

### Success Response

```json
{
  "success": true,
  "message": "reCAPTCHA validation successful",
  "challenge_ts": "2024-01-01T12:00:00Z",
  "hostname": "example.com"
}
```

### Error Response

```json
{
  "success": false,
  "error": "reCAPTCHA validation failed",
  "error-codes": ["invalid-input-response"]
}
```

### Example Client-Side Usage

```javascript
// Get the reCAPTCHA token from the client
grecaptcha.ready(function() {
  grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'}).then(function(token) {
    // Send token to your Netlify function
    fetch('/.netlify/functions/validate-recaptcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: token })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('reCAPTCHA validated successfully!');
        // Proceed with form submission
      } else {
        console.error('reCAPTCHA validation failed:', data['error-codes']);
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
});
```

## API Reference

### Error Codes

Common reCAPTCHA error codes:
- `missing-input-secret`: The secret parameter is missing
- `invalid-input-secret`: The secret parameter is invalid or malformed
- `missing-input-response`: The response parameter is missing
- `invalid-input-response`: The response parameter is invalid or malformed
- `bad-request`: The request is invalid or malformed
- `timeout-or-duplicate`: The response is no longer valid (either too old or has been used previously)

## Project Structure

```
.
├── src/
│   └── validate-recaptcha.ts    # Serverless function source
├── netlify/
│   └── functions/                # Compiled functions (generated)
├── netlify.toml                  # Netlify configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## License

MIT

