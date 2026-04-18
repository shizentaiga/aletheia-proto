var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __template = (cooked, raw2) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw2 || cooked.slice()) }));

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var escapeRe = /[&<>'"]/;
var stringBufferToString = /* @__PURE__ */ __name(async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
}, "stringBufferToString");
var escapeToBuffer = /* @__PURE__ */ __name((str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match2; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
}, "escapeToBuffer");
var resolveCallbackSync = /* @__PURE__ */ __name((str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
}, "resolveCallbackSync");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html2, arg, headers) => {
    const res = /* @__PURE__ */ __name((html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/trailing-slash/index.js
var trimTrailingSlash = /* @__PURE__ */ __name((options) => {
  return /* @__PURE__ */ __name(async function trimTrailingSlash2(c, next) {
    if (options?.alwaysRedirect) {
      if ((c.req.method === "GET" || c.req.method === "HEAD") && c.req.path !== "/" && c.req.path.at(-1) === "/") {
        const url = new URL(c.req.url);
        url.pathname = url.pathname.substring(0, url.pathname.length - 1);
        return c.redirect(url.toString(), 301);
      }
    }
    await next();
    if (!options?.alwaysRedirect && c.res.status === 404 && (c.req.method === "GET" || c.req.method === "HEAD") && c.req.path !== "/" && c.req.path.at(-1) === "/") {
      const url = new URL(c.req.url);
      url.pathname = url.pathname.substring(0, url.pathname.length - 1);
      c.res = c.redirect(url.toString(), 301);
    }
  }, "trimTrailingSlash2");
}, "trimTrailingSlash");

// node_modules/hono/dist/helper/html/index.js
var html = /* @__PURE__ */ __name((strings, ...values) => {
  const buffer = [""];
  for (let i = 0, len = strings.length - 1; i < len; i++) {
    buffer[0] += strings[i];
    const children = Array.isArray(values[i]) ? values[i].flat(Infinity) : [values[i]];
    for (let i2 = 0, len2 = children.length; i2 < len2; i2++) {
      const child = children[i2];
      if (typeof child === "string") {
        escapeToBuffer(child, buffer);
      } else if (typeof child === "number") {
        ;
        buffer[0] += child;
      } else if (typeof child === "boolean" || child === null || child === void 0) {
        continue;
      } else if (typeof child === "object" && child.isEscaped) {
        if (child.callbacks) {
          buffer.unshift("", child);
        } else {
          const tmp = child.toString();
          if (tmp instanceof Promise) {
            buffer.unshift("", tmp);
          } else {
            buffer[0] += tmp;
          }
        }
      } else if (child instanceof Promise) {
        buffer.unshift("", child);
      } else {
        escapeToBuffer(child.toString(), buffer);
      }
    }
  }
  buffer[0] += strings.at(-1);
  return buffer.length === 1 ? "callbacks" in buffer ? raw(resolveCallbackSync(raw(buffer[0], buffer.callbacks))) : raw(buffer[0]) : stringBufferToString(buffer, buffer.callbacks);
}, "html");

// src/_sandbox/test00_hello.tsx
var test00 = new Hono2();
test00.get("/", (c) => {
  return c.html(html`
    <div style="border: 2px solid #333; padding: 20px; border-radius: 8px;">
      <h2 style="margin-top: 0;">🧪 Test00: Hello External File</h2>
      <p>外部ファイルからのマウントに成功しました。</p>
      <p style="font-size: 0.8rem; color: #666;">
        Path: <code>src/_sandbox/test00_hello.tsx</code>
      </p>
    </div>
  `);
});

// src/_sandbox/test01_google-auth.tsx
var test01 = new Hono2();
test01.get("/", (c) => {
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2 style="color: #333;">ALETHEIA Auth Test</h2>
      <p style="color: #666; margin-bottom: 30px;">
        ボタンを押して Google 認証フロー（擬似）を開始します
      </p>
      
      <a href="/_sandbox/test01/google-mock" style="
        display: inline-flex;
        align-items: center;
        padding: 10px 24px;
        background-color: #ffffff;
        border: 1px solid #dadce0;
        border-radius: 4px;
        color: #3c4043;
        text-decoration: none;
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      ">
        <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" style="margin-right: 10px;">
        Google でサインイン
      </a>

      <div style="margin-top: 40px; font-size: 0.8rem; color: #999;">
        <p>※現在はリダイレクトURL制限を考慮し、<br>実際のGoogle通信を除外した「モック画面」へ遷移します。</p>
        <p>設定完了後は <code>googleAuth()</code> ミドルウェアを適用します。</p>
      </div>
    </div>
  `);
});
test01.get("/google-mock", (c) => {
  return c.html(html`
    <div style="font-family: sans-serif; padding: 40px;">
      <h1 style="color: #4285F4;">✅ 認証フローの疎通成功</h1>
      <p>この画面が表示されていれば、<strong>サンドボックス内のルーティング</strong>は正常です。</p>
      <hr>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4285F4;">
        <p><strong>Next Step:</strong></p>
        <ol>
          <li>Google Cloud Console でリダイレクトURLを許可</li>
          <li><code>BASE_URL</code> 環境変数を <code>wrangler.jsonc</code> に設定</li>
          <li>実際の <code>googleAuth</code> ミドルウェアを有効化</li>
        </ol>
      </div>
    </div>
  `);
});

// src/_sandbox/test02_db.tsx
var test02 = new Hono2();
test02.get("/", async (c) => {
  const envName = c.env.ENVIRONMENT || "development (local)";
  try {
    const { results } = await c.env.ALETHEIA_PROTO_DB.prepare("SELECT * FROM services LIMIT 10").all();
    return c.html(html`
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #333;">🧪 Test02: DB Connection Test</h2>
        <p>Environment: <strong>${envName}</strong></p>
        <hr>
        <h3>Services Table (Sample Data)</h3>
        ${results.length === 0 ? html`<p style="color: red;">⚠️ データが見つかりません。seed.sqlを実行しましたか？</p>` : html`
            <div style="display: grid; gap: 10px;">
              ${results.map((item) => html`
                <div style="border: 1px solid #ccc; padding: 15px; border-radius: 8px; background: #fff;">
                  <strong style="font-size: 1.1rem;">${item.title}</strong><br>
                  <small style="color: #666;">ID: ${item.id}</small><br>
                  <span style="display: inline-block; margin-top: 5px; padding: 2px 8px; background: #e0e0e0; border-radius: 4px; font-size: 0.8rem;">
                    ${item.station_context}
                  </span>
                </div>
              `)}
            </div>
          `}
        <hr>
      </div>
    `);
  } catch (e) {
    console.error("DB Error:", e);
    return c.html(html`
      <div style="color: red; padding: 20px; border: 2px solid red;">
        <h3>❌ データベース接続エラー</h3>
        <p>${String(e)}</p>
        <p><strong>確認事項:</strong></p>
        <ul>
          <li>wrangler.jsonc の Binding名が <code>ALETHEIA_PROTO_DB</code> か？</li>
          <li>ローカル実行なら <code>--local</code> を付けて <code>execute</code> したか？</li>
        </ul>
      </div>
    `, 500);
  }
});
test02.get("/raw", async (c) => {
  const { results } = await c.env.ALETHEIA_PROTO_DB.prepare("SELECT * FROM users").all();
  return c.json(results);
});

// src/_sandbox/test03_cafe.ts
var test03 = new Hono2();
var CAFE_LIST = [
  { name: "\u6728\u306E\u5B9F", genre: "\u55AB\u8336\u5E97", score: "3.45", dist: "\u5F92\u6B695\u5206", memo: "\u662D\u548C\u30EC\u30C8\u30ED\u3001\u30BF\u30DE\u30B4\u30B5\u30F3\u30C9" },
  { name: "\u767D\u9CE5", genre: "\u55AB\u8336\u5E97", score: "3.37", dist: "\u5F92\u6B691\u5206", memo: "\u99C5\u524D\u3001\u55AB\u7159\u53EF" },
  { name: "\u5FA1\u8C46\u5C4B", genre: "\u30B3\u30FC\u30D2\u30FC\u30B9\u30BF\u30F3\u30C9", score: "3.23", dist: "\u5F92\u6B693\u5206", memo: "\u30C6\u30A4\u30AF\u30A2\u30A6\u30C8\u4E2D\u5FC3" },
  { name: "Cafe one sheep", genre: "\u30AB\u30D5\u30A7", score: "3.21", dist: "\u5F92\u6B696\u5206", memo: "\u304A\u3057\u3083\u308C\u3001\u7652\u3084\u3057\u7CFB" }
  // 【ここに「自分の知っている店」をどんどん追記してください】
];
var _a;
test03.get("/", (c) => {
  return c.html(
    html(_a || (_a = __template(['\n      <!DOCTYPE html>\n      <html lang="ja">\n      <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>  Cafe List Test</title>\n        <script src="https://cdn.tailwindcss.com"><\/script>\n      </head>\n      <body class="bg-gray-50 text-gray-900 p-4">\n        <div class="max-w-md mx-auto">\n          <header class="mb-6">\n            <h1 class="text-2xl font-bold border-l-4 border-blue-600 pl-3">  Cafe List</h1>\n            <p class="text-sm text-gray-500 mt-1">\u5C0F\u5CA9\u99C5\u5468\u8FBA \u30D7\u30ED\u30C8\u30BF\u30A4\u30D7 v0.1</p>\n          </header>\n\n          <div class="space-y-3">\n            ', '\n          </div>\n\n          <footer class="mt-10 pt-6 border-t text-center text-xs text-gray-400">\n            <p>\u203B\u30C7\u30FC\u30BF\u306F\u73FE\u5728\u30CF\u30FC\u30C9\u30B3\u30FC\u30C9\u3055\u308C\u3066\u3044\u307E\u3059</p>\n            <a href="/sandbox/" class="text-blue-500 underline mt-2 inline-block">\u958B\u767A\u30E1\u30CB\u30E5\u30FC\u306B\u623B\u308B</a>\n          </footer>\n        </div>\n      </body>\n      </html>\n    '])), CAFE_LIST.map((cafe) => html`
              <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="font-bold text-lg">${cafe.name}</h2>
                    <p class="text-xs text-blue-600 font-semibold">${cafe.genre}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-sm font-mono bg-yellow-100 px-2 py-1 rounded">⭐ ${cafe.score}</span>
                    <p class="text-xs text-gray-400 mt-2">${cafe.dist}</p>
                  </div>
                </div>
                <p class="text-sm text-gray-600 mt-2 italic">"${cafe.memo}"</p>
              </div>
            `))
  );
});

// src/_sandbox/test03-2_cafe.ts
var test03_2 = new Hono2();
var MASTER_DATA = {
  koiwa: [
    { name: "\u767D\u9CE5", dist: 1, dir: "\u2B07\uFE0F\u5357", open: "08:00", close: "20:00", genre: "\u55AB\u8336", memo: "\u99C5\u524D\u30012\u968E\u5E2D\u3042\u308A" },
    { name: "\u6728\u306E\u5B9F", dist: 5, dir: "\u2B06\uFE0F\u5317", open: "09:00", close: "18:00", genre: "\u55AB\u8336", memo: "\u30EC\u30C8\u30ED\u3001\u30BF\u30DE\u30B4\u30B5\u30F3\u30C9" },
    { name: "Cafe one sheep", dist: 6, dir: "\u2B07\uFE0F\u5357", open: "11:00", close: "22:00", genre: "\u30AB\u30D5\u30A7", memo: "\u591C\u9593\u55B6\u696D\u3001\u7652\u3084\u3057" },
    { name: "\u5FA1\u8C46\u5C4B", dist: 3, dir: "\u2B06\uFE0F\u5317", open: "10:00", close: "19:00", genre: "\u30B3\u30FC\u30D2", memo: "\u30C6\u30A4\u30AF\u30A2\u30A6\u30C8\u4E2D\u5FC3" },
    { name: "Sui coffee", dist: 8, dir: "\u2B06\uFE0F\u5317", open: "10:00", close: "19:00", genre: "\u7119\u714E", memo: "\u3053\u3060\u308F\u308A\u8C46" },
    { name: "\u30E2\u30CA\u30EA\u30B6", dist: 4, dir: "\u2B06\uFE0F\u5317", open: "08:30", close: "19:00", genre: "\u55AB\u8336", memo: "\u662D\u548C\u306E\u7D14\u55AB\u8336" },
    { name: "\u30D1\u30B9\u30AB\u30EB \u672C\u5E97", dist: 7, dir: "\u2B06\uFE0F\u5317", open: "10:00", close: "20:00", genre: "\u83D3\u5B50", memo: "\u30B1\u30FC\u30AD\u5C4B\u3055\u3093\u306E\u30AB\u30D5\u30A7" },
    { name: "\u30E9\u30FB\u30BF\u30DF\u30A8\u30FC\u30EB", dist: 2, dir: "\u2B07\uFE0F\u5357", open: "10:00", close: "20:00", genre: "\u30D1\u30F3", memo: "\u30A4\u30FC\u30C8\u30A4\u30F3\u3042\u308A" },
    { name: "\u30B5\u30F3\u30DE\u30EB\u30AF\u5C0F\u5CA9", dist: 2, dir: "\u2B07\uFE0F\u5357", open: "07:00", close: "22:00", genre: "\u30C1\u30A7", memo: "\u5B89\u5B9A\u306E\u30C1\u30A7\u30FC\u30F3" },
    { name: "\u661F\u4E43\u73C8\u7432\u5E97 \u5C0F\u5CA9", dist: 3, dir: "\u2B07\uFE0F\u5357", open: "08:00", close: "21:00", genre: "\u30C1\u30A7", memo: "\u3086\u3063\u305F\u308A\u30BD\u30D5\u30A1" }
    // ... 20件規模まで想定（以下略）
  ],
  tokyo: [
    { name: "\u30D6\u30EB\u30C7\u30A3\u30AC\u30E9", dist: 1, dir: "\u{1F3AB}\u5185", level: "B1F", open: "07:00", close: "22:00", genre: "\u30D1\u30F3", memo: "\u30B0\u30E9\u30F3\u30B9\u30BF\u6771\u4EAC\u5185" },
    { name: "\u8C46\u4E00\u8C46", dist: 2, dir: "\u{1F3AB}\u5185", level: "1F", open: "08:00", close: "21:00", genre: "\u548C\u83D3", memo: "\u3042\u3093\u3071\u3093\u5C02\u9580\u5E97" },
    { name: "\u5343\u758B\u5C4B", dist: 3, dir: "\u{1F6AA}\u5916", level: "1F", open: "09:00", close: "20:00", genre: "\u30D5\u30EB", memo: "\u4E00\u756A\u8857\u3001\u30D5\u30EB\u30FC\u30C4" },
    { name: "\u30C8\u30E9\u30E4\u3042\u3093\u30B9\u30BF\u30F3\u30C9", dist: 2, dir: "\u{1F6AA}\u5916", level: "2F", open: "10:00", close: "20:00", genre: "\u7518\u5473", memo: "\u5317\u753A\u9152\u5834\u8FD1\u304F" },
    { name: "\u30B9\u30BF\u30FC\u30D0\u30C3\u30AF\u30B9", dist: 1, dir: "\u{1F6AA}\u5916", level: "B1F", open: "06:30", close: "22:30", genre: "\u30C1\u30A7", memo: "\u30E4\u30A8\u30C1\u30AB\u3001\u6FC0\u6DF7\u307F" },
    { name: "\u30D7\u30ED\u30F3\u30C8", dist: 4, dir: "\u{1F6AA}\u5916", level: "B1F", open: "07:00", close: "23:00", genre: "\u30D0\u30EB", memo: "\u65E5\u672C\u6A4B\u53E3\u65B9\u9762" },
    { name: "\u4E00\u4FDD\u5802\u8336\u8217", dist: 8, dir: "\u{1F6AA}\u5916", level: "1F", open: "11:00", close: "19:00", genre: "\u65E5\u672C\u8336", memo: "\u4E38\u306E\u5185\u3001\u9759\u304B" }
    // ... 30件規模まで想定
  ],
  tabata: [
    { name: "\u30AC\u30B9\u30C8 \u7530\u7AEF", dist: 1, dir: "\u2B07\uFE0F\u5357", open: "07:00", close: "23:30", genre: "\u30D5\u30A1", memo: "\u5357\u53E3\u3001\u968E\u6BB5\u4E0A\u304C\u3063\u3066\u3059\u3050" },
    { name: "\u30D7\u30ED\u30F3\u30C8 \u7530\u7AEF", dist: 1, dir: "\u2B06\uFE0F\u5317", open: "07:00", close: "22:00", genre: "\u30C1\u30A7", memo: "\u30A2\u30C8\u30EC\u30F4\u30A3\u7530\u7AEF\u5185" },
    { name: "\u30B9\u30BF\u30FC\u30D0\u30C3\u30AF\u30B9", dist: 1, dir: "\u2B06\uFE0F\u5317", open: "07:00", close: "22:00", genre: "\u30C1\u30A7", memo: "\u5317\u53E3\u3001\u6539\u672D\u6A2A" }
  ]
};
var _a2;
test03_2.get("/", (c) => {
  const stationId = c.req.query("station") || "koiwa";
  const cafes = MASTER_DATA[stationId] || [];
  const sortedCafes = [...cafes].sort((a, b) => a.dist - b.dist);
  const stationNames = { koiwa: "\u5C0F\u5CA9\u99C5", tokyo: "\u6771\u4EAC\u99C5", tabata: "\u7530\u7AEF\u99C5" };
  return c.html(
    html(_a2 || (_a2 = __template(['\n      <!DOCTYPE html>\n      <html lang="ja">\n      <head>\n        <meta charset="UTF-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">\n        <title>  Cafe List</title>\n        <script src="https://cdn.tailwindcss.com"><\/script>\n        <style> .truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } </style>\n      </head>\n      <body class="bg-gray-100 text-gray-900 font-sans">\n        <div class="max-w-md mx-auto min-h-screen bg-white shadow-xl">\n          \n          <nav class="flex border-b text-center bg-gray-50">\n            ', '\n          </nav>\n\n          <header class="p-4 bg-white border-b">\n            <h1 class="text-xl font-black text-gray-800">', ' <span class="text-gray-300 font-light ml-1">/ Context</span></h1>\n          </header>\n\n          <main class="divide-y divide-gray-50">\n            ', '\n          </main>\n\n          <footer class="p-8 text-center bg-gray-50 text-[10px] text-gray-300 tracking-tighter">\n            <p>  ARCHITECTURE PROTOTYPE v0.3</p>\n            <p class="mt-1">Filtering Logic: Nearest-First by Metric</p>\n          </footer>\n        </div>\n      </body>\n      </html>\n    '])), Object.keys(stationNames).map((id) => html`
              <a href="?station=${id}" class="flex-1 py-3 text-xs font-bold ${stationId === id ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-400"}">
                ${stationNames[id]}
              </a>
            `), stationNames[stationId], sortedCafes.map((cafe) => html`
              <div class="flex items-center p-3 hover:bg-blue-50 transition-colors">
                <div class="w-14 flex-none text-center leading-tight">
                  <div class="text-xs font-bold text-blue-600">${cafe.dist}<span class="text-[8px] font-normal ml-0.5">min</span></div>
                  <div class="text-[10px] text-gray-400 mt-1">${cafe.dir}</div>
                </div>

                <div class="flex-grow min-w-0 px-2">
                  <div class="flex items-center gap-1">
                    ${cafe.level ? html`<span class="text-[8px] px-1 bg-black text-white rounded-sm font-mono">${cafe.level}</span>` : ""}
                    <h2 class="font-bold text-sm truncate-text text-gray-800">${cafe.name}</h2>
                  </div>
                  <p class="text-[9px] text-gray-400 truncate-text mt-0.5">${cafe.memo}</p>
                </div>

                <div class="w-14 flex-none text-right border-l pl-2">
                  <p class="text-[9px] font-mono text-gray-600">${cafe.open}</p>
                  <div class="h-[1px] bg-gray-100 w-full my-0.5"></div>
                  <p class="text-[9px] font-mono text-gray-300">${cafe.close}</p>
                </div>
              </div>
            `))
  );
});

// src/_sandbox/test03-3_cafe.ts
var test03_3 = new Hono2();
var STATIONS = [
  { id: "koiwa", name: "\u5C0F\u5CA9\u99C5", area: "\u6C5F\u6238\u5DDD\u533A", type: "Normal" },
  { id: "tokyo", name: "\u6771\u4EAC\u99C5", area: "\u5343\u4EE3\u7530\u533A", type: "Complex" },
  { id: "tabata", name: "\u7530\u7AEF\u99C5", area: "\u5317\u533A", type: "Normal" }
];
var CAFE_SAMPLES = {
  tokyo: [
    { name: "\u30D6\u30EB\u30C7\u30A3\u30AC\u30E9", isInside: true, level: "B1F", memo: "\u30B0\u30E9\u30F3\u30B9\u30BF\u5185\u30FB\u6539\u672D\u5185" },
    { name: "\u30B9\u30BF\u30FC\u30D0\u30C3\u30AF\u30B9", isInside: false, level: "B1F", memo: "\u30E4\u30A8\u30C1\u30AB\u30FB\u6539\u672D\u5916" },
    { name: "\u30C8\u30E9\u30E4\u3042\u3093\u30B9\u30BF\u30F3\u30C9", isInside: false, level: "2F", memo: "\u5317\u753A\u9152\u5834\u30FB\u6539\u672D\u5916" }
  ]
};
var _a3;
test03_3.get("/", (c) => {
  const stationId = c.req.query("station");
  const stationName = STATIONS.find((s) => s.id === stationId)?.name || "\u99C5\u3092\u9078\u629E";
  return c.html(
    html(_a3 || (_a3 = __template([`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>  Search Prototype</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <script>
          // \u3010\u5C65\u6B74\u30B9\u30BF\u30C3\u30AF\u30FB\u30ED\u30B8\u30C3\u30AF\u3011
          function updateHistory(id, name) {
            if(!id) return;
            let history = JSON.parse(localStorage.getItem(' _history') || '[]');
            // \u91CD\u8907\u524A\u9664\u3057\u3066\u5148\u982D\u306B\u8FFD\u52A0
            history = history.filter(item => item.id !== id);
            history.unshift({id, name});
            // \u6700\u59275\u4EF6\u306B\u5236\u9650
            localStorage.setItem(' _history', JSON.stringify(history.slice(0, 5)));
          }

          // \u30DA\u30FC\u30B8\u8AAD\u307F\u8FBC\u307F\u6642\u306B\u5C65\u6B74\u3092\u8868\u793A
          window.onload = () => {
            const params = new URLSearchParams(window.location.search);
            const currentId = params.get('station');
            const currentName = "`, `";
            
            if(currentId && currentName !== "\u99C5\u3092\u9078\u629E") {
              updateHistory(currentId, currentName);
            }

            const history = JSON.parse(localStorage.getItem(' _history') || '[]');
            const historyArea = document.getElementById('history-area');
            if(history.length > 0) {
              historyArea.innerHTML = history.map(item => 
                \`<a href="?station=\${item.id}" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">\${item.name}</a>\`
              ).join('');
            }
          }

          // \u3010\u73FE\u5728\u5730\u53D6\u5F97\u30ED\u30B8\u30C3\u30AF\uFF08\u7591\u4F3C\uFF09\u3011
          function getGeo() {
            const btn = document.getElementById('geo-btn');
            btn.innerText = "\u53D6\u5F97\u4E2D...";
            // \u5B9F\u969B\u306F navigator.geolocation.getCurrentPosition \u3092\u4F7F\u7528
            setTimeout(() => {
              btn.innerText = "\u{1F4CD} \u5C0F\u5CA9\u99C5\u304C\u8FD1\u304F\u306B\u898B\u3064\u304B\u308A\u307E\u3057\u305F";
              btn.classList.add('bg-green-500', 'text-white');
            }, 1000);
          }
        <\/script>
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased pb-10">
        <div class="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          
          <div class="p-6 bg-gradient-to-b from-blue-600 to-blue-700 text-white">
            <h1 class="text-2xl font-black tracking-tighter mb-4"> </h1>
            
            <div class="relative mb-4 text-gray-800">
              <input type="text" placeholder="\u99C5\u540D\u3001\u5834\u6240\u3092\u691C\u7D22..." class="w-full p-4 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <span class="absolute right-4 top-4 text-gray-300">\u{1F50D}</span>
            </div>

            <button id="geo-btn" onclick="getGeo()" class="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-sm font-bold transition-all">
              \u{1F4CD} \u73FE\u5728\u5730\u304B\u3089\u63A2\u3059
            </button>
          </div>

          <div class="p-4 bg-white border-b">
            <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">\u6700\u8FD1\u30C1\u30A7\u30C3\u30AF\u3057\u305F\u99C5</p>
            <div id="history-area" class="flex flex-wrap gap-2 text-gray-400 text-xs italic">
              \u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093
            </div>
          </div>

          <div class="p-4">
            <h2 class="text-sm font-bold text-gray-400 mb-4 flex justify-between items-center">
              <span>`, " \u306E\u7D50\u679C</span>\n              ", '\n            </h2>\n\n            <div class="space-y-3">\n              ', '\n            </div>\n          </div>\n\n          <div class="m-4 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">\n            <p class="text-[11px] text-yellow-700 leading-relaxed">\n              \u26A0\uFE0F <strong>\u3054\u6CE8\u610F\uFF1A</strong> \u5C65\u6B74\u3084\u304A\u6C17\u306B\u5165\u308A\u306F\u3001\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u3092\u9589\u3058\u308B\u3068\u6D88\u3048\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u6C38\u7D9A\u7684\u306B\u4FDD\u5B58\u3059\u308B\u306B\u306F\u3001<a href="#" class="font-bold underline text-blue-600">\u30ED\u30B0\u30A4\u30F3</a>\u3092\u304A\u3059\u3059\u3081\u3057\u307E\u3059\u3002\n            </p>\n          </div>\n\n        </div>\n      </body>\n      </html>\n    '], [`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>  Search Prototype</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <script>
          // \u3010\u5C65\u6B74\u30B9\u30BF\u30C3\u30AF\u30FB\u30ED\u30B8\u30C3\u30AF\u3011
          function updateHistory(id, name) {
            if(!id) return;
            let history = JSON.parse(localStorage.getItem(' _history') || '[]');
            // \u91CD\u8907\u524A\u9664\u3057\u3066\u5148\u982D\u306B\u8FFD\u52A0
            history = history.filter(item => item.id !== id);
            history.unshift({id, name});
            // \u6700\u59275\u4EF6\u306B\u5236\u9650
            localStorage.setItem(' _history', JSON.stringify(history.slice(0, 5)));
          }

          // \u30DA\u30FC\u30B8\u8AAD\u307F\u8FBC\u307F\u6642\u306B\u5C65\u6B74\u3092\u8868\u793A
          window.onload = () => {
            const params = new URLSearchParams(window.location.search);
            const currentId = params.get('station');
            const currentName = "`, `";
            
            if(currentId && currentName !== "\u99C5\u3092\u9078\u629E") {
              updateHistory(currentId, currentName);
            }

            const history = JSON.parse(localStorage.getItem(' _history') || '[]');
            const historyArea = document.getElementById('history-area');
            if(history.length > 0) {
              historyArea.innerHTML = history.map(item => 
                \\\`<a href="?station=\\\${item.id}" class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">\\\${item.name}</a>\\\`
              ).join('');
            }
          }

          // \u3010\u73FE\u5728\u5730\u53D6\u5F97\u30ED\u30B8\u30C3\u30AF\uFF08\u7591\u4F3C\uFF09\u3011
          function getGeo() {
            const btn = document.getElementById('geo-btn');
            btn.innerText = "\u53D6\u5F97\u4E2D...";
            // \u5B9F\u969B\u306F navigator.geolocation.getCurrentPosition \u3092\u4F7F\u7528
            setTimeout(() => {
              btn.innerText = "\u{1F4CD} \u5C0F\u5CA9\u99C5\u304C\u8FD1\u304F\u306B\u898B\u3064\u304B\u308A\u307E\u3057\u305F";
              btn.classList.add('bg-green-500', 'text-white');
            }, 1000);
          }
        <\/script>
      </head>
      <body class="bg-gray-50 text-gray-900 font-sans antialiased pb-10">
        <div class="max-w-md mx-auto min-h-screen bg-white shadow-sm">
          
          <div class="p-6 bg-gradient-to-b from-blue-600 to-blue-700 text-white">
            <h1 class="text-2xl font-black tracking-tighter mb-4"> </h1>
            
            <div class="relative mb-4 text-gray-800">
              <input type="text" placeholder="\u99C5\u540D\u3001\u5834\u6240\u3092\u691C\u7D22..." class="w-full p-4 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
              <span class="absolute right-4 top-4 text-gray-300">\u{1F50D}</span>
            </div>

            <button id="geo-btn" onclick="getGeo()" class="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-sm font-bold transition-all">
              \u{1F4CD} \u73FE\u5728\u5730\u304B\u3089\u63A2\u3059
            </button>
          </div>

          <div class="p-4 bg-white border-b">
            <p class="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">\u6700\u8FD1\u30C1\u30A7\u30C3\u30AF\u3057\u305F\u99C5</p>
            <div id="history-area" class="flex flex-wrap gap-2 text-gray-400 text-xs italic">
              \u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093
            </div>
          </div>

          <div class="p-4">
            <h2 class="text-sm font-bold text-gray-400 mb-4 flex justify-between items-center">
              <span>`, " \u306E\u7D50\u679C</span>\n              ", '\n            </h2>\n\n            <div class="space-y-3">\n              ', '\n            </div>\n          </div>\n\n          <div class="m-4 p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">\n            <p class="text-[11px] text-yellow-700 leading-relaxed">\n              \u26A0\uFE0F <strong>\u3054\u6CE8\u610F\uFF1A</strong> \u5C65\u6B74\u3084\u304A\u6C17\u306B\u5165\u308A\u306F\u3001\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u3092\u9589\u3058\u308B\u3068\u6D88\u3048\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u6C38\u7D9A\u7684\u306B\u4FDD\u5B58\u3059\u308B\u306B\u306F\u3001<a href="#" class="font-bold underline text-blue-600">\u30ED\u30B0\u30A4\u30F3</a>\u3092\u304A\u3059\u3059\u3081\u3057\u307E\u3059\u3002\n            </p>\n          </div>\n\n        </div>\n      </body>\n      </html>\n    '])), stationName, stationName, stationId ? html`<a href="/sandbox/test03-3" class="text-blue-500 text-[10px]">クリア</a>` : "", stationId === "tokyo" ? CAFE_SAMPLES.tokyo.map((cafe) => html`
                <div class="flex items-center p-3 border rounded-xl hover:border-blue-300 transition-all cursor-pointer">
                  <div class="w-12 flex-none">
                    <span class="text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${cafe.isInside ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}">
                      ${cafe.isInside ? "\u99C5\u30CA\u30AB" : "\u99C5\u30BD\u30C8"}
                    </span>
                    <div class="text-[10px] text-gray-400 mt-1 font-mono text-center">${cafe.level}</div>
                  </div>
                  <div class="ml-3 flex-grow min-w-0">
                    <div class="font-bold text-sm text-gray-800">${cafe.name}</div>
                    <p class="text-[10px] text-gray-400 truncate">${cafe.memo}</p>
                  </div>
                  <div class="text-blue-500 text-sm">→</div>
                </div>
              `) : html`<p class="text-center py-10 text-gray-300 text-sm italic">駅を選択してリストを表示してください</p>`)
  );
});

// src/_sandbox/_router.ts
var sandboxApp = new Hono2();
sandboxApp.use("*", trimTrailingSlash());
sandboxApp.route("/test00", test00);
sandboxApp.route("/test01", test01);
sandboxApp.route("/test02", test02);
sandboxApp.route("/test03", test03);
sandboxApp.route("/test03-2", test03_2);
sandboxApp.route("/test03-3", test03_3);

// src/index.tsx
var app = new Hono2();
app.route("/_sandbox", sandboxApp);
app.get("/", (c) => {
  return c.text("ALETHEIA Prototype is running.");
});
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-flOkSA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-flOkSA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
