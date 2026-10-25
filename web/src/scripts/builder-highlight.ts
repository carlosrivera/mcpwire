import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import bash from 'shiki/langs/bash.mjs';
import json from 'shiki/langs/json.mjs';
import theme from 'shiki/themes/github-dark-dimmed.mjs';

// The same grammar and theme as Astro's Code blocks on the landing page.
const highlighter = createHighlighterCore({themes:[theme],langs:[bash,json],engine:createJavaScriptRegexEngine()});
export async function renderCode(element:HTMLElement, text:string, lang:'bash'|'json') {
  element.textContent = text;
  try {
    const instance = await highlighter;
    if (element.textContent !== text) return;
    const {tokens} = instance.codeToTokens(text,{lang,theme:'github-dark-dimmed'});
    const fragment = document.createDocumentFragment();
    tokens.forEach((line,index) => {
      if (index) fragment.append(document.createTextNode('\n'));
      line.forEach(token => {
        const span = document.createElement('span'); span.textContent = token.content;
        if (token.color) span.style.color = token.color;
        fragment.append(span);
      });
    });
    element.replaceChildren(fragment);
  } catch { /* Keep the readable plain-text command if highlighting is unavailable. */ }
}
