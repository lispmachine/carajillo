let recaptchaSiteKey: string | null = null;

export async function main() {
  await domReady();
  try {
    recaptchaSiteKey = await getCaptchaSiteKey();
    await loadCaptcha(recaptchaSiteKey);
    await subscribe();
  } catch (error) {
    document.querySelectorAll<HTMLFormElement>(".subscribe-form").forEach((form) => {
      const status = form.querySelector<HTMLElement>(".subscribe-status");
      if (status) {
        let message = "🙈 Something went wrong.";
        if (error instanceof Error) {
          message = `🙈 ${error.message}`;
        }
        status.innerText = message;
      }
    });
  }
}

function domReady() {
  return new Promise((resolve) => {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", () => { resolve(document); })
    else
      resolve(document);
  });
}

async function subscribe() {
  document.querySelectorAll<HTMLFormElement>(".subscribe-form").forEach(function(form) {
    //if (new URL(form.action).hostname === "app.loops.so") 
      loopsSubscribeForm(form);
  });
}

async function getCaptchaSiteKey(): Promise<string> {
  // @todo cross site request
  const response = await fetch('/api/recaptcha', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  });
  if (response.ok) {
    const data : {success: boolean; recaptcha_site_key: string} = await response.json();
    if (typeof data.recaptcha_site_key !== 'string')
      throw new Error("Cannot retrieve reCAPTCHA site key");
    return data.recaptcha_site_key;
  } else {
    throw new Error("Cannot retrieve reCAPTCHA site key");
  }
}

function loadCaptcha(siteKey: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
  });
}

function getCaptchaToken(action: string) {
  return new Promise((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(recaptchaSiteKey, {action}).then(resolve);
    });
  });
}

function loopsSubscribeForm(form: HTMLFormElement) {
  const status = form.querySelector<HTMLElement>(".subscribe-status");
  form.addEventListener("submit", async function(event) {
    event.preventDefault();
    form.dataset.status = "in-progress";
    if (status) {
      status.innerHTML = "<progress/>";
    }


    const {success, message, email} = await loopsSubscribe(form);
    if (success) {
      form.dataset.status = "successful";
      if (status) {
        const confirmationLink = document.createElement("a");
        confirmationLink.href = confirmLink(email);
        confirmationLink.target = "_blank";
        confirmationLink.innerText = message;
        status.replaceChildren(confirmationLink);

      }
    } else {
      form.dataset.status = "failed";
      if (status)
        status.innerText = message;
    }
  });
}

function formDataObject(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

// https://loops.so/docs/forms/custom-form
async function loopsSubscribe(form: HTMLFormElement) {
  const messages = {
    success: form.dataset.i18nSuccess || "Subscription successful. Check your email for confirmation.",
    tryLater: form.dataset.i18nTryLater || "Too many signups, please try again in a little while.",
    failed: form.dataset.i18nFailed || "Subscription failed: {message}",
  };

  const data = formDataObject(form);
  data.captcha_token = await getCaptchaToken('subscribe');

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: JSON.stringify(data),
      //body: new URLSearchParams(new FormData(form)),
      headers: {
        //"Content-Type": "application/x-www-form-urlencoded",
        "Content-Type": "application/json",
        "Accept": "application/json",
      }
    });
    if (response.status == 429) {
      return {success: false, message: `⏳ ${messages.tryLater}`};
    }
    const result = await response.json();
    if (result.success) {
      return {success: true, message: `📨 ${messages.success}`, email: data.email};
    } else {
      return {success: false, message: `❌ ${messages.failed.replace("{message}", result.error)}`};
    }
  } catch(error) {
    return {success: false, message: `❌ ${messages.failed.replace("{message}", error.message)}`};
  }
}

function confirmLink(email) {
  const domain = email.replace(/.*@/, "");
  return `https://${domain}/`;
}
