import memoizeOne from 'memoize-one'

/**
 * parse html and get images
 * @param {string} html source code
 * @param {boolean | undefined} local true: only local, false: only remote, undefined: don't filter
 */
export const parseHtml = memoizeOne((html, filter) => {
  const dom = new window.DOMParser().parseFromString(html, 'text/html');
  const imgMap = {} // url => img nodes
  const cssMap = {} // url => nodes with background-image
  const allUrls = new Set()

  // parse all img tags
  const imgTags = dom.getElementsByTagName('img')
  for (const img of imgTags) {
    const url = img.getAttribute('src')
    if (filter(url)) { // only store remote images, exclude local ones
      allUrls.add(url)
      imgMap[url] = imgMap[url] || []
      imgMap[url].push(img)
    }
  }

  // parse all nodes with background-image
  const allNodes = dom.querySelectorAll('*', dom)
  for (const node of allNodes) {
    const backgroundImage = node.style.backgroundImage
    if (/^url\(\"/.test(backgroundImage)) {
      const url = backgroundImage.split('url("')[1].slice(0, -2)
      if (filter(url)) { // only store remote images, exclude local ones
        allUrls.add(url)
        cssMap[url] = cssMap[url] || []
        cssMap[url].push(node)
      }
    }
  }
  return {
    dom,
    img: imgMap,
    css: cssMap,
    urls: Array.from(allUrls)
  }
})
