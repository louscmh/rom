const { malClientId } = require('../../config.json');

const BASE_URL = 'https://api.myanimelist.net/v2/';

class MalError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'MalError';
    // HTTP status from MyAnimeList, or 0 if no response was received at all
    this.status = status;
  }
}

// Read-only client for public MyAnimeList data. Authenticates with the app's client ID,
// so no user login is needed, but private lists can't be read.
class MalClient {
  constructor(clientId, baseUrl = BASE_URL) {
    this.clientId = clientId;
    this.baseUrl = baseUrl;
  }

  get isConfigured() {
    return Boolean(this.clientId);
  }

  // GETs a path relative to the API root (e.g. 'users/x/animelist'), or an absolute URL such as
  // a `paging.next` link. Returns the parsed JSON body. Throws MalError on any failure.
  async get(pathOrUrl, params = {}) {
    if (!this.isConfigured) {
      throw new MalError(0, 'MyAnimeList client ID is not configured (malClientId in config.json)');
    }

    const url = new URL(pathOrUrl, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    let response;
    try {
      response = await fetch(url, {
        headers: {
          'X-MAL-CLIENT-ID': this.clientId,
          'Accept': 'application/json',
        },
      });
    } catch (error) {
      throw new MalError(0, `Could not reach MyAnimeList: ${error.message}`);
    }

    let body;
    try {
      body = await response.json();
    } catch {
      throw new MalError(response.status, `MyAnimeList returned a non-JSON response (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const message = body.error ? `${body.error}${body.message ? `: ${body.message}` : ''}` : `HTTP ${response.status}`;
      throw new MalError(response.status, message);
    }
    return body;
  }
}

// Shared instance used by all queries
const mal = new MalClient(malClientId);

module.exports = {
  MalClient,
  MalError,
  mal,
};
