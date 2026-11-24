/* Taco AI File Sorter — Zero-Dependency Browser UI Controller */
(function () {
  "use strict";

  const PROFILES = window.TacoSortProfiles;
  const Engine = window.TacoSortEngine;

  const SAMPLE_FILES = [
    { id: "s1", name: "Invoice_Acme_Q3_2026.pdf", rel_path: "Invoice_Acme_Q3_2026.pdf", size: 245120, mtime_ms: 1761000000000, fast_hash: "a1b2c3d4e5f60001", snippet: "Invoice total $1,420.00 tax receipt payment due" },
    { id: "s2", name: "Invoice_Acme_Q3_2026 (copy).pdf", rel_path: "Downloads/Invoice_Acme_Q3_2026 (copy).pdf", size: 245120, mtime_ms: 1761000000000, fast_hash: "a1b2c3d4e5f60001", snippet: "Invoice total $1,420.00 tax receipt payment due" },
    { id: "s3", name: "NDA_Partner_Agreement.docx", rel_path: "NDA_Partner_Agreement.docx", size: 84200, mtime_ms: 1760500000000, fast_hash: "a1b2c3d4e5f60002", snippet: "Mutual non-disclosure agreement legal contract terms" },
    { id: "s4", name: "epistemology_cybernetics_draft.md", rel_path: "epistemology_cybernetics_draft.md", size: 18400, mtime_ms: 1762000000000, fast_hash: "a1b2c3d4e5f60003", snippet: "Philosophy of mind, epistemology, dialectics, and cognitive cybernetics preprint" },
    { id: "s5", name: "esp32_sensor_board.kicad_pcb", rel_path: "esp32_sensor_board.kicad_pcb", size: 112000, mtime_ms: 1761200000000, fast_hash: "a1b2c3d4e5f60004", snippet: "hardware pcb schematic sensor microcontroller" },
    { id: "s6", name: "lead_vocal_take04_120bpm.wav", rel_path: "lead_vocal_take04_120bpm.wav", size: 14800000, mtime_ms: 1761800000000, fast_hash: "a1b2c3d4e5f60005", snippet: "audio vocal stem recording track mix" },
    { id: "s7", name: "IMG_4821.jpg", rel_path: "IMG_4821.jpg", size: 3200000, mtime_ms: 1760100000000, fast_hash: "a1b2c3d4e5f60006", snippet: "" },
    { id: "s8", name: "Screenshot 2026-10-12 at 14.03.png", rel_path: "Screenshot 2026-10-12 at 14.03.png", size: 512000, mtime_ms: 1760277780000, fast_hash: "a1b2c3d4e5f60007", snippet: "" },
    { id: "s9", name: "deploy_pipeline.py", rel_path: "deploy_pipeline.py", size: 6400, mtime_ms: 1761900000000, fast_hash: "a1b2c3d4e5f60008", snippet: "python api automation docker deployment script" },
    { id: "s10", name: "demo_walkthrough_clip.mp4", rel_path: "demo_walkthrough_clip.mp4", size: 42100000, mtime_ms: 1761500000000, fast_hash: "a1b2c3d4e5f60009", snippet: "" },
    { id: "s11", name: "brand_logo_v3.svg", rel_path: "brand_logo_v3.svg", size: 22000, mtime_ms: 1761100000000, fast_hash: "a1b2c3d4e5f60010", snippet: "vector icon graphic mockup" },
    { id: "s12", name: "project_backup_oct.zip", rel_path: "project_backup_oct.zip", size: 88000000, mtime_ms: 1761600000000, fast_hash: "a1b2c3d4e5f60011", snippet: "" },
  ];

  const TEXT_EXTS = new Set([".txt", ".md", ".json", ".csv", ".yaml", ".yml", ".py", ".js", ".ts", ".tsx", ".html", ".css", ".xml", ".sql"]);

  let scannedFiles = [];
  let planItems = [];

  const els = {
    profile: document.getElementById("profile-select"),
    naming: document.getElementById("naming-select"),
    profileDesc: document.getElementById("profile-desc"),
    dropzone: document.getElementById("dropzone"),
    folderInput: document.getElementById("folder-input"),
    filesInput: document.getElementById("files-input"),
    btnPickFolder: document.getElementById("btn-pick-folder"),
    btnPickFiles: document.getElementById("btn-pick-files"),
    btnSample: document.getElementById("btn-load-sample"),
    btnClear: document.getElementById("btn-clear"),
    workspace: document.getElementById("workspace"),
    statFiles: document.getElementById("stat-files"),
    statFolders: document.getElementById("stat-folders"),
    statDups: document.getElementById("stat-dups"),
    statExcluded: document.getElementById("stat-excluded"),
    filter: document.getElementById("filter-input"),
    tbody: document.getElementById("plan-tbody"),
    btnPs1: document.getElementById("btn-dl-ps1"),
    btnSh: document.getElementById("btn-dl-sh"),
    btnCsv: document.getElementById("btn-dl-csv"),
    btnJson: document.getElementById("btn-dl-json"),
    ollamaUrl: document.getElementById("ollama-url"),
    ollamaModel: document.getElementById("ollama-model"),
    btnOllama: document.getElementById("btn-ollama-refine"),
    ollamaStatus: document.getElementById("ollama-status"),
    cliSnippet: document.getElementById("cli-snippet"),
  };

  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function populateProfiles() {
    const order = [
      "general_productivity",
      "unconventional_polymath",
      "independent_musician",
      "digital_creator",
      "academic_scholar",
      "studio_artist",
    ];
    const keys = order.filter((k) => PROFILES[k]).concat(Object.keys(PROFILES).filter((k) => !order.includes(k)));
    els.profile.innerHTML = keys
      .map((k) => `<option value="${esc(k)}">${esc(PROFILES[k].name)} (${PROFILES[k].categories.length} categories)</option>`)
      .join("");
    updateProfileDescription();
  }

  function updateProfileDescription() {
    const p = PROFILES[els.profile.value];
    els.profileDesc.innerHTML =
      `<strong>${esc(p.tagline || p.name)}</strong> — ${esc(p.description || "")} ` +
      `<span style="font-family:var(--font-mono);color:var(--amber);">Default naming: ${esc(p.defaultNamingPattern || "date_category_name")}</span>`;
    updateCliSnippet();
  }

  function updateCliSnippet() {
    const pid = els.profile.value;
    const naming = els.naming.value !== "profile_default" ? ` --naming ${els.naming.value}` : "";
    const model = els.ollamaModel.value.trim() || "llama3.2";
    els.cliSnippet.textContent =
      `# 1. Dry-run preview\n` +
      `taco-sort scan ./Downloads --profile ${pid}${naming}\n\n` +
      `# 2. Apply safely (auto-saves .tacosort-manifest-*.json rollback file)\n` +
      `taco-sort apply ./Downloads --profile ${pid}${naming}\n\n` +
      `# Optional: refine with local Ollama (CPU/GPU)\n` +
      `taco-sort apply ./Downloads --profile ${pid} --ollama ${model}\n\n` +
      `# 3. Roll back every move in one command if needed\n` +
      `taco-sort undo ./Downloads/.tacosort-manifest-YYYYMMDDTHHMMSSZ.json`;
  }

  async function computeBrowserFastHash(file, chunkKb = 64) {
    try {
      const slice = chunkKb * 1024;
      const head = await file.slice(0, Math.min(slice, file.size)).arrayBuffer();
      const midStart = Math.max(0, Math.floor(file.size / 2) - Math.floor(slice / 2));
      const mid = await file.slice(midStart, Math.min(midStart + slice, file.size)).arrayBuffer();
      const tail = await file.slice(Math.max(0, file.size - slice), file.size).arrayBuffer();

      const total = head.byteLength + mid.byteLength + tail.byteLength + 8;
      const combined = new Uint8Array(total);
      let off = 0;
      combined.set(new Uint8Array(head), off); off += head.byteLength;
      combined.set(new Uint8Array(mid), off); off += mid.byteLength;
      combined.set(new Uint8Array(tail), off); off += tail.byteLength;
      new DataView(combined.buffer).setFloat64(off, file.size, true);

      if (window.crypto && window.crypto.subtle) {
        const digest = await window.crypto.subtle.digest("SHA-256", combined);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
      }
    } catch {
      // Fallback below
    }
    return `h_${file.size}_${file.lastModified}`;
  }

  async function ingestFileList(fileList) {
    const arr = Array.from(fileList || []);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const f = arr[i];
      const rel = f.webkitRelativePath || f.name;
      if (Engine.shouldIgnorePath(rel, true)) continue;
      const dot = f.name.lastIndexOf(".");
      const ext = dot > 0 ? f.name.slice(dot).toLowerCase() : "";
      let snippet = "";
      if (TEXT_EXTS.has(ext) || (f.type && f.type.startsWith("text/"))) {
        try { snippet = await f.slice(0, 8192).text(); } catch { snippet = ""; }
      }
      const fastHash = await computeBrowserFastHash(f);
      out.push({
        id: `f_${i + 1}`,
        name: f.name,
        rel_path: rel,
        size: f.size,
        mtime_ms: f.lastModified || Date.now(),
        fast_hash: fastHash,
        snippet,
      });
    }
    scannedFiles = out;
    recomputePlan();
  }

  function recomputePlan() {
    if (!scannedFiles.length) {
      planItems = [];
      els.workspace.classList.add("hidden");
      return;
    }
    const profile = PROFILES[els.profile.value];
    const naming = els.naming.value === "profile_default" ? null : els.naming.value;
    planItems = Engine.classifyFiles(scannedFiles, profile, naming);
    els.workspace.classList.remove("hidden");
    els.ollamaStatus.textContent = "";
    renderTable();
  }

  function renderTable() {
    const q = els.filter.value.trim().toLowerCase();
    const active = planItems.filter((i) => !i.excluded);
    const folders = new Set(active.map((i) => i.target_folder));
    const dups = planItems.filter((i) => i.is_duplicate).length;
    const excluded = planItems.filter((i) => i.excluded).length;

    els.statFiles.textContent = String(active.length);
    els.statFolders.textContent = String(folders.size);
    els.statDups.textContent = String(dups);
    els.statExcluded.textContent = String(excluded);

    const visible = planItems.filter((it) => {
      if (!q) return true;
      return (
        it.source_rel.toLowerCase().includes(q) ||
        it.dest_rel.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    });

    els.tbody.innerHTML = visible
      .map((it) => {
        const engPill = it.engine.startsWith("ollama")
          ? `<span class="pill-tag pill-ollama">${esc(it.engine)}</span>`
          : `<span class="pill-tag">${esc(it.category)}</span>`;
        const dupPill = it.is_duplicate ? `<span class="pill-tag pill-dup">DUP</span>` : "";
        return `
          <tr class="${it.excluded ? "excluded" : ""}">
            <td><input type="checkbox" data-toggle="${esc(it.id)}" ${it.excluded ? "" : "checked"} aria-label="Include ${esc(it.original_name)}"></td>
            <td class="mono">${esc(it.source_rel)}</td>
            <td class="mono dest-path">${esc(it.dest_rel)}</td>
            <td>${engPill}${dupPill}<div style="font-size:11px;color:var(--dim);margin-top:4px;">${Math.round(it.confidence * 100)}% · ${esc(it.engine)}</div></td>
            <td style="color:var(--muted);font-size:12.5px;">${esc(it.reasoning)}</td>
          </tr>`;
      })
      .join("");
  }

  function downloadBlob(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function refineViaOllama() {
    const active = planItems.filter((i) => !i.excluded).slice(0, 20);
    if (!active.length) return;
    const endpoint = els.ollamaUrl.value.trim().replace(/\/+$/, "");
    const model = els.ollamaModel.value.trim() || "llama3.2";
    const profile = PROFILES[els.profile.value];
    const catSummary = profile.categories.map((c) => ({ name: c.name, targetFolder: c.targetFolder }));

    const fileLookup = new Map(scannedFiles.map((f) => [f.id, f]));
    const payloadFiles = active.map((it) => ({
      id: it.id,
      name: it.original_name,
      snippet: (fileLookup.get(it.id)?.snippet || "").slice(0, 320),
    }));

    els.btnOllama.disabled = true;
    els.ollamaStatus.className = "status-msg";
    els.ollamaStatus.textContent = `Sending ${active.length} file metadata summaries to local Ollama (${model})...`;

    try {
      const prompt =
        "Classify each file into the best category and suggest a clean snake_case filename keeping its original extension. " +
        'Return ONLY JSON: {"items":[{"id":"...","category":"...","targetFolder":"...","proposedName":"...","reasoning":"...","confidence":0.9}]}.\n' +
        `Categories: ${JSON.stringify(catSummary)}\nFiles: ${JSON.stringify(payloadFiles)}`;

      const res = await fetch(`${endpoint}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false, format: "json", system: "Output strict valid JSON only." }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const parsed = JSON.parse(data.response || "{}");
      const rows = Array.isArray(parsed) ? parsed : parsed.items || [];

      const byId = new Map(planItems.map((i) => [i.id, i]));
      let updated = 0;
      for (const r of rows) {
        const it = byId.get(String(r.id || ""));
        if (!it) continue;
        const folder = Engine.sanitizeRelFolder(r.targetFolder || it.target_folder);
        const origDot = it.original_name.lastIndexOf(".");
        const origExt = origDot > 0 ? it.original_name.slice(origDot).toLowerCase() : "";
        let prop = Engine.sanitizeFilename(r.proposedName || it.proposed_filename, it.proposed_filename);
        if (origExt && !prop.toLowerCase().endsWith(origExt)) {
          const pd = prop.lastIndexOf(".");
          prop = (pd > 0 ? prop.slice(0, pd) : prop) + origExt;
        }
        it.category = String(r.category || it.category);
        it.target_folder = folder;
        it.proposed_filename = prop;
        it.dest_rel = `${folder}/${prop}`;
        it.reasoning = String(r.reasoning || `Classified via Ollama (${model})`);
        it.confidence = typeof r.confidence === "number" ? Math.round(r.confidence * 100) / 100 : 0.88;
        it.engine = `ollama:${model}`;
        updated += 1;
      }
      Engine.resolveCollisions(planItems);
      renderTable();
      els.ollamaStatus.textContent = `Refined ${updated} file(s) locally via Ollama (${model}).`;
    } catch (err) {
      els.ollamaStatus.className = "status-msg err";
      els.ollamaStatus.textContent =
        `Could not reach local Ollama (${err.message}). Start Ollama with OLLAMA_ORIGINS="*" for browser access, or run \`taco-sort apply --ollama ${model}\` from the CLI.`;
    } finally {
      els.btnOllama.disabled = false;
    }
  }

  // Wire events
  populateProfiles();
  els.profile.addEventListener("change", () => { updateProfileDescription(); recomputePlan(); });
  els.naming.addEventListener("change", () => { updateCliSnippet(); recomputePlan(); });
  els.ollamaModel.addEventListener("input", updateCliSnippet);
  els.filter.addEventListener("input", renderTable);

  els.btnPickFolder.addEventListener("click", () => els.folderInput.click());
  els.btnPickFiles.addEventListener("click", () => els.filesInput.click());
  els.folderInput.addEventListener("change", (e) => ingestFileList(e.target.files));
  els.filesInput.addEventListener("change", (e) => ingestFileList(e.target.files));

  els.btnSample.addEventListener("click", () => {
    scannedFiles = SAMPLE_FILES.map((s) => ({ ...s }));
    recomputePlan();
  });
  els.btnClear.addEventListener("click", () => {
    scannedFiles = [];
    els.folderInput.value = "";
    els.filesInput.value = "";
    recomputePlan();
  });

  els.dropzone.addEventListener("dragover", (e) => { e.preventDefault(); els.dropzone.classList.add("dragover"); });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragover"));
  els.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files) ingestFileList(e.dataTransfer.files);
  });

  els.tbody.addEventListener("change", (e) => {
    const id = e.target.getAttribute("data-toggle");
    if (!id) return;
    const item = planItems.find((i) => i.id === id);
    if (item) {
      item.excluded = !e.target.checked;
      renderTable();
    }
  });

  els.btnPs1.addEventListener("click", () => downloadBlob("organize.ps1", Engine.generatePowerShellScript(planItems, els.profile.value), "text/plain"));
  els.btnSh.addEventListener("click", () => downloadBlob("organize.sh", Engine.generateBashScript(planItems, els.profile.value), "text/x-shellscript"));
  els.btnCsv.addEventListener("click", () => downloadBlob("tacosort-plan.csv", Engine.generateCsv(planItems), "text/csv"));
  els.btnJson.addEventListener("click", () => downloadBlob("tacosort-plan.json", JSON.stringify({ profile: els.profile.value, items: planItems }, null, 2), "application/json"));
  els.btnOllama.addEventListener("click", refineViaOllama);
})();