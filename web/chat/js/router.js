/* ============================================================
   Pi WebUI - View Router Module
   Centralized view switching: hides all views and shows the named one.
   ============================================================ */

window.Hermes = window.Hermes || {};

(function() {
  'use strict';

  const dom = window.Hermes.dom;

  // View element lookup: maps viewName → DOM element
  const viewMap = {
    welcome:  function() { return dom.welcomeScreen; },
    session:  function() { return dom.sessionView; },
    chat:     function() { return dom.chatMode; },
    admin:    function() { return document.getElementById('admin-view'); },
  };

  /**
   * Show exactly one view, hiding all others.
   * @param {string} viewName - One of: welcome, session, chat
   */
  function showView(viewName) {
    for (const name of Object.keys(viewMap)) {
      const el = viewMap[name]();
      if (el) el.style.display = 'none';
    }
    const target = viewMap[viewName];
    if (!target) {
      console.warn('[Pi] showView: unknown view:', viewName);
      return;
    }
    const el = target();
    if (el) el.style.display = 'flex';
  }

  window.Hermes.showView = showView;
})();
