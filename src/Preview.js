import PropTypes from 'prop-types';
import React from 'react';
import { parseHtml } from './utils'
import memoizeOne from 'memoize-one'
import * as path from 'path'

const getParsedHtml = memoizeOne((value, getAsset) => {
  const filter = url => url.startsWith('/') && !url.startsWith('//')
  const { dom, urls, img, css } = parseHtml(value, filter)
  for (const url of urls) {
    const asset = getAsset(path.basename(url))
    const dataUrl = asset.url
    img[url]?.forEach(node => node.src = dataUrl)
    css[url]?.forEach(node => node.style.backgroundImage = `url('${dataUrl}')`)
  }
  return dom.body.innerHTML || value
})

const Preview = ({ value, getAsset }) => {
  return <div dangerouslySetInnerHTML={{ __html: getParsedHtml(value, getAsset) }} />
}

Preview.propTypes = {
  value: PropTypes.node,
}

export default Preview
