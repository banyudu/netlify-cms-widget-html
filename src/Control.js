import PropTypes from "prop-types";
import React from "react";
import axios from 'axios'
import { Base64 } from 'js-base64';
import extName from 'ext-name'
import debounce from 'debounce'
// import { createAssetProxy } from 'netlify-cms-core/dist/esm/valueObjects/AssetProxy'
import { parseHtml, imageCache } from './utils'
import { readAsDataURL } from 'promise-file-reader';
// import { Buffer } from 'buffer'

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
    const { onAddAsset, config } = this.props
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
    // const public_folder = config.get('public_folder') // => /assets
    const localFilename = Base64.encodeURI(url) + `.${ext}`
    const imageFile = new File([new Blob([res.data])], localFilename, { type: mimeType })
    // onAddAsset(createAssetProxy({file: imageFile, path: localFilename }))
    // const publicPath = `${public_folder}/${localFilename}`
    const base64File = await readAsDataURL(imageFile)
    // imageCache[publicPath] = base64File

    this.setState(state => {
      const { images } = state
      images[url] = images[url] || {}
      images[url].success = true
      images[url].localFilename = base64File
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
    // error 的格式是 { type: 'string', message: 'string' }
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
