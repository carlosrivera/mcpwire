## Try Firecrawl

Set `FIRECRAWL_API_KEY` in the host environment. This is the official server from Firecrawl; scraping credits bill to your account, so a teammate’s session spends real money — `firecrawl_credit_usage` shows the balance.

Ask the agent to scrape a page with `firecrawl_scrape` or search the web with `firecrawl_search`. Multi-page crawls, LLM extraction, agents, and monitors cost proportionally more, and `firecrawl_interact` drives a live browser — those all stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
