import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export function renderMarkdown(source: string): string {
  const raw = md.render(source)
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'em', 'strong', 'del', 'a', 'img',
      'input',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'checked', 'type'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(https?|mailto):/i,
  })
}
