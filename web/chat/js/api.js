/* ============================================================
   Hermes WebUI - API Module v2
   统一 API 封装：自动处理 auth、错误、超时
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  var H = window.Hermes;

  /**
   * 统一 API 调用
   * @param {string} path  - API 路径 (如 '/sessions', '/sessions/xxx/messages')
   * @param {object} opts  - fetch options (method, body 等)
   * @returns {Promise<{ok, data, ...}>}
   */
  H.api = async function api(path, opts) {
    if (opts === undefined) opts = {};
    var fetchOpts = {
      headers: { 'Content-Type': 'application/json' },
    };
    // 合并 opts
    if (opts.method) fetchOpts.method = opts.method;
    if (opts.body) fetchOpts.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    if (opts.headers) Object.assign(fetchOpts.headers, opts.headers);

    var isGet = !fetchOpts.method || fetchOpts.method === 'GET';
    // 调用方外部 signal（如 abortStream 的 abortController）
    var externalSignal = opts.signal || null;

    async function attempt() {
      // H3: 每次尝试创建带超时的 AbortController（GET 8s / POST 20s），
      // 防止 sidecar hang 时 fetch 永久挂起。外部 signal 合并：abort 传播到内部。
      var ctrl = new AbortController();
      var timer = setTimeout(function() { ctrl.abort(); }, isGet ? 8000 : 20000);
      if (externalSignal) {
        if (externalSignal.aborted) ctrl.abort();
        else externalSignal.addEventListener('abort', function() { ctrl.abort(); });
      }
      fetchOpts.signal = ctrl.signal;
      try {
        var res = await fetch(H.API_BASE + path, fetchOpts);
        var data;
        try {
          data = await res.json();
        } catch(e) {
          throw new Error('API 响应解析失败: ' + res.status);
        }
        if (!data.ok) throw new Error(data.error || 'unknown error');
        return data;
      } finally {
        clearTimeout(timer);
      }
    }

    try {
      return await attempt();
    } catch(e) {
      // S#7: GET 请求自动重试一次（网络抖动容错）；外部 signal abort 不重试
      if (isGet && (!externalSignal || !externalSignal.aborted)) {
        await new Promise(function(r) { setTimeout(r, 1000); });
        return await attempt();
      }
      throw e;
    }
  };

})();
