
import '@material/web/all.js'; // @todo minimize imports
import '@material/web/icon/icon';

import './mailing-lists';

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { msg } from '@lit/localize';
import { apiRoot, tokenContext } from './context';
import { SubscriptionStatus } from '../backend/subscription';
import { initializeLocale } from './localize';

const query = new URLSearchParams(window.location.search);
function getToken(): string | undefined {
  const token = query.get('token');
  if (token === null) {
    return undefined;
  } else {
    return token;
  }
}
@customElement('mailer-control-panel')
export class ControlPanel extends LitElement {

  @provide({context: tokenContext})
  token = getToken();

  async connectedCallback() {
    super.connectedCallback();
    await initializeLocale();
  }

  private fetchSubscriptionTask = new Task(this, {
    task: async ([token], {signal}) => {
      if (token === undefined) {
        throw new Error(msg('Missing authorization token'));
      }
      const response = await fetch(`${apiRoot}/subscription`, {
        headers: {Authorization: `Bearer ${token}`},
        signal
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      // @todo handle token refresh
      return await response.json() as SubscriptionStatus;
    },
    args: () => [this.token]
  });

  render() {
    return this.fetchSubscriptionTask.render({
      pending: () => html`<md-circular-progress four-color indeterminate></md-circular-progress>`,
      complete: (status) => {
        return html`<mailer-subscription-control .data=${status} ></mailer-subscription-control>`;
      },
      error: (error) => html`<md-suggestion-chip><md-icon slot="icon">error</md-icon>${String(error)}</md-suggestion-chip>`
    });
  }
}