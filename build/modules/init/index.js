var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// package-external:@wordpress/data
var require_data = __commonJS({
  "package-external:@wordpress/data"(exports, module) {
    module.exports = window.wp.data;
  }
});

// package-external:@wordpress/i18n
var require_i18n = __commonJS({
  "package-external:@wordpress/i18n"(exports, module) {
    module.exports = window.wp.i18n;
  }
});

// package-external:@wordpress/primitives
var require_primitives = __commonJS({
  "package-external:@wordpress/primitives"(exports, module) {
    module.exports = window.wp.primitives;
  }
});

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// packages/init/build-module/router-compat.mjs
if (typeof document !== "undefined" && document.startViewTransition) {
  const originalStartViewTransition = document.startViewTransition.bind(document);
  document.startViewTransition = (callback) => {
    const transition = originalStartViewTransition(callback);
    if (transition && transition.finished) {
      transition.finished.catch(() => {
      });
    }
    if (transition && transition.ready) {
      transition.ready.catch(() => {
      });
    }
    return transition;
  };
}

// packages/init/build-module/index.mjs
var import_data3 = __toESM(require_data(), 1);

// node_modules/@lubusin/wp-frappe-data-store/dist/index.js
var import_data = __toESM(require_data(), 1);
var import_data2 = __toESM(require_data(), 1);
function stableStringify(value) {
  if (value === void 0) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value).filter(([, child]) => child !== void 0).sort(([left], [right]) => left.localeCompare(right)).map(
      ([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`
    ).join(",")}}`;
  }
  return JSON.stringify(value);
}
function getListKey(doctype, query = {}) {
  return `${doctype}:${stableStringify(query)}`;
}
function getResourceKey(doctype, name) {
  return `${doctype}:${name}`;
}
var KNOWN_QUERY_PARAMS = /* @__PURE__ */ new Set([
  "fields",
  "filters",
  "orFilters",
  "orderBy",
  "limitStart",
  "limit",
  "groupBy",
  "distinct"
]);
function toFrappeQuery(query = {}) {
  const params = {};
  const fields = query.fields?.includes("name") ? query.fields : query.fields ? ["name", ...query.fields] : void 0;
  if (fields) params.fields = JSON.stringify(fields);
  if (query.filters) params.filters = JSON.stringify(query.filters);
  if (query.orFilters) params.or_filters = JSON.stringify(query.orFilters);
  if (query.orderBy) params.order_by = query.orderBy;
  if (query.limitStart !== void 0)
    params.limit_start = String(query.limitStart);
  if (query.limit !== void 0) params.limit_page_length = String(query.limit);
  if (query.groupBy) params.group_by = query.groupBy;
  if (query.distinct !== void 0) params.distinct = query.distinct ? "1" : "0";
  for (const [key, value] of Object.entries(query)) {
    if (!KNOWN_QUERY_PARAMS.has(key) && value !== void 0) {
      params[key] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }
  return params;
}
function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
var FrappeRequestError = class extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "FrappeRequestError";
    this.status = status;
    this.body = body;
  }
};
function errorMessage(body, status) {
  if (body.message) return body.message;
  if (body._server_messages) {
    try {
      const messages = JSON.parse(body._server_messages);
      const first = JSON.parse(messages[0] || "{}");
      if (first.message) return first.message.replace(/<[^>]*>/g, "");
    } catch {
    }
  }
  if (body.exception) return body.exception;
  if (body.exc_type) return body.exc_type;
  return `Frappe request failed with status ${status}`;
}
function createFrappeRequest(config) {
  const baseUrl = config.baseUrl ?? "";
  return async (options) => {
    const url = new URL(
      joinUrl(baseUrl, options.path),
      globalThis.location?.origin
    );
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }
    const configuredHeaders = typeof config.headers === "function" ? config.headers() : config.headers;
    const headers = new Headers(configuredHeaders);
    if (options.data) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      method: options.method,
      headers,
      credentials: config.credentials ?? "same-origin",
      body: options.data ? JSON.stringify(options.data) : void 0,
      signal: options.signal
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new FrappeRequestError(
        errorMessage(body, response.status),
        response.status,
        body
      );
    }
    return body;
  };
}
var LAYOUT_ONLY_FIELD_TYPES = /* @__PURE__ */ new Set([
  "Section Break",
  "Column Break",
  "HTML",
  "Button",
  "Fold",
  "Table",
  "Table MultiSelect"
]);
function humanizeFieldName(fieldname) {
  return fieldname.replace(/_/g, " ").replace(/(?:^|\s)\S/g, (match) => match.toUpperCase());
}
function mapFieldType(fieldtype) {
  switch (fieldtype) {
    case "Check":
      return "checkbox";
    case "Currency":
    case "Int":
    case "Float":
    case "Percent":
    case "Rating":
    case "Duration":
      return "number";
    case "Date":
      return "date";
    case "Datetime":
    case "Time":
      return "datetime";
    case "Text":
    case "Long Text":
    case "Small Text":
    case "Code":
    case "Markdown":
      return "textarea";
    case "Select":
      return "select";
    case "Link":
    case "Dynamic Link":
      return "text";
    default:
      return "text";
  }
}
function parseFieldOptions(fieldtype, options) {
  if (fieldtype !== "Select" || !options) {
    return void 0;
  }
  return options.split("\n").map((option) => option.trim()).filter(Boolean);
}
function isDisplayableField(field) {
  const hidden = Boolean(field.hidden);
  const fieldtype = field.fieldtype;
  return Boolean(field.fieldname) && !hidden && fieldtype !== void 0 && !LAYOUT_ONLY_FIELD_TYPES.has(fieldtype);
}
function normalizeField(field) {
  const type = mapFieldType(field.fieldtype);
  return {
    id: field.fieldname,
    label: field.label || humanizeFieldName(field.fieldname),
    description: field.description || field.field_description,
    placeholder: field.placeholder || field.field_placeholder,
    type,
    options: parseFieldOptions(field.fieldtype, field.options),
    required: Boolean(field.reqd),
    readOnly: Boolean(field.read_only)
  };
}
var definitionCache = /* @__PURE__ */ new WeakMap();
async function loadDocTypeDefinition(request, doctype) {
  let requestCache = definitionCache.get(request);
  if (!requestCache) {
    requestCache = /* @__PURE__ */ new Map();
    definitionCache.set(request, requestCache);
  }
  const cachedDefinition = requestCache.get(doctype);
  if (cachedDefinition) {
    return cachedDefinition;
  }
  const definitionPromise = (async () => {
    const response = await request({
      method: "GET",
      path: `/api/resource/DocType/${encodeURIComponent(doctype)}`,
      query: {
        fields: JSON.stringify(["name", "title_field", "fields"])
      }
    });
    const fields = (response.data.fields ?? []).filter(isDisplayableField).map(normalizeField);
    const titleField = response.data.title_field || fields[0]?.id || "name";
    return {
      name: doctype,
      titleField,
      fields
    };
  })();
  requestCache.set(doctype, definitionPromise);
  try {
    return await definitionPromise;
  } catch (error) {
    requestCache.delete(doctype);
    throw error;
  }
}
function resourcePath(apiPath, doctype, name) {
  const root = `${apiPath.replace(/\/$/, "")}/${encodeURIComponent(doctype)}`;
  return name ? `${root}/${encodeURIComponent(name)}` : root;
}
async function invalidateResourceListResolution(dispatch2) {
  await dispatch2.invalidateResolutionForStoreSelector("getResourceList");
}
function createActions(request, apiPath, nextRequestId) {
  const actions = {
    startRequest(requestKey, requestId) {
      return { type: "START_REQUEST", requestKey, requestId };
    },
    failRequest(requestKey, error, requestId) {
      return { type: "FAIL_REQUEST", requestKey, error, requestId };
    },
    receiveRecord(doctype, record, requestKey, requestId) {
      return { type: "RECEIVE_RECORD", doctype, record, requestKey, requestId };
    },
    receiveList(doctype, records, listKey, requestKey, requestId) {
      return {
        type: "RECEIVE_LIST",
        doctype,
        records,
        listKey,
        requestKey,
        requestId
      };
    },
    receiveDocTypeDefinition(doctype, docTypeDefinition, requestKey, requestId) {
      return {
        type: "RECEIVE_DOCTYPE_DEFINITION",
        doctype,
        docTypeDefinition,
        requestKey,
        requestId
      };
    },
    /**
     * Loads and stores normalized field metadata for a Frappe DocType.
     */
    fetchDocTypeDefinition(doctype) {
      return async ({ dispatch: dispatch2 }) => {
        const requestKey = `doctype:${doctype}`;
        const requestId = nextRequestId();
        dispatch2.startRequest(requestKey, requestId);
        try {
          const definition = await loadDocTypeDefinition(request, doctype);
          dispatch2.receiveDocTypeDefinition(
            doctype,
            definition,
            requestKey,
            requestId
          );
          return definition;
        } catch (error) {
          dispatch2.failRequest(requestKey, error, requestId);
          throw error;
        }
      };
    },
    /**
     * Thunk action to asynchronously fetch and store a single document resource by DocType and name.
     */
    fetchResource(doctype, name) {
      return async ({ dispatch: dispatch2 }) => {
        const requestKey = getResourceKey(doctype, name);
        const requestId = nextRequestId();
        dispatch2.startRequest(requestKey, requestId);
        try {
          const response = await request({
            method: "GET",
            path: resourcePath(apiPath, doctype, name)
          });
          dispatch2.receiveRecord(doctype, response.data, requestKey, requestId);
          return response.data;
        } catch (error) {
          dispatch2.failRequest(requestKey, error, requestId);
          throw error;
        }
      };
    },
    /**
     * Thunk action to asynchronously fetch and store a list of document resources matching a query.
     */
    fetchResourceList(doctype, query = {}) {
      return async ({ dispatch: dispatch2 }) => {
        const listKey = getListKey(doctype, query);
        const requestKey = `list:${listKey}`;
        const requestId = nextRequestId();
        dispatch2.startRequest(requestKey, requestId);
        try {
          const response = await request({
            method: "GET",
            path: resourcePath(apiPath, doctype),
            query: toFrappeQuery(query)
          });
          dispatch2.receiveList(
            doctype,
            response.data,
            listKey,
            requestKey,
            requestId
          );
          return response.data;
        } catch (error) {
          dispatch2.failRequest(requestKey, error, requestId);
          throw error;
        }
      };
    },
    /**
     * Thunk action to create (POST) or update (PUT) a Frappe document resource.
     * Automatically invalidates cached lists for that DocType upon success.
     */
    saveResource(doctype, values) {
      return async ({ dispatch: dispatch2 }) => {
        const name = values.name;
        const requestKey = `save:${doctype}:${name ?? "new"}`;
        const requestId = nextRequestId();
        dispatch2.startRequest(requestKey, requestId);
        try {
          const response = await request({
            method: name ? "PUT" : "POST",
            path: resourcePath(apiPath, doctype, name),
            data: values
          });
          dispatch2.receiveRecord(doctype, response.data, requestKey, requestId);
          await dispatch2.invalidateResourceLists(doctype);
          await invalidateResourceListResolution(dispatch2);
          return response.data;
        } catch (error) {
          dispatch2.failRequest(requestKey, error, requestId);
          throw error;
        }
      };
    },
    /**
     * Thunk action to permanently delete (DELETE) a Frappe document resource by name.
     * Automatically removes the record from store state and invalidates cached lists.
     */
    deleteResource(doctype, name) {
      return async ({ dispatch: dispatch2 }) => {
        const requestKey = `delete:${doctype}:${name}`;
        const requestId = nextRequestId();
        dispatch2.startRequest(requestKey, requestId);
        try {
          await request({
            method: "DELETE",
            path: resourcePath(apiPath, doctype, name)
          });
          dispatch2.removeResource(doctype, name, requestKey, requestId);
          await dispatch2.invalidateResourceLists(doctype);
          await invalidateResourceListResolution(dispatch2);
        } catch (error) {
          dispatch2.failRequest(requestKey, error, requestId);
          throw error;
        }
      };
    },
    removeResource(doctype, name, requestKey, requestId) {
      return { type: "REMOVE_RECORD", doctype, name, requestKey, requestId };
    },
    /**
     * Action creator to invalidate all cached list results for a specific DocType.
     */
    invalidateResourceLists(doctype) {
      return { type: "INVALIDATE_LISTS", doctype };
    }
  };
  return actions;
}
var DEFAULT_STATE = {
  records: {},
  lists: {},
  docTypeDefinitions: {},
  deleted: {},
  pending: {},
  errors: {},
  requestIds: {}
};
function isStaleRequest(state, action) {
  return action.requestId !== void 0 && state.requestIds[action.requestKey] !== action.requestId;
}
function reducer(state = DEFAULT_STATE, action) {
  switch (action.type) {
    case "START_REQUEST":
      return {
        ...state,
        pending: { ...state.pending, [action.requestKey]: true },
        errors: { ...state.errors, [action.requestKey]: void 0 },
        requestIds: {
          ...state.requestIds,
          [action.requestKey]: action.requestId
        }
      };
    case "FAIL_REQUEST":
      if (isStaleRequest(state, action)) return state;
      return {
        ...state,
        pending: { ...state.pending, [action.requestKey]: false },
        errors: { ...state.errors, [action.requestKey]: action.error }
      };
    case "RECEIVE_RECORD":
      if (isStaleRequest(state, action)) return state;
      return {
        ...state,
        records: {
          ...state.records,
          [action.doctype]: {
            ...state.records[action.doctype],
            [action.record.name]: action.record
          }
        },
        deleted: {
          ...state.deleted,
          [getResourceKey(action.doctype, action.record.name)]: false
        },
        pending: { ...state.pending, [action.requestKey]: false }
      };
    case "RECEIVE_LIST": {
      if (isStaleRequest(state, action)) return state;
      const doctypeRecords = { ...state.records[action.doctype] };
      const deleted = { ...state.deleted };
      for (const record of action.records) {
        doctypeRecords[record.name] = record;
        deleted[getResourceKey(action.doctype, record.name)] = false;
      }
      return {
        ...state,
        records: { ...state.records, [action.doctype]: doctypeRecords },
        deleted,
        lists: {
          ...state.lists,
          [action.listKey]: action.records.map(({ name }) => name)
        },
        pending: { ...state.pending, [action.requestKey]: false }
      };
    }
    case "RECEIVE_DOCTYPE_DEFINITION":
      if (isStaleRequest(state, action)) return state;
      return {
        ...state,
        docTypeDefinitions: {
          ...state.docTypeDefinitions,
          [action.doctype]: action.docTypeDefinition
        },
        pending: { ...state.pending, [action.requestKey]: false }
      };
    case "REMOVE_RECORD": {
      if (isStaleRequest(state, action)) return state;
      const doctypeRecords = { ...state.records[action.doctype] };
      delete doctypeRecords[action.name];
      return {
        ...state,
        records: { ...state.records, [action.doctype]: doctypeRecords },
        deleted: {
          ...state.deleted,
          [getResourceKey(action.doctype, action.name)]: true
        },
        lists: Object.fromEntries(
          Object.entries(state.lists).map(([key, names]) => [
            key,
            key.startsWith(`${action.doctype}:`) ? names.filter((name) => name !== action.name) : names
          ])
        ),
        pending: { ...state.pending, [action.requestKey]: false }
      };
    }
    case "INVALIDATE_LISTS":
      return {
        ...state,
        lists: Object.fromEntries(
          Object.entries(state.lists).filter(
            ([key]) => !key.startsWith(`${action.doctype}:`)
          )
        )
      };
    default:
      return state;
  }
}
function createResolvers(actions) {
  const getDocTypeDefinitionResolver = (doctype) => async ({ dispatch: dispatch2 }) => dispatch2.fetchDocTypeDefinition(doctype);
  getDocTypeDefinitionResolver.isFulfilled = (state, doctype) => state.docTypeDefinitions[doctype] !== void 0;
  const getResourceResolver = (doctype, name) => async ({ dispatch: dispatch2 }) => dispatch2.fetchResource(doctype, name);
  getResourceResolver.isFulfilled = (state, doctype, name) => state.records[doctype]?.[name] !== void 0 || state.deleted[getResourceKey(doctype, name)] === true;
  const getResourceListResolver = (doctype, query = {}) => async ({ dispatch: dispatch2 }) => dispatch2.fetchResourceList(doctype, query);
  getResourceListResolver.shouldInvalidate = (action, doctype) => action.type === "INVALIDATE_LISTS" && action.doctype === doctype;
  getResourceListResolver.isFulfilled = (state, doctype, query = {}) => state.lists[getListKey(doctype, query)] !== void 0;
  return {
    getDocTypeDefinition: getDocTypeDefinitionResolver,
    getResource: getResourceResolver,
    getResourceList: getResourceListResolver
  };
}
var selectors = {
  /**
   * Returns a single cached Frappe document resource by DocType and name identifier.
   */
  getResource(state, doctype, name) {
    return state.records[doctype]?.[name];
  },
  /**
   * Returns an array of cached Frappe resources matching a specific list query.
   */
  getResourceList(state, doctype, query = {}) {
    const names = state.lists[getListKey(doctype, query)];
    return names?.map((name) => state.records[doctype]?.[name]).filter((record) => Boolean(record));
  },
  /**
   * Returns normalized metadata (`fields`, `titleField`) for a given DocType if loaded.
   */
  getDocTypeDefinition(state, doctype) {
    return state.docTypeDefinitions[doctype];
  },
  /**
   * Checks whether an asynchronous fetch or mutation request is currently in progress.
   */
  isRequestPending(state, requestKey) {
    return state.pending[requestKey] ?? false;
  },
  /**
   * Retrieves any error object thrown during an asynchronous request.
   */
  getRequestError(state, requestKey) {
    return state.errors[requestKey];
  }
};
function createFrappeDataStore(config = {}) {
  const storeName = config.storeName ?? "frappe/resources";
  const apiPath = config.apiPath ?? "/api/resource";
  const request = config.request ?? createFrappeRequest(config);
  let nextRequestId = 0;
  const actions = createActions(request, apiPath, () => ++nextRequestId);
  const resolvers = createResolvers(actions);
  return (0, import_data.createReduxStore)(storeName, {
    reducer,
    actions,
    selectors,
    resolvers
  });
}
function registerFrappeDataStore(config = {}) {
  const store = createFrappeDataStore(config);
  (0, import_data.register)(store);
  return store;
}

// packages/init/build-module/index.mjs
var import_i18n = __toESM(require_i18n(), 1);
import { store as bootStore } from "@wordpress/boot";

// node_modules/@wordpress/icons/build-module/library/check.mjs
var import_primitives = __toESM(require_primitives(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var check_default = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.Path, { d: "M16.5 7.5 10 13.9l-2.5-2.4-1 1 3.5 3.6 7.5-7.6z" }) });

// node_modules/@wordpress/icons/build-module/library/currency-dollar.mjs
var import_primitives2 = __toESM(require_primitives(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var currency_dollar_default = /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_primitives2.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_primitives2.Path, { d: "M10.7 9.6c.3-.2.8-.4 1.3-.4s1 .2 1.3.4c.3.2.4.5.4.6 0 .4.3.8.8.8s.8-.3.8-.8c0-.8-.5-1.4-1.1-1.9-.4-.3-.9-.5-1.4-.6v-.3c0-.4-.3-.8-.8-.8s-.8.3-.8.8v.3c-.5 0-1 .3-1.4.6-.6.4-1.1 1.1-1.1 1.9s.5 1.4 1.1 1.9c.6.4 1.4.6 2.2.6h.2c.5 0 .9.2 1.1.4.3.2.4.5.4.6s0 .4-.4.6c-.3.2-.8.4-1.3.4s-1-.2-1.3-.4c-.3-.2-.4-.5-.4-.6 0-.4-.3-.8-.8-.8s-.8.3-.8.8c0 .8.5 1.4 1.1 1.9.4.3.9.5 1.4.6v.3c0 .4.3.8.8.8s.8-.3.8-.8v-.3c.5 0 1-.3 1.4-.6.6-.4 1.1-1.1 1.1-1.9s-.5-1.4-1.1-1.9c-.5-.4-1.2-.6-1.9-.6H12c-.6 0-1-.2-1.3-.4-.3-.2-.4-.5-.4-.6s0-.4.4-.6ZM12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm0 14.5c-3.6 0-6.5-2.9-6.5-6.5S8.4 5.5 12 5.5s6.5 2.9 6.5 6.5-2.9 6.5-6.5 6.5Z" }) });

// node_modules/@wordpress/icons/build-module/library/pencil.mjs
var import_primitives3 = __toESM(require_primitives(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var pencil_default = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_primitives3.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_primitives3.Path, { d: "m19 7-3-3-8.5 8.5-1 4 4-1L19 7Zm-7 11.5H5V20h7v-1.5Z" }) });

// node_modules/@wordpress/icons/build-module/library/people.mjs
var import_primitives4 = __toESM(require_primitives(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var people_default = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_primitives4.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(import_primitives4.Path, { fillRule: "evenodd", d: "M15.5 9.5a1 1 0 100-2 1 1 0 000 2zm0 1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-2.25 6v-2a2.75 2.75 0 00-2.75-2.75h-4A2.75 2.75 0 003.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0120.25 15zM9.5 8.5a1 1 0 11-2 0 1 1 0 012 0zm1.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" }) });

// node_modules/@wordpress/icons/build-module/library/post-author.mjs
var import_primitives5 = __toESM(require_primitives(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var post_author_default = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_primitives5.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_primitives5.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M10 4.5a1 1 0 11-2 0 1 1 0 012 0zm1.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm2.25 7.5v-1A2.75 2.75 0 0011 8.25H7A2.75 2.75 0 004.25 11v1h1.5v-1c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v1h1.5zM4 20h9v-1.5H4V20zm16-4H4v-1.5h16V16z" }) });

// node_modules/@wordpress/icons/build-module/library/settings.mjs
var import_primitives6 = __toESM(require_primitives(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var settings_default = /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_primitives6.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: [
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_primitives6.Path, { d: "m19 7.5h-7.628c-.3089-.87389-1.1423-1.5-2.122-1.5-.97966 0-1.81309.62611-2.12197 1.5h-2.12803v1.5h2.12803c.30888.87389 1.14231 1.5 2.12197 1.5.9797 0 1.8131-.62611 2.122-1.5h7.628z" }),
  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_primitives6.Path, { d: "m19 15h-2.128c-.3089-.8739-1.1423-1.5-2.122-1.5s-1.8131.6261-2.122 1.5h-7.628v1.5h7.628c.3089.8739 1.1423 1.5 2.122 1.5s1.8131-.6261 2.122-1.5h2.128z" })
] });

// node_modules/@wordpress/icons/build-module/library/store.mjs
var import_primitives7 = __toESM(require_primitives(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var store_default = /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_primitives7.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_primitives7.Path, { fillRule: "evenodd", clipRule: "evenodd", d: "M19.75 11H21V8.667L19.875 4H4.125L3 8.667V11h1.25v8.75h15.5V11zm-1.5 0H5.75v7.25H10V13h4v5.25h4.25V11zm-5.5-5.5h2.067l.486 3.24.028.76H12.75v-4zm-3.567 0h2.067v4H8.669l.028-.76.486-3.24zm7.615 3.1l-.464-3.1h2.36l.806 3.345V9.5h-2.668l-.034-.9zM7.666 5.5h-2.36L4.5 8.845V9.5h2.668l.034-.9.464-3.1z" }) });

// packages/init/build-module/index.mjs
if (typeof document !== "undefined" && true && !document.head.querySelector("style[data-wp-hash='347291548b']")) {
  const style = document.createElement("style");
  style.setAttribute("data-wp-hash", "347291548b");
  style.appendChild(document.createTextNode(".boot-sidebar__scrollable{overflow-x:hidden}.boot-site-hub__title{min-width:0;overflow:hidden}.boot-site-hub__title .components-external-link__contents{max-width:none;min-width:0;width:100%}@media (min-width:782px){.boot-layout__sidebar:not(.is-mobile){width:300px}.boot-layout__surfaces{margin:16px 16px 16px 0}}"));
  document.head.appendChild(style);
}
function registerStore() {
  if (window.wpuiFrappeStore) {
    return;
  }
  window.wpuiFrappeStore = registerFrappeDataStore({
    storeName: "wpui-frappe/resources",
    baseUrl: "/wp-json/wpui-frappe/v1/proxy",
    apiPath: "/api/resource",
    credentials: "same-origin",
    headers: () => {
      const nonce = window.wpApiSettings?.nonce;
      return nonce ? { "X-WP-Nonce": nonce } : {};
    }
  });
}
async function init() {
  registerStore();
  (0, import_data3.dispatch)(bootStore).registerMenuItem("leads", {
    id: "leads",
    label: (0, import_i18n.__)("Leads", "wpui-frappe-plugin-starter"),
    to: "/",
    icon: people_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("deals", {
    id: "deals",
    label: (0, import_i18n.__)("Deals", "wpui-frappe-plugin-starter"),
    to: "/deals",
    icon: currency_dollar_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("contacts", {
    id: "contacts",
    label: (0, import_i18n.__)("Contacts", "wpui-frappe-plugin-starter"),
    to: "/contacts",
    icon: post_author_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("organizations", {
    id: "organizations",
    label: (0, import_i18n.__)("Organizations", "wpui-frappe-plugin-starter"),
    to: "/organizations",
    icon: store_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("notes", {
    id: "notes",
    label: (0, import_i18n.__)("Notes", "wpui-frappe-plugin-starter"),
    to: "/notes",
    icon: pencil_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("tasks", {
    id: "tasks",
    label: (0, import_i18n.__)("Tasks", "wpui-frappe-plugin-starter"),
    to: "/tasks",
    icon: check_default
  });
  (0, import_data3.dispatch)(bootStore).registerMenuItem("settings", {
    id: "settings",
    label: (0, import_i18n.__)("Settings", "wpui-frappe-plugin-starter"),
    to: "/settings",
    icon: settings_default
  });
}
export {
  init
};
//# sourceMappingURL=index.js.map
