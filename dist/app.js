const SVG_NS = "http://www.w3.org/2000/svg";
const COLORS = ["#69f0c2", "#d8ff7b", "#78c7ff", "#ff9078", "#b99cff", "#ffd66e", "#7ee7e7"];

const DEMO = {
  title: "Why coral reefs bleach",
  subtitle: "A partnership breaks when heat turns helpful algae into a source of stress.",
  nodes: [
    { id: "coral", label: "Coral animal", role: "Host", detail: "A colony of tiny animals builds the reef skeleton and gives algae a protected home.", signal: "Pale tissue", analogy: "The apartment building: it provides shelter, but depends on its tenants for most of its food." },
    { id: "algae", label: "Symbiotic algae", role: "Energy partner", detail: "Microscopic algae photosynthesize inside coral cells and share energy-rich compounds with the host.", signal: "Photosynthetic efficiency", analogy: "Solar panels that also pay rent in sugar." },
    { id: "heat", label: "Heat stress", role: "Trigger", detail: "Sustained unusually warm water disrupts the algae's photosynthetic machinery.", signal: "Temperature anomaly", analogy: "A machine running above its safe temperature starts producing damaging by-products." },
    { id: "oxidants", label: "Reactive oxygen", role: "Stress signal", detail: "Damaged photosynthesis leaks reactive molecules that can injure both partners.", signal: "Oxidative stress", analogy: "Sparks escaping from an overheated motor." },
    { id: "expulsion", label: "Algae expelled", role: "Emergency response", detail: "The coral ejects algae and loses their pigments, revealing the white skeleton beneath.", signal: "Loss of colour", analogy: "Evicting a dangerous tenant also removes the household's main income." },
    { id: "recovery", label: "Recovery or death", role: "Outcome", detail: "If heat falls soon, algae can return. Prolonged bleaching leaves coral starved and vulnerable.", signal: "Heat duration", analogy: "A battery can bridge a short outage, but not an endless one." }
  ],
  edges: [
    { from: "algae", to: "coral", label: "feeds" },
    { from: "heat", to: "algae", label: "disrupts" },
    { from: "algae", to: "oxidants", label: "leaks" },
    { from: "oxidants", to: "expulsion", label: "triggers" },
    { from: "expulsion", to: "recovery", label: "leads to" },
    { from: "coral", to: "recovery", label: "condition" }
  ],
  scenes: [
    { title: "The baseline partnership", body: "In normal temperatures, algae capture light energy and share much of it with the coral. The coral supplies shelter and raw materials.", takeaway: "Both partners benefit from the exchange.", highlights: ["coral", "algae"] },
    { title: "Heat disrupts the algae", body: "A marine heatwave damages photosynthesis. The stressed algae begin producing reactive oxygen faster than the partnership can manage it.", takeaway: "The trigger is sustained heat, not bright colour loss itself.", highlights: ["heat", "algae", "oxidants"] },
    { title: "The coral pulls the emergency brake", body: "To reduce chemical damage, the coral expels many algae. With pigments gone, its transparent tissue reveals the white skeleton.", takeaway: "Bleaching is an emergency response—not instant death.", highlights: ["oxidants", "expulsion", "coral"] },
    { title: "Duration decides the outcome", body: "Cooling can let algae recolonize. If stress lasts, the coral loses its main energy supply and may succumb to disease or starvation.", takeaway: "The length and intensity of stress control recovery.", highlights: ["expulsion", "recovery", "heat"] }
  ],
  quiz: [
    { question: "Why does a bleached coral look white?", options: ["Its skeleton dissolves", "It expels pigmented algae", "It stops reflecting blue light"], answer: 1, explanation: "Coral tissue is mostly transparent; without the algae's pigments, the white calcium-carbonate skeleton shows through." },
    { question: "What most improves the chance of recovery?", options: ["The heat stress ends quickly", "The coral expels more algae", "The water becomes more acidic"], answer: 0, explanation: "Shorter stress leaves the coral enough energy to survive while algae return." }
  ]
};

const state = { spec: DEMO, activeNode: 0, scene: 0, timer: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const connect = $("#polliConnect");
const appKey = window.PHENOMENA_CONFIG?.appKey || "";

if (/^pk_[A-Za-z0-9_-]+$/.test(appKey) && !appKey.includes("REPLACE")) {
  connect.setAttribute("app-key", appKey);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function requireWallet() {
  if (!/^pk_[A-Za-z0-9_-]+$/.test(appKey) || appKey.includes("REPLACE")) {
    showToast("Phenomena Lab is waiting for its Pollinations App Key.");
    return false;
  }
  if (!connect.apiKey) {
    showToast("Connect your Pollinations wallet first.");
    connect.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }
  return true;
}

function setBusy(busy) {
  $("#loadingCard").hidden = !busy;
  $("#generateButton").disabled = busy;
  if (busy) $("#workspace").hidden = true;
}

async function callPollinations(topic, audience, lens) {
  const system = `You create accurate, compact interactive science explainers. Return ONLY valid JSON, no Markdown. Explain for a ${audience} through a ${lens} lens. Use cautious language where science is uncertain. The JSON schema is:
{"title":"short title","subtitle":"one sentence","nodes":[{"id":"lowercase_unique_id","label":"2-4 words","role":"2-4 words","detail":"2 concise sentences","signal":"observable indicator","analogy":"one helpful mental model"}],"edges":[{"from":"node_id","to":"node_id","label":"1-3 word relation"}],"scenes":[{"title":"short scene title","body":"2 concise sentences","takeaway":"one sentence","highlights":["node_id"]}],"quiz":[{"question":"question","options":["A","B","C"],"answer":0,"explanation":"one sentence"}]}
Requirements: exactly 6 nodes, 6-8 edges, exactly 4 scenes in causal or temporal order, exactly 2 quiz questions. Each scene highlights 2-4 valid nodes. No HTML. No citations or URLs. Keep the whole JSON under 5000 characters.`;

  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${connect.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-5.4-nano",
      reasoning_effort: "low",
      max_tokens: 3500,
      temperature: 0.35,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Build an interactive explainer for: ${topic}` }
      ]
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `Request failed (${response.status})`);
  return payload?.choices?.[0]?.message?.content || "";
}

function parseSpec(raw) {
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) throw new Error("The model did not return an explorable structure. Try again.");
  const spec = JSON.parse(raw.slice(first, last + 1));
  if (!spec.title || !Array.isArray(spec.nodes) || spec.nodes.length < 4 || !Array.isArray(spec.scenes) || spec.scenes.length < 2) {
    throw new Error("The generated explanation was incomplete. Try again.");
  }
  const ids = new Set(spec.nodes.map((node, index) => {
    node.id = String(node.id || `node_${index}`).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
    return node.id;
  }));
  spec.edges = (spec.edges || []).filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  spec.scenes = spec.scenes.slice(0, 6).map((scene) => ({ ...scene, highlights: (scene.highlights || []).filter((id) => ids.has(id)) }));
  spec.quiz = (spec.quiz || []).slice(0, 3).filter((item) => Array.isArray(item.options) && item.options.length >= 2);
  return spec;
}

function nodePositions(count) {
  const cx = 360, cy = 280;
  if (count <= 1) return [{ x: cx, y: cy }];
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const radiusX = index % 2 ? 250 : 220;
    const radiusY = index % 2 ? 190 : 215;
    return { x: cx + Math.cos(angle) * radiusX, y: cy + Math.sin(angle) * radiusY };
  });
}

function svgElement(name, attrs = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function labelLines(label) {
  const words = String(label).split(/\s+/);
  if (words.length < 3) return [words.join(" ")];
  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
}

function renderMap() {
  const spec = state.spec;
  const positions = nodePositions(spec.nodes.length);
  const byId = Object.fromEntries(spec.nodes.map((node, index) => [node.id, { ...positions[index], index }]));
  const edgeLayer = $("#edgeLayer");
  const nodeLayer = $("#nodeLayer");
  edgeLayer.replaceChildren();
  nodeLayer.replaceChildren();

  spec.edges.forEach((edge, index) => {
    const from = byId[edge.from], to = byId[edge.to];
    if (!from || !to) return;
    const line = svgElement("line", { x1: from.x, y1: from.y, x2: to.x, y2: to.y, class: "edge-line", "data-edge": index, "data-from": edge.from, "data-to": edge.to });
    const label = svgElement("text", { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 8, class: "edge-label", "data-edge": index, "data-from": edge.from, "data-to": edge.to });
    label.textContent = edge.label || "affects";
    edgeLayer.append(line, label);
  });

  spec.nodes.forEach((node, index) => {
    const pos = positions[index];
    const group = svgElement("g", { class: "map-node", transform: `translate(${pos.x} ${pos.y})`, tabindex: "0", role: "button", "aria-label": `${node.label}: ${node.role}`, "data-id": node.id, style: `--node-color:${COLORS[index % COLORS.length]}` });
    group.append(svgElement("circle", { r: 55 }));
    const lines = labelLines(node.label);
    lines.forEach((lineText, lineIndex) => {
      const text = svgElement("text", { y: lines.length === 1 ? -2 : -11 + lineIndex * 15 });
      text.textContent = lineText;
      group.append(text);
    });
    const role = svgElement("text", { y: 27, class: "node-role" });
    role.textContent = node.role;
    group.append(role);
    const activate = () => { state.activeNode = index; renderDetails(); updateHighlights(); };
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") activate(); });
    nodeLayer.append(group);
  });
  $("#nodeCount").textContent = `${spec.nodes.length} PARTS`;
}

function renderDetails() {
  const node = state.spec.nodes[state.activeNode] || state.spec.nodes[0];
  $("#detailIndex").textContent = String(state.activeNode + 1).padStart(2, "0");
  $("#detailTitle").textContent = node.label;
  $("#detailBody").textContent = node.detail;
  $("#detailRole").textContent = node.role;
  $("#detailSignal").textContent = node.signal || "System change";
  $("#detailAnalogy").textContent = node.analogy || "Think of this as one part of a connected system.";
}

function updateHighlights() {
  const scene = state.spec.scenes[state.scene] || state.spec.scenes[0];
  const highlighted = new Set(scene.highlights || []);
  $$(".map-node").forEach((node) => {
    const id = node.dataset.id;
    node.classList.toggle("active", id === state.spec.nodes[state.activeNode]?.id);
    node.classList.toggle("dim", highlighted.size > 0 && !highlighted.has(id));
  });
  $$(".edge-line,.edge-label").forEach((edge) => {
    const active = highlighted.has(edge.dataset.from) && highlighted.has(edge.dataset.to);
    edge.classList.toggle("active", active);
    edge.classList.toggle("dim", highlighted.size > 0 && !active);
  });
}

function renderScene() {
  const scene = state.spec.scenes[state.scene] || state.spec.scenes[0];
  $("#sceneTitle").textContent = scene.title;
  $("#sceneBody").textContent = scene.body;
  $("#sceneTakeaway").textContent = scene.takeaway;
  $("#sceneCurrent").textContent = String(state.scene + 1).padStart(2, "0");
  $("#sceneSlider").value = String(state.scene);
  updateHighlights();
}

function renderQuiz() {
  const mount = $("#quizMount");
  mount.replaceChildren();
  state.spec.quiz.forEach((item, questionIndex) => {
    const card = document.createElement("article");
    card.className = "quiz-card";
    const title = document.createElement("h3");
    title.textContent = `${String(questionIndex + 1).padStart(2, "0")}. ${item.question}`;
    const options = document.createElement("div");
    options.className = "quiz-options";
    const feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.textContent = "Choose the outcome you expect.";
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-option";
      button.textContent = option;
      button.addEventListener("click", () => {
        [...options.children].forEach((child, index) => {
          child.disabled = true;
          child.classList.toggle("correct", index === Number(item.answer));
        });
        if (optionIndex !== Number(item.answer)) button.classList.add("wrong");
        feedback.textContent = item.explanation;
      });
      options.append(button);
    });
    card.append(title, options, feedback);
    mount.append(card);
  });
}

function renderSpec(spec, scroll = true) {
  stopPlayback();
  state.spec = spec;
  state.activeNode = 0;
  state.scene = 0;
  $("#resultTitle").textContent = spec.title;
  $("#resultSubtitle").textContent = spec.subtitle;
  const slider = $("#sceneSlider");
  slider.max = String(Math.max(0, spec.scenes.length - 1));
  $("#sceneTotal").textContent = String(spec.scenes.length).padStart(2, "0");
  const labels = $("#sceneLabels");
  labels.replaceChildren();
  spec.scenes.forEach((scene, index) => {
    const span = document.createElement("span");
    span.textContent = index === 0 || index === spec.scenes.length - 1 ? scene.title : String(index + 1).padStart(2, "0");
    labels.append(span);
  });
  renderMap();
  renderDetails();
  renderScene();
  renderQuiz();
  $("#workspace").hidden = false;
  if (scroll) $("#workspace").scrollIntoView({ behavior: "smooth", block: "start" });
}

function stopPlayback() {
  window.clearInterval(state.timer);
  state.timer = null;
  $("#playButton").textContent = "▶";
  $("#playButton").setAttribute("aria-label", "Play scenes");
}

function togglePlayback() {
  if (state.timer) { stopPlayback(); return; }
  $("#playButton").textContent = "Ⅱ";
  $("#playButton").setAttribute("aria-label", "Pause scenes");
  state.timer = window.setInterval(() => {
    state.scene = (state.scene + 1) % state.spec.scenes.length;
    renderScene();
  }, 3200);
}

async function generate() {
  const topic = $("#topicInput").value.trim();
  if (!topic) { showToast("Write a science topic first."); $("#topicInput").focus(); return; }
  if (!requireWallet()) return;
  setBusy(true);
  try {
    const raw = await callPollinations(topic, $("#audienceSelect").value, $("#lensSelect").value);
    renderSpec(parseSpec(raw));
    showToast("Explorer ready. Click a node or move through the scenes.");
  } catch (error) {
    showToast(error.message || "The model could not build this explorer.");
  } finally {
    setBusy(false);
  }
}

$("#generateButton").addEventListener("click", generate);
$("#topicInput").addEventListener("keydown", (event) => { if (event.key === "Enter") generate(); });
$("#sceneSlider").addEventListener("input", (event) => { stopPlayback(); state.scene = Number(event.target.value); renderScene(); });
$("#playButton").addEventListener("click", togglePlayback);
$("#resetButton").addEventListener("click", () => { stopPlayback(); $("#workspace").hidden = true; $("#topicInput").value = ""; $("#topicInput").focus(); $("#lab").scrollIntoView({ behavior: "smooth" }); });
$("#loadDemoTop").addEventListener("click", () => renderSpec(DEMO));
$$('[data-topic]').forEach((button) => button.addEventListener("click", () => { $("#topicInput").value = button.dataset.topic; $("#topicInput").focus(); }));
connect.addEventListener("change", () => showToast(connect.apiKey ? "Wallet connected. The lab is ready." : "Wallet disconnected."));

renderSpec(DEMO, false);

