import PropTypes from 'prop-types';
import React from 'react';
import DOMPurify from "dompurify";
import { parseHtml, imageCache } from './utils'
import memoizeOne from 'memoize-one'

const getParsedHtml = memoizeOne((value) => {
  const filter = url => url.startsWith('/') && !url.startsWith('//')
  const { dom, urls, img, css } = parseHtml(value, filter)
  for (const url of urls) {
    if (imageCache[url]) {
      const dataUrl = imageCache[url]
      img[url]?.forEach(node => node.src = dataUrl)
      css[url]?.forEach(node => node.style.backgroundImage = `url('${dataUrl}')`)
    }
  }
  return DOMPurify.sanitize(dom.body.innerHTML || value)
})

const Preview = ({ value }) => {
  return <div dangerouslySetInnerHTML={{ __html: getParsedHtml(value) }} />
}

Preview.propTypes = {
  value: PropTypes.node,
}

export default Preview
