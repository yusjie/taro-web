import path from 'node:path'

import { chalk, fs, PLATFORMS, recursiveMerge } from '@tarojs/helper'
import { PLATFORM_TYPE } from '@tarojs/shared'
import HtmlWebpackPlugin from 'html-webpack-plugin'

import H5Plugin from '../plugins/H5Plugin'
import WebpackPlugin from './WebpackPlugin'

import type { IPostcssOption } from '@tarojs/taro/types/compile'
import type { H5Combination } from './H5Combination'
import type { PluginArgs } from './WebpackPlugin'

export class H5WebpackPlugin {
  combination: H5Combination
  pages?: string[]
  pxtransformOption?: IPostcssOption<'h5'>['pxtransform']

  constructor (combination: H5Combination) {
    this.combination = combination
  }

  getPlugins () {
    const plugins: Record<string, { plugin: any, args: PluginArgs }> = {
      definePlugin: this.getDefinePlugin(),
      mainPlugin: this.getMainPlugin()
    }
    const template = path.join(this.combination.sourceDir, 'index.html')
    if (fs.existsSync(template)) {
      const pages = this.pages || []
      if (pages.length > 0) {
        // NOTE: multi router
        pages.forEach(page => {
          plugins[page] = this.getHtmlWebpackPlugin(template, page)
        })
      } else {
        plugins.htmlWebpackPlugin = this.getHtmlWebpackPlugin(template)
      }
    }

    const miniCssExtractPlugin = this.getMiniCssExtractPlugin()
    if (miniCssExtractPlugin) plugins.miniCssExtractPlugin = miniCssExtractPlugin

    const copyWebpackPlugin = this.getCopyWebpackPlugin()
    if (copyWebpackPlugin) plugins.copyWebpackPlugin = copyWebpackPlugin

    return plugins
  }

  getDefinePlugin () {
    const {
      env = {},
      defineConstants = {},
      buildAdapter = PLATFORMS.H5,
      framework = 'react',
      useDeprecatedAdapterComponent = false
    } = this.combination.config

    env.FRAMEWORK = JSON.stringify(framework)
    env.TARO_ENV = JSON.stringify(buildAdapter)
    env.TARO_PLATFORM = JSON.stringify(process.env.TARO_PLATFORM || PLATFORM_TYPE.WEB)
    env.SUPPORT_TARO_POLYFILL = env.SUPPORT_TARO_POLYFILL || '"disabled"'
    env.SUPPORT_DINGTALK_NAVIGATE = env.SUPPORT_DINGTALK_NAVIGATE || '"disabled"'
    const envConstants = Object.keys(env).reduce((target, key) => {
      target[`process.env.${key}`] = env[key]
      return target
    }, {})

    defineConstants.DEPRECATED_ADAPTER_COMPONENT = JSON.stringify(!!useDeprecatedAdapterComponent)
    return WebpackPlugin.getDefinePlugin([envConstants, defineConstants])
  }

  getCopyWebpackPlugin () {
    const { appPath, config } = this.combination
    const { copy } = config

    if (copy?.patterns.length) {
      return WebpackPlugin.getCopyWebpackPlugin(appPath, copy)
    }
  }

  getMiniCssExtractPlugin () {
    const {
      mode,
      enableExtract = mode === 'production',
      miniCssExtractPluginOption = {}
    } = this.combination.config
    if (!enableExtract) return

    const args = Object.assign({
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css'
    }, miniCssExtractPluginOption)
    return WebpackPlugin.getMiniCssExtractPlugin(args)
  }

  getHtmlWebpackPlugin (template, entry = '', chunks: string[] = []) {
    const config = this.combination.config || {}
    const options = this.pxtransformOption?.config || {}
    const max = options?.maxRootSize ?? 40
    const min = options?.minRootSize ?? 20
    const baseFontSize = options?.baseFontSize || (min > 1 ? min : 20)
    const designWidth = (input => typeof options.designWidth === 'function'
      ? options.designWidth(input)
      : options.designWidth)(baseFontSize)
    const rootValue = baseFontSize / options.deviceRatio![designWidth!] * 2
    let htmlScript = ''
    if ((options?.targetUnit ?? 'rem') === 'rem') {
      htmlScript = `!function(n){function f(){var e=n.document.documentElement,r=e.getBoundingClientRect(),width=r.width,height=r.height,arr=[width,height].filter(function(value){return Boolean(value)}),w=Math.min.apply(Math,arr),x=${rootValue}*w/${designWidth};e.style.fontSize=x>=${max}?"${max}px":x<=${min}?"${min}px":x+"px"}; n.addEventListener("resize",(function(){f()})),f()}(window);`
    }
    const args: Record<string, string | string []> = {
      filename: `${entry || 'index'}.html`,
      script: htmlScript,
      template,
    }
    if (entry && entry !== 'index') {
      args.chunks = [...chunks, entry]
    }
    const htmlPluginOption = config.htmlPluginOption ?? {}
    if (config.mode !== 'production' && Object.hasOwnProperty.call(htmlPluginOption, 'script')) {
      console.warn(
        chalk.yellowBright('配置文件覆盖 htmlPluginOption.script 参数会导致 pxtransform 脚本失效，请慎重使用！')
      )
    }
    return WebpackPlugin.getPlugin(HtmlWebpackPlugin, [recursiveMerge(args, htmlPluginOption)])
  }

  getMainPlugin () {
    const {
      appPath,
      sourceDir,
      config
    } = this.combination
    const {
      entryFileName = 'app',
      router = {}
    } = config
    const pxTransformConfig = this.pxtransformOption?.config || {}
    const prebundleOptions = this.combination.getPrebundleOptions()
    const options = {
      /** paths */
      appPath,
      sourceDir,
      entryFileName,
      /** config & message */
      framework: config.framework,
      frameworkExts: config.frameworkExts,
      routerConfig: router,
      runtimePath: config.runtimePath,
      pxTransformConfig,
      alias: config.alias,
      defineConstants: config.defineConstants,
      /** building mode */
      prebundle: prebundleOptions.enable,
      isBuildNativeComp: this.combination.isBuildNativeComp,
      noInjectGlobalStyle: this.combination.noInjectGlobalStyle,
      /** hooks & methods */
      modifyAppConfig: config.modifyAppConfig,
      onCompilerMake: config.onCompilerMake,
      onParseCreateElement: config.onParseCreateElement,
    }

    return WebpackPlugin.getPlugin(H5Plugin, [options])
  }
}
