import SimpleMarkdown, {
  type Capture,
  type MatchFunction,
  type ParserRules,
} from '@khanacademy/simple-markdown'
import { rules } from 'discord-markdown-parser'

// Creates a match function for an inline scoped element from a regex
const inlineRegex = (regex: RegExp) => {
  const match: MatchFunction = (source, state) => {
    if (state.inline) {
      return regex.exec(source)
    } else {
      return null
    }
  }
  match.regex = regex
  return match
}

const DOCS_REDIRECTS: Record<string, string> = {
  'create-project': 'https://docs.nordcraft.com/get-started/create-a-project',
  'edit-project': 'https://docs.nordcraft.com/get-started/project-details',
  'preview-and-publishing':
    'https://docs.nordcraft.com/get-started/branches-and-publishing',
  'publish-application':
    'https://docs.nordcraft.com/get-started/branches-and-publishing',
  'the-editor': 'https://docs.nordcraft.com/the-editor/overview',
  'the-canvas': 'https://docs.nordcraft.com/the-editor/canvas',
  'the-element-tree': 'https://docs.nordcraft.com/the-editor/element-tree',
  'the-element-panel': 'https://docs.nordcraft.com/the-editor/element-panel',
  'the-bottom-bar': 'https://docs.nordcraft.com/the-editor/bottom-bar',
  'the-data-panel': 'https://docs.nordcraft.com/the-editor/data-panel',
  'the-project-sidebar':
    'https://docs.nordcraft.com/the-editor/project-sidebar',
  'working-with-elements':
    'https://docs.nordcraft.com/building-blocks/elements',
  'html-elements':
    'https://docs.nordcraft.com/building-blocks/elements#html-elements',
  'text-elements':
    'https://docs.nordcraft.com/building-blocks/elements#text-elements',
  'component-elements':
    'https://docs.nordcraft.com/building-blocks/elements#components',
  'custom-actions': 'https://docs.nordcraft.com/actions/overview',
  'custom-code-api': 'https://docs.nordcraft.com/actions/working-with-actions',
  'export-component':
    'https://docs.nordcraft.com/components/export-a-component',
  slots: 'https://docs.nordcraft.com/components/compositions#slots',
  'working-with-components': 'https://docs.nordcraft.com/components/overview',
  attributes: 'https://docs.nordcraft.com/the-editor/data-panel#attributes',
  events: 'https://docs.nordcraft.com/the-editor/data-panel#events',
  'formula-editor': 'https://docs.nordcraft.com/formulas/overview',
  workflows: 'https://docs.nordcraft.com/workflows/overview',
  variables: 'https://docs.nordcraft.com/variables/overview',
  'working-with-apis':
    'https://docs.nordcraft.com/connecting-data/working-with-apis',
  'advanced-api-configuration':
    'https://docs.nordcraft.com/connecting-data/advanced-api-features',
  'styling-your-toddle-app':
    'https://docs.nordcraft.com/styling/styles-and-layout',
  'conditional-styles': 'https://docs.nordcraft.com/styling/conditional-styles',
  'the-css-editor':
    'https://docs.nordcraft.com/styling/styles-and-layout#adding-css-with-the-style-panel',
  'creating-a-new-page': 'https://docs.nordcraft.com/pages/create-a-page',
  'dynamic-pages': 'https://docs.nordcraft.com/pages/static-and-dynamic',
  'adding-scripts-and-links-to-the-page-head':
    'https://docs.nordcraft.com/pages/page-configuration#head-assets',
  supabase: 'https://docs.nordcraft.com/connecting-data/services#supabase',
  xano: 'https://docs.nordcraft.com/connecting-data/services#xano',
  branches: 'https://docs.nordcraft.com/get-started/branches-and-publishing',
  context: 'https://docs.nordcraft.com/contexts/overview',
  airtable: 'https://docs.nordcraft.com/connecting-data/overview',
  'install-packages': 'https://docs.nordcraft.com/packages/overview',
  'creating-packages':
    'https://docs.nordcraft.com/packages/creating-and-launching',
  'repeat-formulas': 'https://docs.nordcraft.com/formulas/repeat-formula',
  'show-hide-formula': 'https://docs.nordcraft.com/formulas/show-hide-formula',
  'custom-domains':
    'https://docs.nordcraft.com/get-started/project-details#settings',
  'first-week-in-toddle':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  'day-1-lets-build-a-weather-app':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  'day-2-itunes-search-tool':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  'day-3-todo-app-with-an-external-backend':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  'day-4-ace-hit-me-21-blackjack':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  'day-5-showcase-data-in-a-dashboard':
    'https://nordcraft.com/academy/the-first-week-in-toddle',
  flexbox:
    'https://docs.nordcraft.com/styling/styles-and-layout#flexbox-layout',
  'default-styles': 'https://docs.nordcraft.com/styling/default-styles',
  'project-wide-settings':
    'https://docs.nordcraft.com/get-started/project-details#settings',
  'Advanced API features':
    'https://docs.nordcraft.com/connecting-data/advanced-api-features',
  'call-apis': 'https://docs.nordcraft.com/connecting-data/call-an-api',
  'fetch-data-from-an-api':
    'https://docs.nordcraft.com/connecting-data/working-with-apis',
  Authentication: 'https://docs.nordcraft.com/connecting-data/authentication',
  'api-services': 'https://docs.nordcraft.com/connecting-data/services',
  Streaming: 'https://docs.nordcraft.com/connecting-data/streaming',
}

const parserRules: ParserRules = {
  ...rules,
  // eslint-disable-next-line inclusive-language/use-inclusive-words
  // See https://github.com/ariabuckles/simple-markdown/blob/master/simple-markdown.js#L1489
  url: {
    order: SimpleMarkdown.defaultRules.url.order,
    match: inlineRegex(/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/),
    parse: (capture: Capture) => {
      let url = capture[1]
      try {
        const parsedUrl = new URL(url)
        if (parsedUrl.hostname === 'toddle.dev') {
          const pathParts = parsedUrl.pathname
            .split('/')
            .slice(1)
            .filter((p) => p !== '')
          if (pathParts[0] === 'docs') {
            // Handle docs redirects
            url =
              DOCS_REDIRECTS[parsedUrl.pathname.slice(1)] ??
              'https://docs.nordcraft.com'
          } else if (pathParts[0] === 'projects') {
            if (pathParts.length > 2) {
              url = `https://editor.nordcraft.com${parsedUrl.pathname}${parsedUrl.search}`
            } else {
              url = `https://app.nordcraft.com${parsedUrl.pathname}${parsedUrl.search}`
            }
          } else if (pathParts[0] === 'blog') {
            // Handle blog redirects
            url = `https://blog.nordcraft.com/${pathParts[1] ?? ''}`
          } else if (pathParts[0] === 'pricing') {
            url = 'https://nordcraft.com/pricing'
          } else {
            url = `https://nordcraft.com${parsedUrl.pathname}${parsedUrl.search}`
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Error parsing URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          url,
        )
      }
      return {
        content: [
          {
            type: 'text',
            content: url,
          },
        ],
        target: url,
      }
    },
  },
}

const parser = SimpleMarkdown.parserFor(parserRules)

export const parseDiscordMessage = (message: string) => {
  return parser(message, { inline: true })
}
