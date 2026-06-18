(function () {
  "use strict";

  const STORAGE_KEY = "ad-asset-dashboard";

  /** Static asset definitions — update repo/domain info here if it changes. */
  const ASSETS = [
    {
      id: "asset-1",
      num: "Asset 01",
      name: "CSS Clamp Generator",
      domain: "clampgen.com",
      repo: "https://github.com/dcii-dev/clampgen",
      gaId: "540522281",
      niche: "dev",
      phase: 1,
      desc: "Generate CSS clamp() declarations for fluid typography and spacing. Supports viewport (vw) and container query (cqw) units, plus a full type scale generator with modular ratios.",
    },
    {
      id: "asset-2",
      num: "Asset 02",
      name: "Freelance Rate Calculator",
      domain: "freelanceratewise.com",
      repo: "https://github.com/dcii-dev/freelanceratewise",
      gaId: "540671739",
      niche: "finance",
      phase: 1,
      desc: "Calculate your true freelance hourly rate. Factor in non-billable hours, taxes, overhead, and expenses to find your real survival and growth rates.",
    },
    {
      id: "asset-3",
      num: "Asset 03",
      name: "Macro Calculator",
      domain: "calmacrocal.com",
      repo: "https://github.com/dcii-dev/calmacrocal",
      gaId: "540909051",
      niche: "health",
      phase: 1,
      desc: "Calculate BMR, TDEE, daily macro targets, body fat % (Navy Method), and heart rate training zones. Discipline-specific macro splits for strength, endurance, cutting, and bulking.",
    },
    {
      id: "asset-4",
      num: "Asset 04",
      name: "One-Rep Max Calculator",
      domain: "onerepmaxx.com",
      repo: "https://github.com/dcii-dev/onerepmaxx",
      gaId: "540671739",
      niche: "health",
      phase: 1,
      desc: "Free 1RM calculator using Brzycki, Epley, and Lombardi formulas. Includes warm-up ramp, competition attempt selector, reverse calculator, training zones, and PR history tracking.",
    },
    {
      id: "asset-5",
      num: "Asset 05",
      name: "Responsive Image srcset Builder",
      domain: "srcsetbuilder.com",
      repo: "https://github.com/dcii-dev/srcsetbuilder",
      gaId: "542208158",
      niche: "dev",
      phase: 1,
      desc: "Generate accurate srcset and sizes attributes, preview candidate widths and DPR coverage, and export all resized images as a zip in one click.",
    },
  ];

  /**
   * Loads saved stats from localStorage.
   * @return {Object}
   */
  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  /**
   * Saves current stats to localStorage.
   * @param {Object} data
   */
  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable.
    }
  }

  /** Reads all editable fields from the DOM and saves to localStorage. */
  function persistAll() {
    const data = loadData();
    document.querySelectorAll("[data-asset-id]").forEach((card) => {
      const id = card.dataset.assetId;
      if (!data[id]) data[id] = {};
      card.querySelectorAll("[data-field]").forEach((el) => {
        data[id][el.dataset.field] = el.textContent.trim();
      });
    });
    saveData(data);
    updateSummary(data);
  }

  /**
   * Formats a number with commas.
   * @param {string|number} val
   * @return {string}
   */
  function fmtNum(val) {
    const n = parseInt(String(val).replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? "—" : n.toLocaleString();
  }

  /**
   * Updates the summary bar totals.
   * @param {Object} data
   */
  function updateSummary(data) {
    let totalSessions = 0;
    let hasSessions = false;
    let bestPct = 0;
    let bestName = "—";

    ASSETS.forEach((asset) => {
      const d = data[asset.id] || {};
      const sessions = parseInt(
        String(d.sessions || "0").replace(/\D/g, ""),
        10,
      );
      if (!Number.isNaN(sessions) && sessions > 0) {
        totalSessions += sessions;
        hasSessions = true;
        const pct = Math.min(100, Math.round((sessions / 1000) * 100));
        if (pct > bestPct) {
          bestPct = pct;
          bestName = asset.name;
        }
      }
    });

    const sessionEl = document.getElementById("total-sessions");
    if (sessionEl)
      sessionEl.textContent = hasSessions
        ? totalSessions.toLocaleString()
        : "—";

    const closestEl = document.getElementById("journey-closest");
    if (closestEl) closestEl.textContent = bestPct > 0 ? bestName : "—";
  }

  /**
   * Builds the progress bar fill width string.
   * @param {number} sessions
   * @return {string}
   */
  function progressWidth(sessions) {
    const pct = Math.min(100, Math.round((sessions / 1000) * 100));
    return `${pct}%`;
  }

  /**
   * Renders all asset cards into the grid.
   * @param {Object} data - saved stats keyed by asset id
   */
  function renderCards(data) {
    const grid = document.getElementById("asset-grid");
    if (!grid) return;

    grid.innerHTML = "";

    ASSETS.forEach((asset) => {
      const saved = data[asset.id] || {};
      const sessions =
        parseInt(String(saved.sessions || "0").replace(/\D/g, ""), 10) || 0;
      const revenue = saved.revenue || "—";
      const rpm = saved.rpm || "—";
      const gaId = saved.gaId || asset.gaId || "";
      const clicks = saved.clicks || "—";
      const impressions = saved.impressions || "—";

      const liveUrl = `https://${asset.domain}`;
      const gscUrl = `https://search.google.com/search-console?resource_id=sc-domain:${asset.domain}`;
      const gaUrl =
        saved.gaId || asset.gaId
          ? `https://analytics.google.com/analytics/web/#/p${saved.gaId || asset.gaId}/reports/reportinghub`
          : "https://analytics.google.com";

      const pct = Math.min(100, Math.round((sessions / 1000) * 100));
      const fillClass =
        pct >= 100
          ? "journey-progress__fill journey-progress__fill--complete"
          : "journey-progress__fill";
      const phaseLabel = pct >= 100 ? "Phase 2 Ready" : "Phase 1 — Grow.me";
      const phaseClass =
        pct >= 100
          ? "asset-card__phase asset-card__phase--journey"
          : "asset-card__phase";

      const card = document.createElement("article");
      card.className = "asset-card";
      card.dataset.assetId = asset.id;

      card.innerHTML = `
        <div class="asset-card__header">
          <div class="asset-card__title-group">
            <span class="asset-card__num">${asset.num}</span>
            <span class="asset-card__name">${asset.name}</span>
            <span class="asset-card__domain">${asset.domain}</span>
          </div>
          <span class="${phaseClass}">${phaseLabel}</span>
        </div>

        <div class="asset-card__body">
          <p class="asset-card__desc">${asset.desc}</p>

          <div class="asset-card__stats">
            <div class="stat-box">
              <span class="stat-box__label">Sessions (30d)</span>
              <span class="stat-box__value ${sessions === 0 ? "stat-box__value--muted" : ""}"
                data-field="sessions">${sessions > 0 ? sessions.toLocaleString() : "—"}</span>
            </div>
            <div class="stat-box">
              <span class="stat-box__label">GSC Clicks (30d)</span>
              <span class="stat-box__value ${clicks === "—" ? "stat-box__value--muted" : ""}"
                data-field="clicks">${clicks}</span>
            </div>
            <div class="stat-box">
              <span class="stat-box__label">Impressions (30d)</span>
              <span class="stat-box__value ${impressions === "—" ? "stat-box__value--muted" : ""}"
                data-field="impressions">${impressions}</span>
            </div>
            <div class="stat-box">
              <span class="stat-box__label">Revenue (30d)</span>
              <span class="stat-box__value ${revenue === "—" ? "stat-box__value--muted" : ""}"
                data-field="revenue">${revenue}</span>
            </div>
            <div class="stat-box">
              <span class="stat-box__label">RPM</span>
              <span class="stat-box__value ${rpm === "—" ? "stat-box__value--muted" : ""}"
                data-field="rpm">${rpm}</span>
            </div>
          </div>

          <div class="journey-progress">
            <div class="journey-progress__label">
              <span>Journey by Mediavine threshold</span>
              <strong>${pct}% — ${sessions.toLocaleString()} / 1,000 sessions</strong>
            </div>
            <div class="journey-progress__track">
              <div class="${fillClass}" style="width: ${pct}%"></div>
            </div>
          </div>

          <div class="asset-card__ga">
            <span class="asset-card__ga-label">GA4 Property ID</span>
            <span class="asset-card__ga-value"
              data-field="gaId">${gaId}</span>
          </div>

          <div class="asset-card__links">
            <a class="link-btn link-btn--live" href="${liveUrl}" target="_blank" rel="noopener">
              <em class="link-btn__icon">↗</em> Live Site
            </a>
            <a class="link-btn" href="${asset.repo}" target="_blank" rel="noopener">
              <em class="link-btn__icon">⌥</em> GitHub Repo
            </a>
            <a class="link-btn" href="${gscUrl}" target="_blank" rel="noopener">
              <em class="link-btn__icon">⚲</em> Search Console
            </a>
            <a class="link-btn" href="${gaUrl}" target="_blank" rel="noopener">
              <em class="link-btn__icon">◎</em> Analytics
            </a>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  /** Enables contenteditable on all data-field elements. */
  function enableEditMode() {
    document.querySelectorAll("[data-field]").forEach((el) => {
      el.contentEditable = "true";
      // Clear placeholder text on first focus
      if (
        el.dataset.field === "gaId" &&
        el.textContent.trim() === "G-XXXXXXXXXX"
      ) {
        el.addEventListener(
          "focus",
          () => {
            if (el.textContent.trim() === "G-XXXXXXXXXX") el.textContent = "";
          },
          { once: true },
        );
      }
    });
  }

  /** Disables contenteditable on all data-field elements. */
  function disableEditMode() {
    document.querySelectorAll("[data-field]").forEach((el) => {
      el.contentEditable = "false";
    });
  }

  /** Sets the header date stamp to today. */
  function setDate() {
    const el = document.getElementById("last-updated");
    if (el) {
      el.textContent = `Updated ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
  }

  /**
   * Reads current search and filter state and shows/hides cards accordingly.
   * Also updates the visible count label.
   */
  function applyFilters() {
    const query = (document.getElementById("search-input")?.value ?? "")
      .toLowerCase()
      .trim();
    const niche = document.getElementById("filter-niche")?.value ?? "";
    const phase = document.getElementById("filter-phase")?.value ?? "";
    const progress = document.getElementById("filter-progress")?.value ?? "";

    const data = loadData();
    let visible = 0;

    document.querySelectorAll("[data-asset-id]").forEach((card) => {
      const id = card.dataset.assetId;
      const asset = ASSETS.find((a) => a.id === id);
      if (!asset) return;

      const saved = data[id] || {};
      const sessions =
        parseInt(String(saved.sessions || "0").replace(/\D/g, ""), 10) || 0;

      // Search match
      const searchable =
        `${asset.name} ${asset.domain} ${asset.desc}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);

      // Niche filter
      const matchesNiche = !niche || asset.niche === niche;

      // Phase filter (use asset.phase as base, overridable via saved data)
      const currentPhase =
        parseInt(saved.adPhase || String(asset.phase), 10) || 1;
      const matchesPhase = !phase || currentPhase === parseInt(phase, 10);

      // Journey progress filter
      let matchesProgress = true;
      if (progress === "none") matchesProgress = sessions === 0;
      else if (progress === "low")
        matchesProgress = sessions > 0 && sessions < 500;
      else if (progress === "mid")
        matchesProgress = sessions >= 500 && sessions < 1000;
      else if (progress === "ready") matchesProgress = sessions >= 1000;

      const show =
        matchesSearch && matchesNiche && matchesPhase && matchesProgress;
      card.hidden = !show;
      if (show) visible++;
    });

    const countEl = document.getElementById("results-count");
    if (countEl) {
      countEl.textContent =
        visible === ASSETS.length
          ? `${ASSETS.length} assets`
          : `${visible} of ${ASSETS.length} assets`;
    }
  }

  /** Re-renders progress bars and phase badges after a session count is edited. */
  function refreshCard(cardEl) {
    const id = cardEl.dataset.assetId;
    const asset = ASSETS.find((a) => a.id === id);
    if (!asset) return;

    const sessionsEl = cardEl.querySelector('[data-field="sessions"]');
    const sessions =
      parseInt(
        String(sessionsEl ? sessionsEl.textContent : "0").replace(/\D/g, ""),
        10,
      ) || 0;
    const pct = Math.min(100, Math.round((sessions / 1000) * 100));

    const fill = cardEl.querySelector(".journey-progress__fill");
    if (fill) {
      fill.style.width = `${pct}%`;
      fill.className =
        pct >= 100
          ? "journey-progress__fill journey-progress__fill--complete"
          : "journey-progress__fill";
    }

    const progressLabel = cardEl.querySelector(
      ".journey-progress__label strong",
    );
    if (progressLabel) {
      progressLabel.textContent = `${pct}% — ${sessions.toLocaleString()} / 1,000 sessions`;
    }

    const phase = cardEl.querySelector(".asset-card__phase");
    if (phase) {
      phase.textContent = pct >= 100 ? "Phase 2 Ready" : "Phase 1 — Grow.me";
      phase.className =
        pct >= 100
          ? "asset-card__phase asset-card__phase--journey"
          : "asset-card__phase";
    }
  }

  function initializeApp() {
    setDate();
    const data = loadData();
    renderCards(data);
    updateSummary(data);

    // Search and filter controls
    document
      .getElementById("search-input")
      ?.addEventListener("input", applyFilters);
    document
      .getElementById("filter-niche")
      ?.addEventListener("change", applyFilters);
    document
      .getElementById("filter-phase")
      ?.addEventListener("change", applyFilters);
    document
      .getElementById("filter-progress")
      ?.addEventListener("change", applyFilters);
    document.getElementById("clear-filters")?.addEventListener("click", () => {
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
      ["filter-niche", "filter-phase", "filter-progress"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      applyFilters();
    });
    applyFilters();

    // Edit mode toggle
    let editMode = false;
    const editBtn = document.getElementById("edit-toggle");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editMode = !editMode;
        editBtn.textContent = editMode ? "Save" : "Edit Mode";
        editBtn.classList.toggle("active", editMode);
        if (editMode) {
          enableEditMode();
        } else {
          disableEditMode();
          persistAll();
          // Re-render to reflect any session count changes
          const updatedData = loadData();
          document.querySelectorAll("[data-asset-id]").forEach((card) => {
            refreshCard(card);
          });
          updateSummary(updatedData);
        }
      });
    }

    // Auto-save on blur of any editable field
    document.getElementById("asset-grid")?.addEventListener(
      "blur",
      (e) => {
        if (e.target && e.target.dataset.field) {
          persistAll();
          const card = e.target.closest("[data-asset-id]");
          if (card && e.target.dataset.field === "sessions") {
            refreshCard(card);
            updateSummary(loadData());
          }
        }
      },
      true,
    );
  }

  if (document.readyState === "complete") {
    initializeApp();
  } else {
    window.addEventListener("load", initializeApp, { once: true });
  }
})();
