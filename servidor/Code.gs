/**
 * Finanças Casa RL — servidor do casal (Google Apps Script)
 * Guarda os dados do app em arquivos dentro da pasta do Google Drive abaixo.
 * Nada fica no GitHub: só o código do app.
 */
const PASTA_ID = '1xrMmr60lXx-4YbP4R6ixqAeha8A9EDA2';   // pasta do Drive do casal
const ARQ_BASE = 'casa-rl-base.json';                    // faturas importadas, cartões, foto
const ARQ_ESTADO = 'casa-rl-estado.json';                // rendas, fixos, metas, lançamentos, classificações

/** Rode esta função UMA vez (botão ▶ Executar) para criar as chaves de acesso. */
function configurar() {
  const p = PropertiesService.getScriptProperties();
  const nova = () => Utilities.getUuid().replace(/-/g, '').slice(0, 24);
  if (!p.getProperty('CHAVE_LUIS')) p.setProperty('CHAVE_LUIS', nova());
  if (!p.getProperty('CHAVE_ROANNA')) p.setProperty('CHAVE_ROANNA', nova());
  pasta_(); // confere o acesso à pasta
  Logger.log('Chave do Luis:   ' + p.getProperty('CHAVE_LUIS'));
  Logger.log('Chave da Roanna: ' + p.getProperty('CHAVE_ROANNA'));
}

function doGet(e) { return resposta_(tratar_((e && e.parameter) || {})); }
function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents); } catch (x) {}
  return resposta_(tratar_(p));
}

function tratar_(p) {
  const u = quem_(p.key);
  if (!u) return { ok: false, error: 'chave inválida' };
  switch (p.op) {
    case 'load': {
      const base = ler_(ARQ_BASE);
      return { ok: true, who: u.who, role: u.role, base: base ? JSON.parse(base) : null, state: estado_() };
    }
    case 'state': {
      const st = estado_();
      if (p.since != null && String(st.rev) === String(p.since)) return { ok: true, same: true, rev: st.rev };
      return { ok: true, state: st };
    }
    case 'save': {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        const st = estado_();
        const a = p.areas || {};
        Object.keys(a).forEach(k => { st.areas[k] = a[k]; });
        mesclar_(st.novos, p.novos);
        mesclar_(st.faturas, p.faturas);
        st.rev = (Number(st.rev) || 0) + 1;
        st.atualizado = new Date().toISOString();
        st.por = u.who;
        const txt = JSON.stringify(st);
        gravar_(ARQ_ESTADO, txt);
        gravar_('backup-' + Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd') + '.json', txt); // cópia do dia
        return { ok: true, rev: st.rev };
      } finally { lock.releaseLock(); }
    }
    case 'init': {
      if (u.role !== 'admin') return { ok: false, error: 'chave sem permissão para importar' };
      gravar_(ARQ_BASE, JSON.stringify(p.base));
      if (p.state && !ler_(ARQ_ESTADO)) { p.state.rev = 1; gravar_(ARQ_ESTADO, JSON.stringify(p.state)); }
      return { ok: true };
    }
  }
  return { ok: false, error: 'operação desconhecida' };
}

function mesclar_(alvo, mud) {
  if (!mud) return;
  const up = mud.up || {};
  Object.keys(up).forEach(id => { alvo[id] = up[id]; });
  (mud.del || []).forEach(id => { delete alvo[id]; });
}
function quem_(key) {
  if (!key) return null;
  const p = PropertiesService.getScriptProperties();
  if (key === p.getProperty('CHAVE_LUIS')) return { who: 'Luis', role: 'admin' };
  if (key === p.getProperty('CHAVE_ROANNA')) return { who: 'Roanna', role: 'membro' };
  return null;
}
function estado_() {
  const t = ler_(ARQ_ESTADO);
  const st = t ? JSON.parse(t) : {};
  st.rev = st.rev || 0; st.areas = st.areas || {}; st.novos = st.novos || {}; st.faturas = st.faturas || {};
  return st;
}
function pasta_() { return DriveApp.getFolderById(PASTA_ID); }
function ler_(nome) {
  const it = pasta_().getFilesByName(nome);
  return it.hasNext() ? it.next().getBlob().getDataAsString('UTF-8') : null;
}
function gravar_(nome, txt) {
  const it = pasta_().getFilesByName(nome);
  if (it.hasNext()) it.next().setContent(txt);
  else pasta_().createFile(nome, txt, MimeType.PLAIN_TEXT);
}
function resposta_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
