import PropTypes from "prop-types";
import React from "react";
import axios from 'axios'
import memoizeOne from 'memoize-one'

const parseHtml = memoizeOne(html => {
  const dom = new window.DOMParser().parseFromString(html, 'text/html');
  const imgMap = {} // url => img nodes
  const cssMap = {} // url => nodes with background-image
  const allUrls = new Set()

  // parse all img tags
  const imgTags = dom.getElementsByTagName('img')
  for (const img of imgTags) {
    allUrls.add(img.src)
    imgMap[img.src] = imgMap[img.src] || []
    imgMap[img.src].push(img)
  }

  // parse all nodes with background-image
  const allNodes = dom.querySelectorAll('*', dom)
  for (const node of allNodes) {
    const backgroundImage = node.style.backgroundImage
    if (/^url\(\"/.test(backgroundImage)) {
      const url = backgroundImage.split('url("')[1].slice(0, -2)
      allUrls.add(url)
      cssMap[url] = cssMap[url] || []
      cssMap[url].push(node)
    }
  }
  return {
    img: imgMap,
    css: cssMap,
    urls: Array.from(allUrls)
  }
})

export default class Control extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
  };

  static defaultProps = {
    value: "",
  };

  state = {
    // url => { localUrl: string, success: boolean }
    images: {} // images pendnig to download and store
  }

  isValid = () => {
    const { field, value } = this.props;
    const { images } = this.state
    const shouldStoreImages = !!field.get('storeImages', false);
    if (!shouldStoreImages) {
      return true
    }
    // if need store images, validate if there's external images in html or styles
    // error 的格式是 { type: 'string', message: 'string' }
    const { img, css, urls } = parseHtml(value)
    const pendingUrls = urls.filter(url => !images[url]?.success)
    console.warn('pending urls: ', pendingUrls)
    return pendingUrls.length ? {
      error: {
        type: 'pending third party images',
        message: 'Storing images to local repository, try again later!'
      }
    } : true;
  };

  render() {
    const { forID, value, onChange, classNameWrapper } = this.props;

    return (
      <textarea
        rows={20}
        id={forID}
        className={classNameWrapper}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
}
