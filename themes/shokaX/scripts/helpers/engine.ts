'use strict'

// @ts-ignore
import { htmlTag, url_for } from 'hexo-util'
import fs from 'node:fs'
import theme_env from '../../package.json'

const randomServer = parseInt(String(Math.random() * 4), 10) + 1

const randomBG = function (count = 1, image_server:string = null, image_list:string[] = []) {
  let i
  if (image_server) {
    if (count && count > 1) {
      const arr = new Array(count)
      for (i = 0; i < arr.length; i++) {
        arr[i] = image_server + '?' + Math.floor(Math.random() * 999999)
      }

      return arr
    }

    return image_server + '?' + Math.floor(Math.random() * 999999)
  }

  const parseImage = function (img:string, size:string) {
    if (img.startsWith('//') || img.startsWith('http')) {
      return img
    } else if (hexo.theme.config.experiments?.usingRelative) { // support relative url
      return img
    } else {
      console.warn("sinaimg blocked all request from outside website,so don't use this format")
      return `https://tva${randomServer}.sinaimg.cn/` + size + '/' + img
    }
  }

  if (count && count > 1) {
    let shuffled = image_list.slice(0)
    while (shuffled.length <= 6) {
      shuffled = shuffled.concat(image_list.slice(0))
    }
    i = shuffled.length
    const min = i - count; let temp; let index
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random())
      temp = shuffled[index]
      shuffled[index] = shuffled[i]
      shuffled[i] = temp
    }

    return shuffled.slice(min).map(function (img) {
      return parseImage(img, 'large')
    })
  }

  return parseImage(image_list[Math.floor(Math.random() * image_list.length)], 'mw690')
}

hexo.extend.helper.register('preloadjs', function () {
  const { statics, js } = hexo.theme.config
  let res = ''
  fs.readdirSync('./shokaxTemp').forEach((file) => {
    if (file.endsWith('.js')) {
      res += htmlTag('link', { rel: 'modulepreload', href: url_for.call(this, `${statics}${js}/${file}`) }, '')
    }
  })
  return res
})

hexo.extend.helper.register('load_async_css', function (){
  const { statics, css } = hexo.theme.config
  let res = ''
  fs.readdirSync('./shokaxTemp').forEach((file) => {
    if (file.endsWith('.css')) {
      res += htmlTag('link', { rel: 'stylesheet', href: url_for.call(this, `${statics}${css}/${file}`), media: 'none', onload: "this.media='all'" }, '')
    }
  })
  return res
})

// 注册hexo主题中的URL帮助方法
hexo.extend.helper.register('_url', function (path, text, options = {}) {
  // 如果未提供URL路径，则返回
  if (!path) { return }

  let tag = 'a'
  let attrs: { class: string; 'data-url': any; [index:string]:any } = { href: url_for.call(this, path), class: undefined, external: undefined, rel: undefined, 'data-url': undefined }

  for (const key in options) {
    attrs[key] = options[key]
  }

  if (attrs.class && Array.isArray(attrs.class)) {
    attrs.class = attrs.class.join(' ')
  }

  // 返回HTML标记字符串
  return htmlTag(tag, attrs, decodeURI(text), false)
})

hexo.extend.helper.register('_image_url', function (img, path = '') {
  const { statics } = hexo.theme.config
  const { post_asset_folder } = hexo.config

  if (img.startsWith('//') || img.startsWith('http')) {
    return img
  } else {
    return url_for.call(this, statics + (post_asset_folder ? path : '') + img)
  }
})

hexo.extend.helper.register('_cover', function (item, num?) {
  const { image_server, image_list } = hexo.theme.config

  if (item.cover) {
    return this._image_url(item.cover, item.path)
  } else if (item.photos && item.photos.length > 0) {
    return this._image_url(item.photos[0], item.path)
  } else {
    return randomBG(num || 1, image_server, image_list)
  }
})

hexo.extend.helper.register('_cover_index', function (item) {
  const { index_images, image_list, image_server } = hexo.theme.config

  if (item.cover) {
    return this._image_url(item.cover, item.path)
  } else if (item.photos && item.photos.length > 0) {
    return this._image_url(item.photos[0], item.path)
  } else {
    return randomBG(6, image_server, index_images.length === 0 ? image_list : index_images)
  }
})

// 注册hexo主题的永久链接帮助方法
hexo.extend.helper.register('_permapath', function (str) {
  // 获取hexo的永久链接配置
  const { permalink } = hexo.config
  // 将输入字符串中的'index.html'替换为空字符串
  let url = str.replace(/index\.html$/, '')
  // 如果永久链接不以'.html'结尾，将输入字符串中的'.html'替换为空字符串
  if (!permalink.endsWith('.html')) {
    url = url.replace(/\.html$/, '')
  }
  // 返回处理后的URL字符串
  return url
})

hexo.extend.helper.register('canonical', function () {
  return `<link rel="canonical" href="${this._permapath(this.url)}">`
})

/**
 * Get page path given a certain language tag
 */
// 注册hexo主题的国际化路径帮助方法
hexo.extend.helper.register('i18n_path', function (language) {
  // 获取当前页面的path和lang
  const { path, lang } = this.page
  // 如果path以lang开头，则截取掉lang部分，作为基础路径
  const base = path.startsWith(lang) ? path.slice(lang.length + 1) : path
  // 通过调用url_for方法，生成国际化路径
  return url_for.call(this, `${this.languages.indexOf(language) === 0 ? '' : '/' + language}/${base}`)
})

/**
 * Get the language name
 */
// 注册hexo主题的语言名称帮助方法
hexo.extend.helper.register('language_name', function (language) {
  // 从主题配置中获取指定语言的名称
  // @ts-ignore
  const name = hexo.theme.i18n.__(language)('name')
  // 如果名称为默认值'name'，则返回语言代码，否则返回语言名称
  return name === 'name' ? language : name
})

hexo.extend.helper.register('random_color', function () {
  const arr:number[] = []
  for (let i = 0; i < 3; i++) {
    arr.push(Math.floor(Math.random() * 128 + 128))
  }
  const [r, g, b] = arr
  return `#${
    r.toString(16).length > 1 ? r.toString(16) : '0' + r.toString(16)
  }${g.toString(16).length > 1 ? g.toString(16) : '0' + g.toString(16)}${
    b.toString(16).length > 1 ? b.toString(16) : '0' + b.toString(16)
  }`
})

hexo.extend.helper.register('shokax_inject', function (point) {
  return hexo.theme.config.injects[point]
    .map(item => this.partial(item.layout, item.locals, item.options))
    .join('')
})
