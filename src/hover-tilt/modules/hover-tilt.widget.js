/*\
title: $:/plugins/nikorion/hover-tilt/modules/hover-tilt.widget.js
type: application/javascript
module-type: widget
\*/

/*
 * hover-tilt.widget.js — <$HoverTilt> widget 🖼️
 *
 * Creates a `<hover-tilt>` custom element inside TiddlyWiki as an ordinary
 * widget. `hover-tilt` (https://hover-tilt.simey.me) ships its own prebuilt
 * Web Component — a self-registering, dependency-free script — so this
 * widget just `require()`s it for its `customElements.define()` side effect
 * and drives the element directly. This widget exposes hover-tilt's entire
 * prop surface as attributes, so <$HoverTilt> can be tuned the same way the
 * native component would be.
 *
 * ── Why this works without a build step ───────────────────────────────
 * TiddlyWiki has no notion of npm or ES modules — it evaluates JS tiddlers
 * inside a `function(module, exports, require)` sandbox, which chokes on
 * `import`/`export` statements. hover-tilt's Web Component build
 * (`hover-tilt/web-component`, i.e. `dist/hover-tilt.js` in the npm package)
 * is a single self-contained script with exactly one ESM artefact: a
 * trailing `export { HoverTilt };`. modules/hover-tilt.min.js is that same
 * file, vendored as-is with the TW module header prepended and that one
 * trailing export line stripped — no bundler needed. See CLAUDE.md for how
 * to re-vendor it after a `hover-tilt` version bump.
 *
 * Because the component is a genuine custom element with a native `<slot>`,
 * this widget's own body just becomes the element's light-DOM children — no
 * Svelte-side snippet bridging is needed. Its props are plain JS properties
 * on the element (camelCase, matching hover-tilt's own Svelte prop names)
 * rather than kebab-case attribute strings, so updating them later (see
 * refresh()) is a direct property set — no destroy/remount for a plain
 * attribute change.
 *
 * ── Value resolution (attribute → setting → hover-tilt default) ────────
 *
 *   Every prop is resolved in three tiers, so as little as possible is
 *   hardcoded in this file:
 *     1. the widget attribute (e.g. tiltFactor="2") — highest priority;
 *     2. the global setting tiddler
 *        `$:/config/nikorion/hover-tilt/<attr>` (edited via the
 *        ControlPanel tab, shipped with opinionated defaults in
 *        default-config.multids);
 *     3. otherwise the value is left undefined so hover-tilt's OWN internal
 *        default applies.
 *   The plugin's opinionated defaults (softer spring, shadow on,
 *   tiltFactor 1.2 …) therefore live as DATA in the shipped settings/*
 *   tiddlers, not as constants here. The only structural constants left are
 *   HT_SPRING (used solely to complete a half-specified spring) and the
 *   border-radius fallback.
 *
 * ── Attributes ───────────────────────────────────────────────────────
 *
 *   tiltFactor        {number}   Horizontal tilt intensity.
 *   tiltFactorY       {number}   Vertical tilt factor (default: same as tiltFactor).
 *   scaleFactor       {number}   Scale-up amount while active.
 *   stiffness         {number}   springOptions.stiffness (scale/opacity spring).
 *   damping           {number}   springOptions.damping.
 *   tiltStiffness     {number}   tiltSpringOptions.stiffness (separate tilt spring).
 *   tiltDamping       {number}   tiltSpringOptions.damping. If neither tilt* is
 *                                set, tiltSpringOptions is left undefined and
 *                                hover-tilt reuses springOptions.
 *   enterDelay        {number}   Milliseconds before activating on pointer enter.
 *   exitDelay         {number}   Milliseconds before deactivating on pointer leave.
 *   shadow            {yes|no}   Drop shadow that follows the tilt.
 *   shadowBlur        {number}   Shadow blur radius.
 *   blendMode         {string}   CSS mix-blend-mode for the glare layer.
 *   glareIntensity    {number}   Glare opacity multiplier.
 *   glareHue          {number}   Glare colour hue (0-360).
 *   glareMask         {string}   CSS mask-image for the glare layer.
 *   glareMaskMode     {string}   CSS mask-mode.
 *   glareMaskComposite {string}  CSS mask-composite.
 *   borderRadius      {string}   Baseline border-radius of the host (glare/shadow
 *                                layers inherit it via border-radius: inherit).
 *   class             {string}   Extra CSS class(es), via setAttribute().
 *   style             {string}   Extra inline style, appended after the widget's
 *                                required baseline (display: inline-block; border-radius).
 *
 * ── Body / slotted content ───────────────────────────────────────────
 *   The widget's own body is rendered by TiddlyWiki, then handed to
 *   hover-tilt as its slotted content. Used self-closing, it tilts an empty
 *   slot. See guides/hover-tilt-widget-tw.md.
 */

(function () {
  "use strict";

  const Widget = require("$:/core/modules/widgets/widget.js").widget;
  const lang   = require("$:/plugins/nikorion/hover-tilt/modules/lang.js");

  const LIBRARY_TITLE  = "$:/plugins/nikorion/hover-tilt/modules/hover-tilt.min.js";
  const SETTINGS_PREFIX = "$:/config/nikorion/hover-tilt/";

  // hover-tilt's own upstream spring default — used ONLY to fill the missing
  // half of a half-specified spring (e.g. tiltStiffness set but tiltDamping
  // not). Not a plugin default: the plugin's opinionated spring is shipped as
  // data in default-config.multids.
  const HT_SPRING = { stiffness: 0.2, damping: 0.8 };

  // Opinionated default radius for the host. hover-tilt's glare/shadow layers
  // live in its shadow DOM and inherit their `border-radius` from the *host*
  // element (not from the slotted content), so rounding the host is the only
  // way to round them to match a card. `0` would work fine too — it just gives
  // square glare/shadow. This is an aesthetic default (matching the card demo),
  // not a functional requirement; it also covers a missing settings tiddler.
  const BORDER_RADIUS_FALLBACK = "12px";

  // ─────────────────────────────────────────────────────────────────────
  // Constructor
  // ─────────────────────────────────────────────────────────────────────
  function HoverTiltWidget(parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  }

  HoverTiltWidget.prototype = new Widget();

  // ─────────────────────────────────────────────────────────────────────
  // render — called once when the widget is first inserted into the DOM
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();

    // The vendored library registers the Web Component via
    // customElements.define(), which only exists in a browser. Under Node
    // (server-side render: `--build html`, or the dev server's initial page
    // render of an open story tiddler), that call throws and TW's module
    // loader escalates it through $tw.utils.error() → process.exit(1) — so a
    // local try/catch here can't shield us and the whole server dies. Only
    // pull in the library in the browser; server-side we still emit a plain
    // <hover-tilt> host whose slotted body renders fine, and the browser
    // re-renders it reactively (and upgrades the element) on load.
    if ($tw.browser) {
      try {
        // Required purely for its customElements.define('hover-tilt', ...)
        // side effect — TW caches modules after first require(), so this is
        // cheap on every widget instance beyond the first.
        require(LIBRARY_TITLE);
      } catch (_e) {
        const errorNode = this.document.createElement("p");
        errorNode.style.color = "red";
        errorNode.textContent = lang.getString("Errors/LibraryMissing");
        parent.insertBefore(errorNode, nextSibling);
        this.domNodes.push(errorNode);
        return;
      }
    }

    const hoverTiltNode = this.document.createElement("hover-tilt");
    this._applyProps(hoverTiltNode);

    // Anything written in the widget's own body becomes hover-tilt's slotted
    // content — rendered directly as light-DOM children of <hover-tilt>
    // itself, since its own default <slot> picks them up automatically.
    if (this.children && this.children.length > 0) {
      this.renderChildren(hoverTiltNode, null);
    }

    parent.insertBefore(hoverTiltNode, nextSibling);
    this.domNodes.push(hoverTiltNode);
    this.hoverTiltNode = hoverTiltNode;
  };

  // ─────────────────────────────────────────────────────────────────────
  // Value resolution helpers — each reads the widget attribute first, then
  // the global setting tiddler, then leaves the value undefined so
  // hover-tilt's own internal default wins (see the module header). An empty
  // attribute string is treated as "not set" so removing an attribute at
  // refresh cleanly falls back through the same chain.
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype._rawValue = function (name) {
    let raw = this.getAttribute(name);
    if (raw === undefined || raw === "") {
      raw = this.wiki.getTiddlerText(SETTINGS_PREFIX + name, "");
    }
    return (raw === undefined || raw === "") ? undefined : raw;
  };

  HoverTiltWidget.prototype._number = function (name) {
    const raw = this._rawValue(name);
    if (raw === undefined) return undefined;
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : undefined;
  };

  HoverTiltWidget.prototype._string = function (name) {
    return this._rawValue(name);
  };

  HoverTiltWidget.prototype._boolean = function (name) {
    const raw = this._rawValue(name);
    if (raw === undefined) return undefined;
    return raw !== "no" && raw !== "false";
  };

  // ─────────────────────────────────────────────────────────────────────
  // _readAttributes — resolve every prop into a plain field. Split out from
  // execute() so refresh() can re-read them on an attribute/setting change
  // without calling makeChildWidgets() again (which would rebuild children).
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype._readAttributes = function () {
    this.tiltFactor         = this._number("tiltFactor");
    this.tiltFactorY        = this._number("tiltFactorY");
    this.scaleFactor        = this._number("scaleFactor");
    this.stiffness          = this._number("stiffness");
    this.damping            = this._number("damping");
    this.tiltStiffness      = this._number("tiltStiffness");
    this.tiltDamping        = this._number("tiltDamping");
    this.enterDelay         = this._number("enterDelay");
    this.exitDelay          = this._number("exitDelay");
    this.shadow             = this._boolean("shadow");
    this.shadowBlur         = this._number("shadowBlur");
    this.blendMode          = this._string("blendMode");
    this.glareIntensity     = this._number("glareIntensity");
    this.glareHue           = this._number("glareHue");
    this.glareMask          = this._string("glareMask");
    this.glareMaskMode      = this._string("glareMaskMode");
    this.glareMaskComposite = this._string("glareMaskComposite");
    this.borderRadius       = this._string("borderRadius") || BORDER_RADIUS_FALLBACK;
    // class/style are plain widget attributes only (not settings-backed).
    this.containerClass     = this.getAttribute("class", "");
    this.containerStyle     = this.getAttribute("style", "");
  };

  // ─────────────────────────────────────────────────────────────────────
  // execute — read attributes and turn the widget's body into this.children
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype.execute = function () {
    this._readAttributes();
    this.makeChildWidgets();
  };

  // Build a spring object from resolved stiffness/damping, completing any
  // missing half with hover-tilt's own upstream default. Returns undefined
  // when neither is set, so hover-tilt uses its internal spring.
  function buildSpring(stiffness, damping) {
    if (stiffness === undefined && damping === undefined) return undefined;
    return {
      stiffness: stiffness !== undefined ? stiffness : HT_SPRING.stiffness,
      damping:   damping   !== undefined ? damping   : HT_SPRING.damping,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // _applyProps — push the resolved fields onto a <hover-tilt> element.
  // Every hover-tilt prop except class/style is a plain JS property on the
  // element (camelCase, matching hover-tilt's own Svelte prop names) — no
  // kebab-case translation, and objects (springOptions) pass as-is. An
  // undefined value is assigned deliberately: it tells hover-tilt to fall
  // back to its own default, which also resets a prop cleanly when an
  // attribute/setting is removed. class/style go through setAttribute()
  // instead, since they're the two special global HTML attributes: that both
  // applies them natively to the host element and (via
  // attributeChangedCallback) reaches hover-tilt's own class/style prop.
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype._applyProps = function (node) {
    node.tiltFactor         = this.tiltFactor;
    node.tiltFactorY        = this.tiltFactorY;
    node.scaleFactor        = this.scaleFactor;
    node.springOptions      = buildSpring(this.stiffness, this.damping);
    // Separate tilt spring — built ONLY when at least one tilt* is set, so
    // otherwise hover-tilt reuses springOptions itself (its documented
    // behaviour) rather than us echoing it. Whichever half is unset falls
    // back through the scale spring, then hover-tilt's own default.
    if (this.tiltStiffness !== undefined || this.tiltDamping !== undefined) {
      const baseStiffness = this.stiffness !== undefined ? this.stiffness : HT_SPRING.stiffness;
      const baseDamping   = this.damping   !== undefined ? this.damping   : HT_SPRING.damping;
      node.tiltSpringOptions = {
        stiffness: this.tiltStiffness !== undefined ? this.tiltStiffness : baseStiffness,
        damping:   this.tiltDamping   !== undefined ? this.tiltDamping   : baseDamping,
      };
    } else {
      node.tiltSpringOptions = undefined;
    }
    node.enterDelay         = this.enterDelay;
    node.exitDelay          = this.exitDelay;
    node.shadow             = this.shadow;
    node.shadowBlur         = this.shadowBlur;
    node.blendMode          = this.blendMode;
    node.glareIntensity     = this.glareIntensity;
    node.glareHue           = this.glareHue;
    node.glareMask          = this.glareMask;
    node.glareMaskMode      = this.glareMaskMode;
    node.glareMaskComposite = this.glareMaskComposite;

    node.setAttribute("class", this.containerClass || "");
    node.setAttribute(
      "style",
      `display: inline-block; border-radius: ${this.borderRadius}; ${this.containerStyle || ""}`
    );
  };

  // ─────────────────────────────────────────────────────────────────────
  // refresh — called by TiddlyWiki on every tiddler change. Re-applies props
  // when either a widget attribute OR a settings/* tiddler changed.
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype.refresh = function (changedTiddlers) {
    const changedAttributes = this.computeAttributes();
    const attributesChanged = Object.keys(changedAttributes).length > 0;
    const settingsChanged = Object.keys(changedTiddlers).some(function (title) {
      return title.indexOf(SETTINGS_PREFIX) === 0;
    });
    if ((attributesChanged || settingsChanged) && this.hoverTiltNode) {
      this._readAttributes();
      this._applyProps(this.hoverTiltNode);
    }
    // Still refresh the slotted content (this.children), attributes changed
    // or not — its widgets keep their own DOM node references regardless of
    // being grafted into the custom element's light DOM.
    const childrenRefreshed = this.refreshChildren(changedTiddlers);
    return attributesChanged || settingsChanged || childrenRefreshed;
  };

  // ─────────────────────────────────────────────────────────────────────
  // destroy — nothing custom to tear down: removing <hover-tilt> from the
  // DOM (done by the base Widget implementation) fires its own
  // disconnectedCallback, which tears down hover-tilt's internal Svelte
  // instance on its own.
  // ─────────────────────────────────────────────────────────────────────
  HoverTiltWidget.prototype.destroy = function (options) {
    Widget.prototype.destroy.call(this, options);
  };

  exports["HoverTilt"] = HoverTiltWidget;

})();
