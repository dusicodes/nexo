const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;

// Punctuation that usually ends the sentence around a URL rather than the URL.
const TRAILING_PUNCTUATION = /[.,;:!?'"\]]$/;

/** Drops trailing sentence punctuation, and a ")" that has no "(" in the URL. */
function trimUrl(candidate: string): string {
  let url = candidate;
  for (;;) {
    if (TRAILING_PUNCTUATION.test(url)) {
      url = url.slice(0, -1);
    } else if (url.endsWith(")") && count(url, "(") < count(url, ")")) {
      url = url.slice(0, -1);
    } else {
      return url;
    }
  }
}

function count(text: string, character: string): number {
  return text.split(character).length - 1;
}

/**
 * A Task's Details as plain text, exactly as typed, with bare http(s) URLs
 * made into links that open in a new tab. Nothing else is formatted.
 */
export function DetailsText({ details }: { details: string }) {
  const parts: React.ReactNode[] = [];
  let shownUpTo = 0;
  for (const match of details.matchAll(URL_PATTERN)) {
    const url = trimUrl(match[0]);
    // Trimming can leave no address at all ("https://." becomes "https://").
    if (!/^https?:\/\/./.test(url)) {
      continue;
    }
    parts.push(details.slice(shownUpTo, match.index));
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        {url}
      </a>,
    );
    shownUpTo = match.index + url.length;
  }
  parts.push(details.slice(shownUpTo));
  return <>{parts}</>;
}
