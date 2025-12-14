import { netlify } from "../../backend/netlify";
import { subscribe } from "../../backend/subscribe";
import { getMailingLists } from "../../backend/loops";

export const handler = netlify({
  GET: getMailingLists,
  POST: subscribe,
  // PUT: update 
});