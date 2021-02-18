import Control from './Control'
import Preview from './Preview'

if (typeof window !== 'undefined') {
  window.HtmlControl = Control
  window.HtmlPreview = Preview
}

export { Control as HtmlControl, Preview as HtmlPreview }
