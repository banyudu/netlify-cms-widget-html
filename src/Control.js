import PropTypes from "prop-types";
import React from "react";
import axios from 'axios'
import { Base64 } from 'js-base64';
import extName from 'ext-name'
import debounce from 'debounce'
import { parseHtml } from './utils'
import { readAsDataURL } from 'promise-file-reader';
// import { Buffer } from 'buffer'

/**
 * shorten string to max length of len
 * @param {string} str
 * @param {number} len
 * @returns string
 */
const compress = (str, len) => {
  if (str.length <= len || len <= 0) {
    return str
  }
  const factor = str.length / len
  const arr = []
  for (let i = 0; i < str.length; i++) {
    if ( (i + 1) / (arr.length + 1) >= factor) {
      arr.push(str[i])
    }
  }
  return arr.join('')
}

/**
 * generate a unique filename by url and content
 * @param {string} url full url
 * @param {string} content base64 content
 */
const generateFilename = (url, content, suffix) => {
  return (compress(url, 80) + '_' + Base64.encodeURI(compress(content, 10)) + suffix).toLowerCase()
}

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
    // url => { localUrl: string, success: boolean, promise: Promise }
    images: {}, // images pendnig to download and store
  }

  async componentDidMount () {
    if (this.shouldStoreImages()) {
      this.storeImages()
    }
  }

  remoteImageFilter = url => url.startsWith('http') || url.startsWith('//')

  shouldStoreImages = () => {
    const { field } = this.props;
    const shouldStoreImages = !!field.get('storeImages', false);
    return shouldStoreImages
  }

  flush = debounce(() => {
    const { value } = this.props;
    const { images } = this.state
    const { dom, urls, img, css } = parseHtml(value, this.remoteImageFilter)
    for (const url of urls) {
      if (images[url]?.success) {
        const { localFilename } = images[url]
        const newUrl = localFilename
        img[url]?.forEach(node => node.src = newUrl)
        css[url]?.forEach(node => node.style.backgroundImage = `url('${newUrl}')`)
      }
    }
    const newValue = dom.body.innerHTML
    if (newValue) {
      this.save(newValue)
    }
  }, 200)

  storeOneImage = async (url) => {
    const { onAddAsset, config, onPersistMedia } = this.props
    console.log('onPersistMedia is: ', onPersistMedia)
    let res
    try {
      res = await axios.get(url, {
        responseType: 'blob'
        // responseType: 'arraybuffer'
      })
    } catch (error) {
      console.error(error)
      return
    }
    const mimeType = res.headers['content-type']
    const ext = extName.mime(mimeType)?.[0]?.ext || 'raw'
    console.log('config is: ', config)
    const public_folder = config.public_folder || config.get('public_folder') // => /assets
    // const localFilename = Base64.encodeURI(url) + `.${ext}`
    const blob = new Blob([res.data])
    const base64File = await readAsDataURL(blob)
    const localFilename = generateFilename(Base64.encodeURI(url), base64File, `.${ext}`)
    const imageFile = new File([blob], localFilename, { type: mimeType })
    onPersistMedia?.(imageFile)
    const publicPath = `${public_folder}/${localFilename}`

    this.setState(state => {
      const { images } = state
      images[url] = images[url] || {}
      images[url].success = true
      // images[url].localFilename = base64File
      images[url].localFilename = publicPath
      return { images }
    })
  }

  storeImages = debounce(async () => {
    const { value } = this.props;
    const { images } = this.state
    const { urls } = parseHtml(value, this.remoteImageFilter)
    const jobs = []
    for (const url of urls) {
      if (!images[url]?.promise) {
        images[url] = {
          promise: this.storeOneImage(url)
        }
        jobs.push(images[url].promise)
      }
    }
    this.setState({ images })

    // wait for all promises
    await Promise.all(jobs)
    this.flush()
  }, 200)

  isValid = () => {
    if (!this.shouldStoreImages()) {
      return true
    }
    const { value } = this.props;
    const { images } = this.state
    // if need store images, validate if there's external images in html or styles
    const { urls } = parseHtml(value, this.remoteImageFilter)
    const pendingUrls = urls.filter(url => !images[url]?.success)
    return pendingUrls.length ? {
      error: {
        type: 'pending third party images',
        message: 'Storing images to local repository, try again later!'
      }
    } : true;
  };

  handleChange = (value) => {
    this.save(value)
    this.storeImages()
  }

  save = (newValue) => {
    const { onChange } = this.props
    onChange(newValue)
  }

  render() {
    const { forID, value, classNameWrapper } = this.props;

    return (
      <textarea
        rows={20}
        id={forID}
        className={classNameWrapper}
        value={value || ""}
        onChange={(e) => this.handleChange(e.target.value)}
        data-gramm_editor="false"
      />
    );
  }
}
