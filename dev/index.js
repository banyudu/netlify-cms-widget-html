import './bootstrap.js'
import CMS, { init } from 'netlify-cms'
import 'netlify-cms/dist/cms.css'
import { HtmlControl, HtmlPreview } from '../src'

const config = {
backend: {
 name: 'test-repo',
 login: false,
},
media_folder: 'assets',
collections: [{
 name: 'test',
 label: 'Test',
 files: [{
   file: 'test.yml',
   name: 'test',
   label: 'Test',
   fields: [
     { name: 'html_widget', label: 'HTML Widget', widget: 'html', storeImages: true },
   ],
 }],
}],
}

CMS.registerWidget('html', HtmlControl, HtmlPreview)

init({ config })
