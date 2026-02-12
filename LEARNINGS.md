# AI Credit News — Learnings

> **What belongs here**: Insights from building this product that would apply to building *other* products. Not bug fixes, not feature decisions, not implementation details — those belong in git history. A learning is a pattern, a mistake that reveals a principle, or a decision that clarifies how products should be built.
>
> **What doesn't belong here**: Anything specific to AI Credit News that has no relevance outside this product (e.g., "Finextra RSS feeds are short"). If it only matters here, it's not a learning.
>
> **How entries are added**: The AI assistant working on this project should propose a new entry when a product decision reveals a transferable insight. The entry is appended at the end of the log with status `[proposed]`. The founder reviews and changes it to `[accepted]` or deletes it.
>
> **Format**: Date, one-line title, short explanation of the insight and what triggered it.

---

## Log

### 1. Define what role AI plays in your product before building AI features
**Date**: 2025-02-12
**Status**: [proposed]

AI Credit News is a curation product — it finds, filters, and organizes other people's articles. An AI content expansion feature was built that rewrote short scraped articles into full-length pieces. This fundamentally broke the product's identity: it turned a curator into a ghost-writer. The fix was reverting to the product's definition and rejecting short content instead of fabricating longer content. The role of AI in this product is filtering and organizing, not authoring.

**Trigger**: Built `expandShortContent()`, then realized it violated the product's definition when the founder asked "what is an article in this product?"

### 2. Know your product's definition before solving a quality problem
**Date**: 2025-02-12
**Status**: [proposed]

When articles appeared too short, the instinct was to fix the content (expand it with AI). The right move was to go back to the product definition first. The spec says: news aggregation platform, curated content, link to original. Under that definition, "short article" isn't a content-quality problem — it's a curation-quality problem. The product should reject content that doesn't meet the bar, not manufacture content that does.

**Trigger**: Founder asked "give me the product's definition of article" before accepting any fix.

### 3. A content threshold saves both quality and cost
**Date**: 2025-02-12
**Status**: [proposed]

Adding a minimum content length check (500 chars) before AI processing serves two purposes: it prevents low-quality snippets from being published, and it skips the AI API call entirely for content that would never be good enough. Quality gate and cost optimization in one check.

**Trigger**: Implementing the short-article rejection as a pre-AI filter rather than a post-AI filter.
