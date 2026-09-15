const ENDPOINT = 'https://graphql.anilist.co';
// Longest Retry-After we are willing to wait out before giving up on a rate-limited request
const MAX_RETRY_WAIT_SECONDS = 60;

class AniListError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AniListError';
    // HTTP status from AniList, or 0 if no response was received at all
    this.status = status;
  }
}

class AniListClient {
  constructor(endpoint = ENDPOINT) {
    this.endpoint = endpoint;
  }

  // Runs a GraphQL query and returns its `data`. Throws AniListError on any failure.
  // A rate-limited request (429) is retried once if AniList says how long to wait.
  async query(query, variables = {}) {
    let response = await this.#send(query, variables);

    if (response.status === 429) {
      const waitSeconds = Number(response.headers.get('retry-after'));
      if (waitSeconds > 0 && waitSeconds <= MAX_RETRY_WAIT_SECONDS) {
        console.warn(`AniList rate limit hit, retrying in ${waitSeconds}s`);
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        response = await this.#send(query, variables);
      }
    }

    return this.#parse(response);
  }

  async #send(query, variables) {
    try {
      return await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });
    } catch (error) {
      throw new AniListError(0, `Could not reach AniList: ${error.message}`);
    }
  }

  async #parse(response) {
    let body;
    try {
      body = await response.json();
    } catch {
      throw new AniListError(response.status, `AniList returned a non-JSON response (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const message = body.errors?.map((error) => error.message).join('; ') || `HTTP ${response.status}`;
      throw new AniListError(response.status, message);
    }
    return body.data;
  }
}

// Shared instance used by all queries
const anilist = new AniListClient();

module.exports = {
  AniListClient,
  AniListError,
  anilist,
};
