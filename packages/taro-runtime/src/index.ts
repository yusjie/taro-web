import './polyfill/reflect-metadata'
export { TaroNode } from './dom/node'
export { TaroText } from './dom/text'
export { TaroElement } from './dom/element'
export { TaroRootElement } from './dom/root'
export { FormElement } from './dom/form'
export { SVGElement } from './dom/svg'
export { MutationObserver } from './dom-external/mutation-observer'
export { TaroEvent, createEvent, eventHandler } from './dom/event'
export { createDocument, document } from './bom/document'
export { window } from './bom/window'
export { navigator } from './bom/navigator'
export { default as container } from './container'
export { default as processPluginHooks } from './container/plugin-hooks'
export { default as SERVICE_IDENTIFIER } from './constants/identifiers'
export { addLeadingSlash, safeExecute } from './dsl/common'
export * from './dsl/instance'
export { createPageConfig, injectPageInstance, createComponentConfig, createRecursiveComponentConfig, stringify, getPageInstance } from './dsl/common'
export { Current, getCurrentInstance } from './current'
export { Style } from './dom/style'
export { options } from './options'
export { nextTick } from './next-tick'
export { hydrate } from './hydrate'
export * from './emitter/emitter'
export { raf as requestAnimationFrame, caf as cancelAnimationFrame, now } from './bom/raf'
export { getComputedStyle } from './bom/getComputedStyle'
export * from './interface'
export { incrementId } from './utils'
export { eventSource } from './dom/event-source'
