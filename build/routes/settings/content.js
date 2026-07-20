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

// package-external:@wordpress/i18n
var require_i18n = __commonJS({
  "package-external:@wordpress/i18n"(exports, module) {
    module.exports = window.wp.i18n;
  }
});

// package-external:@wordpress/components
var require_components = __commonJS({
  "package-external:@wordpress/components"(exports, module) {
    module.exports = window.wp.components;
  }
});

// package-external:@wordpress/element
var require_element = __commonJS({
  "package-external:@wordpress/element"(exports, module) {
    module.exports = window.wp.element;
  }
});

// vendor-external:react/jsx-runtime
var require_jsx_runtime = __commonJS({
  "vendor-external:react/jsx-runtime"(exports, module) {
    module.exports = window.ReactJSXRuntime;
  }
});

// package-external:@wordpress/primitives
var require_primitives = __commonJS({
  "package-external:@wordpress/primitives"(exports, module) {
    module.exports = window.wp.primitives;
  }
});

// package-external:@wordpress/data
var require_data = __commonJS({
  "package-external:@wordpress/data"(exports, module) {
    module.exports = window.wp.data;
  }
});

// packages/common/build-module/auth.mjs
var import_i18n = __toESM(require_i18n(), 1);
var REST_BASE = "/wp-json/wpui-frappe/v1";
var CONNECTION_TIMEOUT_MS = 2e4;
function getRuntime() {
  const browser2 = window;
  if (!browser2.wpuiFrappeRuntime) {
    const initial = browser2.wpuiFrappeSettings ?? {
      siteUrl: "",
      hasToken: false,
      hasSession: false,
      isConfigLocked: false
    };
    browser2.wpuiFrappeRuntime = {
      connection: initial,
      status: initial.hasToken || initial.hasSession ? "connected" : "disconnected"
    };
  }
  return browser2.wpuiFrappeRuntime;
}
function resetConnectionStatus() {
  const runtime = getRuntime();
  runtime.status = "unknown";
  runtime.validationRequest = void 0;
}
function getWpNonceHeader() {
  const nonce = window.wpApiSettings?.nonce;
  return nonce ? { "X-WP-Nonce": nonce } : {};
}
async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    CONNECTION_TIMEOUT_MS
  );
  try {
    return await fetch(`${REST_BASE}${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        ...getWpNonceHeader(),
        ...options.body ? { "Content-Type": "application/json" } : {},
        ...options.headers || {}
      },
      signal: controller.signal
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        (0, import_i18n.__)(
          "The connection request timed out.",
          "wpui-frappe-plugin-starter"
        )
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
async function responseError(response) {
  const body = await response.json().catch(() => ({}));
  return new Error(
    body.message || (0, import_i18n.__)("The request failed.", "wpui-frappe-plugin-starter")
  );
}
function normalizeFrappeSiteUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(
      (0, import_i18n.__)(
        "Enter a valid Frappe site URL, including http:// or https://.",
        "wpui-frappe-plugin-starter"
      )
    );
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(
      (0, import_i18n.__)(
        "The Frappe site URL must use http:// or https://.",
        "wpui-frappe-plugin-starter"
      )
    );
  }
  if (url.username || url.password) {
    throw new Error(
      (0, import_i18n.__)(
        "Do not include credentials in the Frappe site URL.",
        "wpui-frappe-plugin-starter"
      )
    );
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      (0, import_i18n.__)(
        "Enter the Frappe site origin without a path, query, or hash.",
        "wpui-frappe-plugin-starter"
      )
    );
  }
  return url.origin;
}
function getFrappeConnection() {
  return getRuntime().connection;
}
async function loadFrappeConnection() {
  const response = await request("/connection");
  if (!response.ok) {
    throw await responseError(response);
  }
  getRuntime().connection = await response.json();
  resetConnectionStatus();
  return getRuntime().connection;
}
async function saveFrappeConnection(siteUrl, apiKey, apiSecret) {
  const response = await request("/connection", {
    method: "POST",
    body: JSON.stringify({
      siteUrl: normalizeFrappeSiteUrl(siteUrl),
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim()
    })
  });
  if (!response.ok) {
    throw await responseError(response);
  }
  getRuntime().connection = await response.json();
  resetConnectionStatus();
  return getRuntime().connection;
}
async function loginWithPassword(siteUrl, username, password, isConfigLocked = false) {
  if (!username.trim() || !password) {
    throw new Error(
      (0, import_i18n.__)(
        "Both username and password are required.",
        "wpui-frappe-plugin-starter"
      )
    );
  }
  if (!isConfigLocked) {
    await saveFrappeConnection(siteUrl, "", "");
  }
  const response = await request("/login", {
    method: "POST",
    body: JSON.stringify({ username: username.trim(), password })
  });
  if (!response.ok) {
    throw await responseError(response);
  }
  getRuntime().connection = await response.json();
  resetConnectionStatus();
  return getRuntime().connection;
}
async function logoutPasswordSession() {
  const response = await request("/logout", {
    method: "POST"
  });
  if (!response.ok) {
    throw await responseError(response);
  }
  getRuntime().connection = await response.json();
  resetConnectionStatus();
  return getRuntime().connection;
}
async function clearFrappeConnection() {
  await logoutPasswordSession();
  const response = await request("/connection", {
    method: "POST",
    body: JSON.stringify({
      siteUrl: getRuntime().connection.siteUrl,
      clearToken: true
    })
  });
  if (!response.ok) {
    throw await responseError(response);
  }
  getRuntime().connection = await response.json();
  resetConnectionStatus();
}
function getFrappeMessage(body) {
  if (typeof body.message === "string") {
    return body.message;
  }
  if (typeof body.exception === "string") {
    return body.exception;
  }
  return (0, import_i18n.__)("Frappe rejected the request.", "wpui-frappe-plugin-starter");
}
async function validateFrappeConnection() {
  const runtime = getRuntime();
  if (runtime.status === "connected") {
    return (0, import_i18n.__)("Connected", "wpui-frappe-plugin-starter");
  }
  if (runtime.validationRequest) {
    return runtime.validationRequest;
  }
  runtime.status = "checking";
  runtime.validationRequest = (async () => {
    try {
      if (!runtime.connection.siteUrl) {
        await loadFrappeConnection();
      }
      const response = await request(
        "/proxy/api/method/frappe.auth.get_logged_user"
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body.exc_type) {
        throw new Error(getFrappeMessage(body));
      }
      if (typeof body.message !== "string" || body.message === "Guest") {
        throw new Error(
          (0, import_i18n.__)(
            "Connect with a valid Frappe login or API token to continue.",
            "wpui-frappe-plugin-starter"
          )
        );
      }
      runtime.status = "connected";
      return body.message;
    } catch (error) {
      runtime.status = "disconnected";
      throw error;
    } finally {
      runtime.validationRequest = void 0;
    }
  })();
  return runtime.validationRequest;
}

// packages/common/build-module/store.mjs
var browser = window;
if (!browser.wpuiFrappeStore) {
  throw new Error("The Frappe data store was not initialized.");
}
var frappeStore = browser.wpuiFrappeStore;

// packages/common/build-module/components/ResourceEditor.mjs
var import_components = __toESM(require_components(), 1);

// node_modules/@wordpress/icons/build-module/icon/index.mjs
var import_element = __toESM(require_element(), 1);
var icon_default = (0, import_element.forwardRef)(
  ({ icon, size = 24, ...props }, ref) => {
    return (0, import_element.cloneElement)(icon, {
      width: size,
      height: size,
      ...props,
      ref
    });
  }
);

// node_modules/@wordpress/icons/build-module/library/wordpress.mjs
var import_primitives = __toESM(require_primitives(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var wordpress_default = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.SVG, { xmlns: "http://www.w3.org/2000/svg", viewBox: "-2 -2 24 24", fill: "currentColor", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.Path, { d: "M20 10c0-5.51-4.49-10-10-10C4.48 0 0 4.49 0 10c0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zM7.78 15.37L4.37 6.22c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01C4.12 2.69 6.87 1.11 10 1.11c2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zM17.41 10c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zM6.1 18.09C3.12 16.65 1.11 13.53 1.11 10c0-1.3.23-2.48.72-3.59C3.25 10.3 4.67 14.2 6.1 18.09zm4.03-6.63l2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.1z" }) });

// packages/common/build-module/components/ResourceEditor.mjs
var import_element2 = __toESM(require_element(), 1);
var import_i18n2 = __toESM(require_i18n(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);

// packages/common/build-module/components/ConnectionView.mjs
var import_components2 = __toESM(require_components(), 1);
var import_element3 = __toESM(require_element(), 1);
var import_i18n3 = __toESM(require_i18n(), 1);
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
function ConnectionView({
  isChecking = false,
  onAuthenticated,
  onDisconnected
}) {
  const initialConnection = getFrappeConnection();
  const [siteUrl, setSiteUrl] = (0, import_element3.useState)(initialConnection.siteUrl);
  const [mode, setMode] = (0, import_element3.useState)(
    initialConnection.hasToken && !initialConnection.hasSession ? "token" : "password"
  );
  const [username, setUsername] = (0, import_element3.useState)("");
  const [password, setPassword] = (0, import_element3.useState)("");
  const [apiKey, setApiKey] = (0, import_element3.useState)("");
  const [apiSecret, setApiSecret] = (0, import_element3.useState)("");
  const [hasToken, setHasToken] = (0, import_element3.useState)(initialConnection.hasToken);
  const [hasSession, setHasSession] = (0, import_element3.useState)(
    initialConnection.hasSession
  );
  const [isConfigLocked] = (0, import_element3.useState)(initialConnection.isConfigLocked);
  const [isBusy, setBusy] = (0, import_element3.useState)(false);
  const [message, setMessage] = (0, import_element3.useState)();
  async function connect() {
    setBusy(true);
    setMessage(void 0);
    try {
      if (mode === "password") {
        const settings = await loginWithPassword(
          siteUrl,
          username,
          password,
          isConfigLocked
        );
        setHasSession(settings.hasSession);
        setPassword("");
      } else if (!isConfigLocked) {
        const settings = await saveFrappeConnection(
          siteUrl,
          apiKey,
          apiSecret
        );
        setHasToken(settings.hasToken);
      }
      await validateFrappeConnection();
      setApiKey("");
      setApiSecret("");
      await onAuthenticated?.();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    setMessage(void 0);
    try {
      if (isConfigLocked) {
        await logoutPasswordSession();
      } else {
        await clearFrappeConnection();
      }
      setHasToken(false);
      setHasSession(false);
      onDisconnected?.();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setBusy(false);
    }
  }
  const checking = isChecking;
  let credentialFields = null;
  if (mode === "password") {
    credentialFields = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_components2.TextControl,
        {
          label: (0, import_i18n3.__)("Username", "wpui-frappe-plugin-starter"),
          value: username,
          onChange: setUsername,
          required: true,
          __next40pxDefaultSize: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_components2.TextControl,
        {
          label: (0, import_i18n3.__)("Password", "wpui-frappe-plugin-starter"),
          type: "password",
          value: password,
          onChange: setPassword,
          required: true,
          __next40pxDefaultSize: true
        }
      )
    ] });
  } else if (!isConfigLocked) {
    credentialFields = /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_components2.TextControl,
        {
          label: (0, import_i18n3.__)("API key", "wpui-frappe-plugin-starter"),
          value: apiKey,
          onChange: setApiKey,
          required: !hasToken,
          __next40pxDefaultSize: true
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        import_components2.TextControl,
        {
          label: (0, import_i18n3.__)("API secret", "wpui-frappe-plugin-starter"),
          type: "password",
          value: apiSecret,
          onChange: setApiSecret,
          required: !hasToken,
          help: hasToken ? (0, import_i18n3.__)(
            "Leave blank to keep the saved token.",
            "wpui-frappe-plugin-starter"
          ) : void 0,
          __next40pxDefaultSize: true
        }
      )
    ] });
  }
  let submitLabel = (0, import_i18n3.__)(
    "Save and connect",
    "wpui-frappe-plugin-starter"
  );
  if (mode === "password") {
    submitLabel = hasSession ? (0, import_i18n3.__)("Sign in again", "wpui-frappe-plugin-starter") : (0, import_i18n3.__)("Sign in", "wpui-frappe-plugin-starter");
  } else if (hasToken || isConfigLocked) {
    submitLabel = (0, import_i18n3.__)("Verify connection", "wpui-frappe-plugin-starter");
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "frappe-connection-screen", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_components2.Card, { className: "frappe-connection-card", elevation: 2, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    import_components2.CardBody,
    {
      className: "frappe-connection-card-body",
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "frappe-connection-brand", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(icon_default, { icon: wordpress_default, size: 40 }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: (0, import_i18n3.__)(
              "WP Frappe Data Store",
              "wpui-frappe-plugin-starter"
            ) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: (0, import_i18n3.__)(
              "WordPress Plugin Integration",
              "wpui-frappe-plugin-starter"
            ) })
          ] })
        ] }),
        checking ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "frappe-connection-checking", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_components2.Spinner, {}),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: (0, import_i18n3.__)(
            "Checking the Frappe CRM connection\u2026",
            "wpui-frappe-plugin-starter"
          ) })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h1", { children: (0, import_i18n3.__)(
            "Connect to Frappe CRM",
            "wpui-frappe-plugin-starter"
          ) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "frappe-modal-intro", children: (0, import_i18n3.__)(
            "Choose a Frappe login or API token. Credentials and sessions remain server-side.",
            "wpui-frappe-plugin-starter"
          ) }),
          message && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_components2.Notice, { status: "error", isDismissible: false, children: message }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            "form",
            {
              onSubmit: (event) => {
                event.preventDefault();
                void connect();
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  import_components2.TextControl,
                  {
                    label: (0, import_i18n3.__)(
                      "Frappe site URL",
                      "wpui-frappe-plugin-starter"
                    ),
                    type: "url",
                    value: siteUrl,
                    onChange: setSiteUrl,
                    disabled: isConfigLocked,
                    help: (0, import_i18n3.__)(
                      "Use the HTTPS origin only, without a path.",
                      "wpui-frappe-plugin-starter"
                    ),
                    required: true,
                    __next40pxDefaultSize: true
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                  import_components2.__experimentalToggleGroupControl,
                  {
                    label: (0, import_i18n3.__)(
                      "Authentication method",
                      "wpui-frappe-plugin-starter"
                    ),
                    hideLabelFromVision: true,
                    value: mode,
                    onChange: (value) => setMode(value),
                    isBlock: true,
                    __next40pxDefaultSize: true,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        import_components2.__experimentalToggleGroupControlOption,
                        {
                          value: "password",
                          label: (0, import_i18n3.__)(
                            "Login",
                            "wpui-frappe-plugin-starter"
                          )
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                        import_components2.__experimentalToggleGroupControlOption,
                        {
                          value: "token",
                          label: (0, import_i18n3.__)(
                            "API token",
                            "wpui-frappe-plugin-starter"
                          )
                        }
                      )
                    ]
                  }
                ),
                credentialFields,
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "frappe-modal-actions", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    import_components2.Button,
                    {
                      variant: "primary",
                      type: "submit",
                      isBusy,
                      children: submitLabel
                    }
                  ),
                  (hasToken || hasSession) && (!isConfigLocked || hasSession) && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    import_components2.Button,
                    {
                      variant: "tertiary",
                      isDestructive: true,
                      onClick: () => void disconnect(),
                      disabled: isBusy,
                      children: (0, import_i18n3.__)(
                        "Disconnect",
                        "wpui-frappe-plugin-starter"
                      )
                    }
                  )
                ] })
              ]
            }
          )
        ] })
      ]
    }
  ) }) });
}

// packages/common/build-module/components/ResourceView.mjs
var import_components3 = __toESM(require_components(), 1);
var import_element4 = __toESM(require_element(), 1);
var import_i18n4 = __toESM(require_i18n(), 1);

// node_modules/@lubusin/wp-frappe-data-store/dist/index.js
var import_data = __toESM(require_data(), 1);
var import_data2 = __toESM(require_data(), 1);

// packages/common/build-module/components/ResourceView.mjs
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
if (typeof document !== "undefined" && true && !document.head.querySelector("style[data-wp-hash='4ea92bf70c']")) {
  const style = document.createElement("style");
  style.setAttribute("data-wp-hash", "4ea92bf70c");
  style.appendChild(document.createTextNode(".frappe-page{height:100%;min-height:0;width:100%}.frappe-page-loading{align-items:center;display:flex;flex:1;justify-content:center}.frappe-notice{margin:var(--wpds-dimension-gap-md,12px) var(--wpds-dimension-padding-2xl,24px)}.frappe-data-card{background:var(--wpds-color-background-surface-neutral-strong,#fff);display:flex;flex:1 1 0;margin:0;min-height:0;overflow:hidden;position:relative;width:100%}.frappe-data-card>.dataviews-wrapper{display:flex;flex:1 1 0;flex-direction:column;min-height:0;width:100%}.frappe-data-card .dataviews-layout__container{flex:1 1 0;min-height:0;overflow:auto}.frappe-data-card .dataviews-footer{flex:0 0 auto}.frappe-empty-state{align-items:center;display:flex;flex-direction:column;justify-content:center;min-height:320px;padding:32px;text-align:center}.frappe-empty-icon{background:var(--wpds-color-background-surface-neutral-weak,#f4f4f4);border-radius:50%;color:var(--wpds-color-foreground-interactive-brand,var(--wp-admin-theme-color,#3858e9));display:grid;height:48px;place-items:center;width:48px}.frappe-empty-state h2{font-size:16px;margin:16px 0 5px}.frappe-empty-state p{color:var(--wpds-color-foreground-content-neutral-weak,#707070);margin:0 0 16px}.frappe-connection-screen{background:var(--wpds-color-background-surface-neutral-weak,#f4f4f4);box-sizing:border-box;display:grid;height:100%;min-height:0;padding:var(--wpds-dimension-padding-2xl,24px);place-items:center}.frappe-connection-card{width:min(100%,520px)}.frappe-connection-card-body{padding:40px}.frappe-connection-brand{align-items:center;display:flex;gap:12px;margin-bottom:36px}.frappe-connection-brand svg{color:var(--wpds-color-foreground-interactive-brand,var(--wp-admin-theme-color,#3858e9));fill:currentcolor}.frappe-connection-brand div{display:flex;flex-direction:column;line-height:1.3}.frappe-connection-brand strong{font-size:18px}.frappe-connection-brand span{color:var(--wpds-color-foreground-content-neutral-weak,#707070);font-size:12px}.frappe-connection-card h1{font-size:24px;font-weight:600;letter-spacing:-.02em;margin:0 0 12px}.frappe-connection-checking{align-items:center;color:var(--wpds-color-foreground-content-neutral-weak,#707070);display:flex;gap:10px;justify-content:center;min-height:180px}.frappe-connection-checking p{margin:0}.frappe-modal-intro{color:var(--wpds-color-foreground-content-neutral-weak,#707070);line-height:1.55;margin:0 0 18px;max-width:560px}.frappe-modal-intro code{background:var(--wpds-color-background-surface-neutral-weak,#f4f4f4);border-radius:3px;padding:2px 5px}.frappe-auth-switcher{display:flex;gap:8px;margin:20px 0}.frappe-connection-modal form,.frappe-resource-form{display:flex;flex-direction:column;gap:20px}.frappe-resource-form{max-width:100%;min-width:0;overflow-x:clip;width:min(560px,100vw - 96px)}.frappe-modal-actions{align-items:center;border-top:var(--wpds-border-width-xs,1px) solid var(--wpds-color-stroke-surface-neutral-weak,#f0f0f0);display:flex;gap:8px;padding-top:18px}@media (max-width:600px){.frappe-connection-card-body{padding:28px 24px}.frappe-resource-form{width:min(420px,100vw - 64px)}}"));
  document.head.appendChild(style);
}

// routes/settings/stage.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime());
var stage = () => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ConnectionView, {});
export {
  stage
};
