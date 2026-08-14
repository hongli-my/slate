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
    if (opts.signal) fetchOpts.signal = opts.signal;

    var isGet = !fetchOpts.method || fetchOpts.method === 'GET';

    async function attempt() {
      var res = await fetch(H.API_BASE + path, fetchOpts);
      var data;
      try {
        data = await res.json();
      } catch(e) {
        throw new Error('API 响应解析失败: ' + res.status);
      }
      if (!data.ok) throw new Error(data.error || 'unknown error');
      return data;
    }

    try {
      return await attempt();
    } catch(e) {
      // S#7: GET 请求自动重试一次（网络抖动容错）
      if (isGet && (!opts.signal || !opts.signal.aborted)) {
        await new Promise(function(r) { setTimeout(r, 1000); });
        return await attempt();
      }
      throw e;
    }
  };

})();
