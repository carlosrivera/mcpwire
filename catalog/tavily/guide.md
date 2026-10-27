## Try Tavily

Set `TAVILY_API_KEY` in the host environment. This is Tavily’s official server, and usage meters to your plan.

Ask the agent to search with `tavily_search` and pull clean page content with `tavily_extract`. `tavily_crawl` and the multi-step `tavily_research` consume much more quota, so both stay outside the default allowlist.

The generated command above contains the catalog’s explicit default allowlist. Check the guest’s tool list before making calls and use the server’s argument schema for required fields. See [the CLI guide](/docs/#connect) for guest configuration and [session controls](/docs/#controls) for approvals, redaction, and expiry.
