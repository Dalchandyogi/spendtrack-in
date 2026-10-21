(() => {
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzHsKOwE4K2nZpOaOEeTHAfzNYM5Kw1HR6OotLLCAOVq7DZ7sL_NXW5RWkvRajQI3A/exec";
  const RESPONSE_TYPE = "spendtrack-waitlist-response";
  const RESPONSE_OUTCOMES = new Set(["success", "duplicate", "invalid", "failure"]);
  const RESPONSE_TIMEOUT_MS = 15000;
  const LOG_PREFIX = "[SpendTrack Signup]";
  const SAFE_ENDPOINT = WEB_APP_URL.replace(/\/macros\/s\/[^/]+\/exec(?:\?.*)?$/, "/macros/s/[redacted]/exec");
  const isAppsScriptOrigin = (origin) => {
    try {
      const url = new URL(origin);
      return url.protocol === "https:" && (
        url.hostname === "script.google.com" ||
        url.hostname === "script.googleusercontent.com" ||
        url.hostname.endsWith("-script.googleusercontent.com")
      );
    } catch {
      return false;
    }
  };
  const form = document.querySelector("#waitlist-form");
  const emailInput = document.querySelector("#email");
  const message = document.querySelector("#form-message");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !emailInput || !message || !submitButton) return;

  const originalButtonHtml = submitButton.innerHTML;
  let requestInProgress = false;
  let activeRequestId = null;

  const log = (level, event, requestId, details = {}) => {
    const writer = console[level] || console.log;
    writer.call(console, `${LOG_PREFIX} ${event}`, { requestId, ...details });
  };

  const logException = (event, requestId, error) => {
    log("error", event, requestId, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  };

  const newRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  const safeMessage = (value) => String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]")
    .slice(0, 160);

  const showMessage = (text, state) => {
    message.textContent = text;
    message.classList.remove("success", "error");
    if (state) message.classList.add(state);
  };

  const setPending = (pending) => {
    requestInProgress = pending;
    submitButton.disabled = pending;
    submitButton.setAttribute("aria-busy", String(pending));
    emailInput.disabled = pending;
    if (pending) submitButton.textContent = "Joining…";
    else submitButton.innerHTML = originalButtonHtml;
  };

  const sendSignup = (email, requestId) => new Promise((resolve, reject) => {
    const frameName = `spendtrack-waitlist-${requestId}`;
    const frame = document.createElement("iframe");
    frame.name = frameName;
    frame.title = "Signup response";
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.display = "none";

    const requestForm = document.createElement("form");
    requestForm.method = "POST";
    requestForm.action = WEB_APP_URL;
    requestForm.target = frameName;
    requestForm.enctype = "application/x-www-form-urlencoded";
    requestForm.acceptCharset = "UTF-8";
    requestForm.style.display = "none";

    const addField = (name, value) => {
      const field = document.createElement("input");
      field.type = "hidden";
      field.name = name;
      field.value = value;
      requestForm.appendChild(field);
    };
    addField("email", email);
    addField("response", "iframe");
    addField("requestId", requestId);

    let settled = false;
    let timeoutId;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      frame.removeEventListener("error", onFrameError);
      window.clearTimeout(timeoutId);
      requestForm.remove();
      frame.remove();
    };
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(result);
    };
    const onMessage = (event) => {
      if (!isAppsScriptOrigin(event.origin)) return;
      const result = event.data;
      if (!result || result.type !== RESPONSE_TYPE || result.requestId !== requestId) {
        log("warn", "Apps Script frame sent a message that did not match the expected confirmation.", requestId, {
          origin: event.origin,
          sourceIsSubmissionFrame: event.source === frame.contentWindow,
          receivedType: result && typeof result.type === "string" ? result.type : typeof result,
          requestIdMatched: Boolean(result && result.requestId === requestId),
        });
        return;
      }
      log("log", "Confirmation received from Apps Script origin; HTTP status and response headers are inaccessible cross-origin.", requestId, {
        origin: event.origin,
        sourceIsSubmissionFrame: event.source === frame.contentWindow,
        responseRequestId: result && result.requestId,
        success: typeof result.success === "boolean" ? result.success : "invalid",
        outcome: result && result.outcome,
        message: safeMessage(result.message),
        responseContentType: "not accessible",
        jsonParsed: false,
      });
      if (typeof result.success !== "boolean" || !RESPONSE_OUTCOMES.has(result.outcome)) {
        finish(new Error("The signup response was invalid."));
        return;
      }
      finish(null, result);
    };
    const onFrameError = () => {
      const error = new Error("The signup response frame failed to load.");
      logException("Response frame error", requestId, error);
      finish(error);
    };

    window.addEventListener("message", onMessage);
    frame.addEventListener("error", onFrameError, { once: true });
    timeoutId = window.setTimeout(() => {
      const error = new Error("No matching confirmation arrived before the timeout.");
      log("warn", "Confirmation timed out; request outcome is unknown.", requestId, { timeoutMs: RESPONSE_TIMEOUT_MS });
      finish(error);
    }, RESPONSE_TIMEOUT_MS);
    document.body.append(frame, requestForm);

    try {
      log("log", "POST started", requestId);
      requestForm.submit();
    } catch (error) {
      logException("Request submission threw", requestId, error);
      finish(error);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const requestId = newRequestId();
    log("log", "Form submit event fired", requestId);
    if (requestInProgress) {
      log("warn", "Submission ignored because another request is in progress.", activeRequestId);
      return;
    }

    const email = emailInput.value.trim();
    emailInput.value = email;
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && emailInput.checkValidity();
    log(validEmail ? "log" : "warn", "Client-side validation completed", requestId, { valid: validEmail });
    if (!validEmail) {
      showMessage("Please enter a valid email address.", "error");
      emailInput.focus();
      return;
    }

    activeRequestId = requestId;
    showMessage("Adding you to the list…");
    try {
      setPending(true);
      log("log", "Loading state started", requestId, { endpoint: SAFE_ENDPOINT, method: "POST", contentType: "application/x-www-form-urlencoded" });
      const result = await sendSignup(email, requestId);
      const serverMessage = typeof result.message === "string" ? result.message.trim() : "";
      const duplicate = result.outcome === "duplicate" || result.duplicate === true || result.alreadyRegistered === true ||
        /already|duplicate|registered|exists/i.test(serverMessage);

      if (duplicate) {
        log("log", "Outcome: confirmed duplicate", requestId, { success: result.success, outcome: result.outcome, message: safeMessage(serverMessage) });
        showMessage("You're already on the SpendTrack early-access list!", "success");
      } else if (result.outcome === "success" && result.success === true) {
        log("log", "Outcome: confirmed success", requestId, { success: true, outcome: result.outcome, message: safeMessage(serverMessage) });
        showMessage("You're on the list! We'll email you when SpendTrack launches.", "success");
      } else {
        log("warn", "Outcome: confirmed backend failure", requestId, { success: false, outcome: result.outcome, message: safeMessage(serverMessage) });
        showMessage(serverMessage || "We couldn't add you to the list. Please try again.", "error");
      }
    } catch (error) {
      logException("Outcome: unknown; confirmation unavailable", requestId, error);
      showMessage("We couldn't confirm your signup. Check before resubmitting; if it was saved, duplicate signups are ignored.", "error");
    } finally {
      setPending(false);
      log("log", "Loading state stopped", requestId);
      activeRequestId = null;
    }
  });
})();
