
import '@material/web/all.js'; // @todo minimize imports
import './mailing-lists';
import './company';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { msg } from '@lit/localize';
import { apiRoot, tokenContext } from './context';
import { initializeLocale } from './localize';
import { SubscriptionChangeEvent } from './mailing-lists';
import type { SubscriptionStatus, UpdateSubscriptionRequest } from '../backend/subscription';
import type { Company } from './company';

function getToken(): string | undefined {
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token');
  if (token === null) {
    return undefined;
  } else {
    return token;
  }
}

@customElement('mailer-control-panel')
export class ControlPanel extends LitElement {

  @property({type: Boolean})
  public autosubscribe?: boolean = true;

  @provide({context: tokenContext})
  protected token = getToken();

  @state()
  protected company?: Company;

  @state()
  protected subscription?: SubscriptionStatus;

  public async connectedCallback() {
    super.connectedCallback();
    await initializeLocale();
  }

  protected get useMailingLists(): boolean {
    return this.subscription?.mailingLists !== undefined && this.subscription.mailingLists.length > 0;
  }

  // @todo update name?

  // @todo autosubscribe
  // https://lit.dev/docs/components/events/#adding-event-listeners-to-other-elements

  static styles = css`
    :host {
      font-family: var(--md-sys-typeface-plain);
      color: var(--md-sys-color-on-surface);
      background-color: var(--md-sys-color-surface);
    }
    .container {
      width: 20rem;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
  `;

  protected render() {
    return this.fetchSubscriptionTask.render({
      pending: () => html`<md-circular-progress four-color indeterminate></md-circular-progress>`,
      complete: ([company, subscription]) => {
        const updateStatus = this.updateSubscriptionTask.render({
          pending: () => html`<md-linear-progress indeterminate></md-linear-progress>`,
          complete: () => html``,
          error: (error) => html`<md-suggestion-chip><md-icon slot="icon">error</md-icon>${String(error)}</md-suggestion-chip>`
        });
        return html`
          <div class="container">  
            <mailer-company .company=${company}></mailer-company>
            ${this.renderSubscriptionStatus(company, subscription)}
            ${updateStatus}
          </div>`;
      },
      error: (error) => html`<md-suggestion-chip><md-icon slot="icon">error</md-icon>${String(error)}</md-suggestion-chip>`
    });
  }

  protected renderSubscriptionStatus(company: Company, subscription: SubscriptionStatus) {
    const subscribed = subscription.optInStatus === 'accepted';

    if (subscribed) {
      return html`
        <p><md-icon>check_circle</md-icon>${msg('Your subscription has been confirmed.')}<br/>
          ${msg('You may now close this window or update your subscription.')}</p>
        ${subscription.mailingLists?.length > 0
           ? html`<mailer-mailing-lists
           .mailingLists=${subscription.mailingLists}
           ?disabled=${!subscription.subscribed}
           @change=${this.onMailingListChange}></mailer-mailing-lists>` : html``}
        <md-outlined-button @click=${this.onUnsubscribe}>${msg('Unsubscribe')}<md-icon slot="icon">unsubscribe</md-icon></md-outlined-button>
      `;
    } else {
      return html`
        <md-suggestion-chip><md-icon slot="icon">unsubscribe</md-icon>${msg('You are unsubscribed from all mailing lists.')}</md-suggestion-chip>
        <md-filled-button @click=${this.onSubscribe}>${msg('Subscribe')}<md-icon slot="icon">mail</md-icon></md-filled-button>`;
    }
  }

  private fetchSubscriptionTask = new Task(this, {
    task: async ([token], {signal}) => {
      if (token === undefined) {
        throw new Error(msg('Missing authorization token'));
      }
      const [companyResponse, subscriptionResponse] = await Promise.all([
        fetch(`${apiRoot}/company`, {
          headers: {Authorization: `Bearer ${token}`},
          signal
        }), fetch(`${apiRoot}/subscription`, {
          headers: {Authorization: `Bearer ${token}`},
          signal
        })
      ]);
      if (!companyResponse.ok) {
        throw new Error(msg('Failed to fetch company information'));
      }
      if (!subscriptionResponse.ok) {
        // @todo handle token refresh
        throw new Error(msg('Failed to fetch subscription status'));
      }
      this.company = await companyResponse.json() as Company;

      this.subscription = await subscriptionResponse.json() as SubscriptionStatus;

      return [this.company, this.subscription];
    },
    args: () => [this.token]
  });
  
  private updateSubscriptionTask = new Task<[UpdateSubscriptionRequest], void>(this, {
    task: async ([update], {signal}) => {
      if (this.token === undefined) {
        throw new Error(msg('Missing authorization token'));
      }
      if (this.subscription === undefined)
        throw new Error(msg('Subscription not found'));
      
      const response = await fetch(`${apiRoot}/subscription`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(update),
        signal
      });
      if (!response.ok) {
        throw new Error(msg('Failed to update subscription'));
      }

      this.subscription.subscribed = update.subscribe;
      this.subscription.optInStatus = update.subscribe ? 'accepted' : 'rejected';
      if (update.mailingLists !== undefined) {
        Object.entries(update.mailingLists).forEach(([listId, subscribed]) => {
          this.subscription!.mailingLists.find((list) => list.id === listId)!.subscribed = subscribed;
        });
      }
      this.requestUpdate();
    },
    autoRun: false,
  });

  private onSubscribe() {
    this.updateSubscriptionTask.run([{
      email: this.subscription!.email,
      subscribe: true,
    }]);
  }

  private onUnsubscribe() {
    this.updateSubscriptionTask.run([{
      email: this.subscription!.email,
      subscribe: false,
    }]);
  }

  private onMailingListChange(e: SubscriptionChangeEvent) {
    this.updateSubscriptionTask.run([{
      email: this.subscription!.email,
      subscribe: true,
      mailingLists: {[e.mailingListId]: e.subscribe}
    }]);
  }
}