---
name: github-vibe-wechat
description: Turn a GitHub Vibe Coding project into a practical, image-led Chinese WeChat Official Account article and publishable HTML/ZIP bundle. Use when the user wants to introduce, announce, rewrite, or update an open-source GitHub product as a personal Vibe Coding post, especially when they want natural Chinese prose, concrete product features, real repository/product screenshots, and a simple Star call to action.
---

# GitHub Vibe Coding → WeChat

Write a product post, not a technical changelog and not an AI-generated "industry analysis." Use `wechat-silicon-editor` for the actual drafting, layout, preview, and package build.

## Position the project first

Read the repository before writing: README, current commit/branch, license, screenshots or running product, and the user’s latest framing. Verify any claim that may have changed. Do not call a repository open source, free, production-ready, or deployable unless its current repository and license support that claim.

Name the product in terms readers understand in one sentence: familiar reference + distinct capability + intended user. For example: “一个可白标、自部署的 AI 版 Coursera”，not “AI 学习平台.” Keep the comparable product as shorthand, not a claim of affiliation.

## Write the article

Use a continuing but unnumbered title pattern:

`Vibe Coding｜[我做了什么 / 解决什么具体问题]`

Do not use `#01`, `#02`, or wording that makes one project feel like a one-off. Keep the title short, conversational, and specific.

Use this shape unless the source material demands another:

1. Open with what was made and why it matters, in two or three plain paragraphs.
2. Explain what it is in a concrete analogy, then state the project’s differentiator.
3. Walk through the few functions that let a reader understand how it is used. For each: what it does → who uses it → why it matters. Prefer workflows over feature inventories.
4. Explain the practical handoff: who can take it, customize it, or deploy it.
5. End with only a repository link and a friendly request to Star. Do not add roadmaps, test counts, architecture tours, or generic conclusions unless the user explicitly asks.

Write like a known independent Vibe Coding creator: first-person, relaxed, direct, mildly opinionated, varied sentence lengths. Avoid startup-deck words, empty superlatives, symmetrical lists, “not only… but also…”, and sentences that merely announce a section.

## Use evidence-led images

Add images that answer a reader question, in reading order:

- a GitHub repository screenshot near the opening;
- product home/product-positioning screenshot;
- one screenshot for each important user workflow;
- optionally an admin or customization screenshot when it proves the differentiator.

Use actual repository, product, or official source screenshots. Do not generate decorative AI images, fake dashboards, or visual filler. Capture the latest state after the repository is re-read. Name local images sequentially `01_`, `02_`, and add a short numbered caption and source to each.

## Deliver

Build with `wechat-silicon-editor` using strict editorial checks. Verify that the title, referenced image paths, claims about licensing, and current branding are consistent with the latest repository. Deliver the Markdown source, HTML preview, image folder, and ZIP package. Tell the user to open the HTML and use the copy button before pasting into WeChat.
