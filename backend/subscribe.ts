import { HttpError } from './error';
import { verifyCaptcha } from './recaptcha';
import { upsertContact, sendConfirmationMail } from './loops';
import { createToken } from './jwt';

const rootUrl = process.env.URL;

export interface SubscribeRequest {
  email : string;
  language?: string;
  captcha_token: string;
  mailing_lists: string[];
};

export async function subscribe(request: SubscribeRequest) {
  if (typeof request.email !== "string")
    throw new HttpError({statusCode: 400, message: "Missing email"});
  /// @todo make captcha_token optional
  if (typeof request.captcha_token !== "string")
    throw new HttpError({statusCode: 400, message: "Missing CAPTCHA token"});

  if (request.mailing_lists === undefined) {
    request.mailing_lists = [];
  }
  if (!Array.isArray(request.mailing_lists)) {
    throw new HttpError({statusCode: 400, message: "Malformed request"});
  }
  if (!request.mailing_lists.every((id) => typeof id === 'string')) {
    throw new HttpError({statusCode: 400, message: "Malformed request"});
  }

  const {email, mailing_lists, captcha_token, ...properties} = request;

  const valid = verifyCaptcha('subscribe', captcha_token);
  if (!valid) {
    throw new HttpError({
      statusCode: 429,
      message: 'Try again later',
      details: 'Requestor categorized as bot'
    });
  }

  const contact = await upsertContact(email, properties, mailing_lists);
  if (contact.subscribed) {
    console.info(`contact already subscribed: ${contact.email}`);
    if (mailing_lists.every((requestedMailingList) => contact.mailingLists[requestedMailingList]))
    {
      console.info('already subscribed for all requested mailing lists - do not send e-mail');
      return {success: true, contact};
    }
  }

  const token = createToken(contact.email);
  await sendConfirmationMail(contact.email, `${rootUrl}/subscribe?token=${token}`, properties.language);
  return {success: true};
}