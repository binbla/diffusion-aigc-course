/* AI reading companion: client-side, BYOK, no server. */
(function () {
  "use strict";

  var CONFIG_KEY = "diffusion-aigc-companion-config-v1";
  var MAX_CONTEXT_CHARS = 12000;
  var PRESETS = {
    openai: { base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    deepseek: { base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    openrouter: { base: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
    ollama: { base: "http://localhost:11434/v1", model: "llama3.1" },
    lmstudio: { base: "http://localhost:1234/v1", model: "local-model" },
    custom: { base: "", model: "" }
  };

  var config = loadConfig();
  var busy = false;
  var mounted = false;

  function loadConfig() {
    try {
      var raw = localStorage.getItem(CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConfig(next) {
    config = next;
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    } catch (e) {
      /* localStorage may be unavailable */
    }
  }

  function clearConfig() {
    config = null;
    try {
      localStorage.removeItem(CONFIG_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function hasConfig() {
    return !!(config && config.base && config.model && config.key);
  }

  function pageContext() {
    var article =
      document.querySelector("article.md-content__inner") ||
      document.querySelector("article") ||
      document.querySelector(".md-content");
    var text = article ? article.innerText : document.body.innerText;
    text = (text || "").replace(/\s+/g, " ").trim();
    if (text.length > MAX_CONTEXT_CHARS) {
      text = text.slice(0, MAX_CONTEXT_CHARS) + "\n[当前页面内容已截断]";
    }
    return {
      title: document.title || "课程页面",
      text: text
    };
  }

  function selectionText() {
    var sel = window.getSelection ? window.getSelection().toString() : "";
    return (sel || "").replace(/\s+/g, " ").trim();
  }

  function systemPrompt() {
    return [
      "你是《Diffusion / AIGC 面试课堂》的阅读伴侣。",
      "只基于用户提供的当前章节内容与通用知识回答。",
      "如果当前章节没有覆盖某个点，明确说“这一节没有展开”，不要编造论文、公式或引用。",
      "回答用中文，简洁、分点，优先给面试可用的说法。",
      "不要声称自己访问了互联网。"
    ].join("\n");
  }

  function buildUserMessage(action, input) {
    var page = pageContext();
    var head = "当前章节标题：" + page.title + "\n当前章节内容：\n" + page.text;
    if (action === "summary") {
      return head + "\n\n任务：用 5 个要点总结本页，并给出 1 个自测问题。";
    }
    if (action === "quiz") {
      return head + "\n\n任务：基于本页出 3 道题（2 道选择、1 道简答），附答案；不要超纲。";
    }
    if (action === "selection") {
      var selected = selectionText() || input || "";
      return (
        "当前章节标题：" + page.title +
        "\n选中内容：" + selected +
        "\n\n任务：解释这段内容，说明它在整章中的作用；如果内容不足，请指出。"
      );
    }
    return head + "\n\n我的问题：" + input;
  }

  async function callModel(messages) {
    var base = (config.base || "").trim().replace(/\/+$/, "");
    if (base.endsWith("/chat/completions")) {
      base = base.slice(0, -"/chat/completions".length);
    }
    var url = base + "/chat/completions";
    var res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + config.key
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages
        })
      });
    } catch (e) {
      throw new Error(
        "网络请求失败。可能是 CORS、Base URL 错误或本地服务未启动。" +
        "如果使用 Ollama，请设置 OLLAMA_ORIGINS 允许当前站点。"
      );
    }

    var raw = await res.text();
    if (!res.ok) {
      throw new Error("API 返回 " + res.status + "：" + raw.slice(0, 300));
    }
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error("API 返回的不是 JSON：" + raw.slice(0, 200));
    }
    var content =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;
    if (!content) {
      throw new Error("API 没有返回 choices[0].message.content。");
    }
    return content;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text, kind) {
    var node = el("ai-status");
    if (!node) return;
    node.textContent = text || "";
    node.className = "ai-status" + (kind ? " ai-status-" + kind : "");
  }

  function setBusy(next) {
    busy = next;
    var send = el("ai-send");
    var input = el("ai-input");
    if (send) {
      send.disabled = next;
      send.textContent = next ? "思考中…" : "发送";
    }
    if (input) input.disabled = next;
    document.querySelectorAll("#ai-panel [data-action]").forEach(function (b) {
      b.disabled = next;
    });
  }

  function addMessage(role, text) {
    var box = el("ai-messages");
    if (!box) return;
    var wrap = document.createElement("div");
    wrap.className = "ai-msg ai-msg-" + role;
    var who = document.createElement("div");
    who.className = "ai-msg-who";
    who.textContent = role === "user" ? "你" : "AI 伴读";
    var body = document.createElement("div");
    body.className = "ai-msg-body";
    body.textContent = text;
    wrap.appendChild(who);
    wrap.appendChild(body);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
  }

  function updatePageLabel() {
    var label = el("ai-page-label");
    if (label) {
      var title = document.title || "";
      label.textContent = title.length > 42 ? title.slice(0, 42) + "…" : title;
    }
  }

  function showChat() {
    var setup = el("ai-setup");
    var chat = el("ai-chat");
    if (!setup || !chat) return;
    if (hasConfig()) {
      setup.hidden = true;
      chat.hidden = false;
    } else {
      setup.hidden = false;
      chat.hidden = true;
    }
  }

  function openPanel() {
    var root = el("ai-companion-root");
    if (!root) return;
    root.classList.add("ai-open");
    updatePageLabel();
    showChat();
    var input = el("ai-input");
    if (input && hasConfig()) input.focus();
  }

  function closePanel() {
    var root = el("ai-companion-root");
    if (root) root.classList.remove("ai-open");
  }

  function fillForm() {
    var provider = el("ai-provider");
    var base = el("ai-base");
    var model = el("ai-model");
    var key = el("ai-key");
    if (!provider || !base || !model || !key) return;
    var p = (config && config.provider) || "openai";
    provider.value = PRESETS[p] ? p : "custom";
    base.value = (config && config.base) || "";
    model.value = (config && config.model) || "";
    key.value = (config && config.key) || "";
    if (!base.value) {
      var preset = PRESETS[provider.value];
      if (preset) base.value = preset.base;
    }
    if (!model.value) {
      var preset2 = PRESETS[provider.value];
      if (preset2) model.value = preset2.model;
    }
  }

  function readForm() {
    var provider = el("ai-provider");
    var base = el("ai-base");
    var model = el("ai-model");
    var key = el("ai-key");
    return {
      provider: provider ? provider.value : "custom",
      base: base ? base.value.trim() : "",
      model: model ? model.value.trim() : "",
      key: key ? key.value.trim() : ""
    };
  }

  function validate(next) {
    if (!next.base) return "请填写 API Base URL。";
    if (!/^https?:\/\//i.test(next.base)) return "Base URL 需要以 http:// 或 https:// 开头。";
    if (!next.model) return "请填写模型名。";
    if (!next.key) return "请填写 API Key。";
    return "";
  }

  async function handleSend(action, text) {
    if (busy) return;
    if (!hasConfig()) {
      var setup = el("ai-setup");
      if (setup) setup.hidden = false;
      setStatus("先填写 API 设置，再开始对话。", "error");
      var key = el("ai-key");
      if (key) key.focus();
      return;
    }
    if (action === "selection" && !selectionText()) {
      addMessage("assistant", "请先在正文中选中一段文字，再点“解释选中”。");
      return;
    }

    var userText = buildUserMessage(action, text);
    var display =
      action === "summary" ? "总结本页" :
      action === "quiz" ? "出 3 道题" :
      action === "selection" ? "解释选中内容" :
      text;

    addMessage("user", display);
    setBusy(true);
    setStatus("");

    try {
      var answer = await callModel([
        { role: "system", content: systemPrompt() },
        { role: "user", content: userText }
      ]);
      addMessage("assistant", answer);
    } catch (e) {
      addMessage("assistant", "调用失败：" + (e && e.message ? e.message : String(e)));
    } finally {
      setBusy(false);
    }
  }

  function mount() {
    if (document.getElementById("ai-companion-root")) {
      updatePageLabel();
      return;
    }

    var root = document.createElement("div");
    root.id = "ai-companion-root";
    root.innerHTML = [
      '<button id="ai-fab" type="button" aria-label="打开 AI 伴读">AI 伴读</button>',
      '<aside id="ai-panel" role="dialog" aria-label="AI 阅读伴侣" aria-modal="false">',
      '  <div class="ai-header">',
      '    <div class="ai-title"><strong>AI 伴读</strong><span id="ai-page-label"></span></div>',
      '    <div class="ai-header-actions">',
      '      <button id="ai-settings-toggle" type="button" aria-label="设置">设置</button>',
      '      <button id="ai-close" type="button" aria-label="关闭">×</button>',
      '    </div>',
      '  </div>',
      '  <div id="ai-setup" class="ai-setup">',
      '    <p class="ai-hint">使用你自己的 API。Key 只保存在本浏览器，本站没有服务器。</p>',
      '    <label>服务商<select id="ai-provider">',
      '      <option value="openai">OpenAI</option>',
      '      <option value="deepseek">DeepSeek</option>',
      '      <option value="openrouter">OpenRouter</option>',
      '      <option value="ollama">Ollama（本地）</option>',
      '      <option value="lmstudio">LM Studio（本地）</option>',
      '      <option value="custom">自定义</option>',
      '    </select></label>',
      '    <label>API Base URL<input id="ai-base" type="url" placeholder="https://api.openai.com/v1" autocomplete="off"></label>',
      '    <label>模型<input id="ai-model" type="text" placeholder="gpt-4o-mini / deepseek-chat" autocomplete="off"></label>',
      '    <label>API Key<input id="ai-key" type="password" placeholder="sk-..." autocomplete="off"></label>',
      '    <div class="ai-form-actions">',
      '      <button id="ai-save" type="button">保存并开始</button>',
      '      <button id="ai-forget" type="button" class="ai-secondary">清除</button>',
      '    </div>',
      '    <p id="ai-status" class="ai-status"></p>',
      '    <p class="ai-hint">不会上传 Key；但浏览器里的任何脚本理论上都能读取 localStorage，建议使用限额 Key。</p>',
      '    <p class="ai-hint"><a href="/ai-companion/">配置说明</a></p>',
      '  </div>',
      '  <div id="ai-chat" class="ai-chat" hidden>',
      '    <div id="ai-messages" class="ai-messages" aria-live="polite"></div>',
      '    <div class="ai-actions">',
      '      <button type="button" data-action="summary">总结本页</button>',
      '      <button type="button" data-action="selection">解释选中</button>',
      '      <button type="button" data-action="quiz">出 3 道题</button>',
      '      <button type="button" id="ai-new" class="ai-secondary">清空</button>',
      '    </div>',
      '    <form id="ai-form" class="ai-form">',
      '      <textarea id="ai-input" rows="3" placeholder="问这一页……"></textarea>',
      '      <button id="ai-send" type="submit">发送</button>',
      '    </form>',
      '    <p class="ai-hint">AI 可能出错；请对照原文，重要结论以课程为准。</p>',
      '  </div>',
      '</aside>'
    ].join("");
    document.body.appendChild(root);

    el("ai-fab").addEventListener("click", function () {
      if (root.classList.contains("ai-open")) closePanel();
      else openPanel();
    });
    el("ai-close").addEventListener("click", closePanel);
    el("ai-settings-toggle").addEventListener("click", function () {
      var setup = el("ai-setup");
      if (!setup) return;
      setup.hidden = !setup.hidden;
      if (!setup.hidden) setStatus("修改后点“保存并开始”。", "");
    });

    el("ai-provider").addEventListener("change", function () {
      var p = PRESETS[this.value];
      if (!p) return;
      if (p.base) el("ai-base").value = p.base;
      if (p.model) el("ai-model").value = p.model;
    });

    el("ai-save").addEventListener("click", function () {
      var next = readForm();
      var err = validate(next);
      if (err) {
        setStatus(err, "error");
        return;
      }
      saveConfig(next);
      setStatus("已保存。", "ok");
      showChat();
      var input = el("ai-input");
      if (input) input.focus();
    });

    el("ai-forget").addEventListener("click", function () {
      clearConfig();
      el("ai-key").value = "";
      setStatus("已清除本浏览器中的设置。", "ok");
      showChat();
    });

    el("ai-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = el("ai-input");
      var text = input ? input.value.trim() : "";
      if (!text) return;
      if (input) input.value = "";
      handleSend("chat", text);
    });

    document.querySelectorAll("#ai-panel [data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        handleSend(button.getAttribute("data-action"), "");
      });
    });

    el("ai-new").addEventListener("click", function () {
      var box = el("ai-messages");
      if (box) box.innerHTML = "";
      setStatus("");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closePanel();
    });

    fillForm();
    showChat();
    updatePageLabel();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(function () {
      mount();
    });
  } else {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount);
    } else {
      mount();
    }
  }
})();
