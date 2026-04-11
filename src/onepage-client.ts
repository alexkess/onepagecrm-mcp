/**
 * OnePage CRM API Client
 * Wraps the OnePage CRM REST API v3
 */

const BASE_URL = "https://app.onepagecrm.com/api/v3";

export interface OnePageConfig {
  userId: string;
  apiKey: string;
}

export class OnePageClient {
  private authHeader: string;

  constructor(config: OnePageConfig) {
    this.authHeader = `Basic ${Buffer.from(config.userId + ":" + config.apiKey).toString("base64")}`;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<unknown> {
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    };

    const resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OnePage CRM API ${resp.status}: ${text}`);
    }

    return resp.json();
  }

  // ── Actions ──
  async listActions(params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    return this.request("GET", `/actions.json${qs ? `?${qs}` : ""}`);
  }

  async updateAction(id: string, body: unknown): Promise<unknown> {
    return this.request("PUT", `/actions/${id}.json`, body);
  }

  async completeAction(id: string): Promise<unknown> {
    return this.request("PUT", `/actions/${id}.json`, { done: true });
  }

  async createAction(contactId: string, body: unknown): Promise<unknown> {
    return this.request("POST", `/contacts/${contactId}/next_actions.json`, body);
  }

  // ── Contacts ──
  async getContact(id: string): Promise<unknown> {
    return this.request("GET", `/contacts/${id}.json`);
  }

  async listContacts(params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    return this.request("GET", `/contacts.json${qs ? `?${qs}` : ""}`);
  }

  async createContact(body: unknown): Promise<unknown> {
    return this.request("POST", "/contacts.json", body);
  }

  async updateContact(id: string, body: unknown): Promise<unknown> {
    return this.request("PUT", `/contacts/${id}.json`, body);
  }

  // ── Notes ──
  async createNote(body: unknown): Promise<unknown> {
    return this.request("POST", "/notes.json", body);
  }

  async listNotes(contactId: string, params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    return this.request("GET", `/contacts/${contactId}/notes.json${qs ? `?${qs}` : ""}`);
  }

  // ── Deals ──
  async listDeals(params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    return this.request("GET", `/deals.json${qs ? `?${qs}` : ""}`);
  }

  async getDeal(id: string): Promise<unknown> {
    return this.request("GET", `/deals/${id}.json`);
  }

  async updateDeal(id: string, body: unknown): Promise<unknown> {
    return this.request("PUT", `/deals/${id}.json`, body);
  }

  // ── Pipelines ──
  async listPipelines(): Promise<unknown> {
    return this.request("GET", "/pipelines.json");
  }
}
