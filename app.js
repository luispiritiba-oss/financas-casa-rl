function matchAllCompat(str,re){const out=[];let m;re.lastIndex=0;while((m=re.exec(str))!==null){out.push(m);if(m[0]==="")re.lastIndex++}return out}
window.APP=function(DATA,BK){
let S={v:1,novos:[],importadas:[]};
let saveTimer=null, dirty=false;
const ME=BK.who||"Luis";
let flushing=false, flushAgain=false, renderPending=false, syncSt="conectando", REV=null, RO=false;
const AREAS=["fones","rendas","fixos","metas","tetos","cls","clsDesc"];
const LAST={}, LASTN={}, LASTF={};

const MES=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const fmt=v=>(v<0?"-":"")+"R$ "+Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt0=v=>(v<0?"-":"")+"R$ "+Math.round(Math.abs(v)).toLocaleString("pt-BR");
const ml=m=>{const[y,mo]=m.split("-");return MES[+mo-1]+"/"+y.slice(2)};
const addM=(m,n)=>{let[y,mo]=m.split("-").map(Number);mo+=n;while(mo>12){mo-=12;y++}while(mo<1){mo+=12;y--}return y+"-"+String(mo).padStart(2,"0")};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const monthsDiff=(a,b)=>{const[y1,m1]=a.split("-").map(Number),[y2,m2]=b.split("-").map(Number);return (y2-y1)*12+(m2-m1)};
const CATS=["Moradia","Contas da casa","Mercado","Alimentação fora","Combustível e veículo","Transporte","Saúde","Academia e bem-estar","Educação","Casa e manutenção","Vestuário","Eletrônicos e compras online","Lazer e eventos","Viagem e hospedagem","Assinaturas","Pets","Cuidados pessoais","Pagamentos a pessoas (identificar)","Tarifas e juros","Impostos e contribuições","Empréstimos e dívidas","Investimentos","Outros"];
const DEF_FIXOS=[];
function fixos(){return S.fixos||DEF_FIXOS}
const DEF_FONES={};
function fones(){return S.fones||DEF_FONES}
const fmtFone=n=>{const d=String(n||"").replace(/\D/g,"").replace(/^55/,"");return d.length>=10?`(${d.slice(0,2)}) ${d.slice(2,d.length-4)}-${d.slice(-4)}`:n};
function quemPorRemetente(snd){const d=String(snd).replace(/\D/g,"");if(d.length>=8){const f=fones();for(const w in f){if(String(f[w]).replace(/\D/g,"").slice(-8)===d.slice(-8))return w}}
  if(/roanna/i.test(snd))return "Roanna"; if(/lu[ií]s/i.test(snd))return "Luis"; return null}
const DEF_RENDAS=[{quem:"Luis",tipo:"Salário",desc:"Salário líquido",valor:0},{quem:"Roanna",tipo:"Salário",desc:"Salário líquido",valor:0}];
function rendas(){return S.rendas||DEF_RENDAS}
function rendaWho(w){w=w||who;return rendas().filter(r=>w==="Casal"||r.quem===w).reduce((a,r)=>a+(+r.valor||0),0)}
function fixosWho(){return fixos().filter(f=>who==="Casal"||f.quem===who)}
const sumF=(l)=>l.reduce((a,f)=>a+(+f.valor||0),0);
const CARDS=DATA.cards;
const CCOL=['#2a78d6','#eb6834','#1baf7a','#eda100'];
const CGRAD=['linear-gradient(135deg,#7a0c1e,#c8102e)','linear-gradient(135deg,#4a0f6b,#820ad1)','linear-gradient(135deg,#0b3a82,#1c5cab)','linear-gradient(135deg,#2b0a40,#5b1a86)'];
const short=n=>n.replace("Bradesco Visa Infinite","Bradesco").replace("Ourocard Elo BB","Ourocard");
let who="Casal";

// ---------- data
// Mês de referência = mês dos GASTOS. A fatura que vence em novembro corresponde aos gastos de outubro.
if(DATA.refv!==2){DATA.tx.forEach(r=>{r[5]=addM(r[5],-1)});DATA.faturas.forEach(f=>{f.m=addM(f.m,-1)});DATA.parcelas.forEach(p=>{p.base=addM(p.base,-1)});DATA.refv=2}
const isCardName=n=>CARDS.some(c=>c.nome===n);
applyState(BK.state,true); RO=BK.role==="leitura";
const BASE_FAT=DATA.faturas.slice(), BASE_PAR=DATA.parcelas.slice();
let IMP=[], COMPLETE=[];
function rebuild(){
  const imps=S.importadas||[];
  DATA.faturas=BASE_FAT.concat(imps.map(f=>({c:f.c,m:f.m,total:f.total,app:true})));
  IMP=DATA.tx.map(r=>({data:r[0],desc:r[1],cat:r[2],valor:r[3],parc:r[4],ref:r[5],final:r[6],tipo:r[7],cartao:CARDS[r[8]].nome,holder:r[9],origem:"Fatura"}));
  imps.forEach(f=>f.rows.forEach(r=>IMP.push({data:r[0],desc:r[1],cat:r[2],valor:r[3],parc:r[4],ref:r[5],final:r[6],tipo:r[7],cartao:CARDS[f.c].nome,holder:CARDS[f.c].holder,origem:"Fatura"})));
  IMP.sort((a,b)=>a.ref<b.ref?1:a.ref>b.ref?-1:(a.data<b.data?1:-1));
  let par=BASE_PAR.slice();
  CARDS.forEach((c,ci)=>{const last=imps.filter(f=>f.c===ci).sort((a,b)=>a.m<b.m?1:-1)[0];const base=BASE_PAR.find(p=>p.c===ci);const baseM=base?base.base:(BASE_FAT.filter(f=>f.c===ci).map(f=>f.m).sort().pop()||"");
    if(last&&last.m>baseM){par=par.filter(p=>p.c!==ci).concat(last.par.map(p=>Object.assign({c:ci,base:last.m},p)))}});
  DATA.parcelas=par;
  COMPLETE=[...new Set(DATA.faturas.map(f=>f.m))].filter(m=>CARDS.every((c,i)=>DATA.faturas.find(f=>f.c===i&&f.m===m))).sort();
}
function rawTx(){return (S.novos||[]).map(t=>Object.assign({holder:t.quem||"Casal"},t)).concat(IMP)}
function allTx(){return rawTx().filter(t=>t.tipo!=="Ajuste"&&(who==="Casal"||t.holder===who||t.holder==="Casal"))}
function cards(){return CARDS}
function cardsWho(){return CARDS.map((c,i)=>Object.assign({i},c)).filter(c=>who==="Casal"||c.holder===who)}
function refMonth(data,cartao){
  const d=new Date(data+"T12:00:00"); const m=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  const c=CARDS.find(c=>c.nome===cartao);
  if(!c||!c.fech||!c.venc) return m;
  return addM(m,(d.getDate()>=c.fech?1:0)+(c.venc<=c.fech?1:0)-1);
}
function months(){const set=new Set(DATA.faturas.map(f=>f.m));(S.novos||[]).forEach(t=>set.add(t.ref));return [...set].sort()}
const fatOf=(ci,m)=>DATA.faturas.find(f=>f.c===ci&&f.m===m);
function missing(m){return cardsWho().filter(c=>!fatOf(c.i,m)).map(c=>short(c.nome))}
rebuild();
function pendentes(){
  const d=new Date(), today=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const nowM=today.slice(0,7), out=[];
  CARDS.forEach((c,ci)=>{const last=DATA.faturas.filter(f=>f.c===ci).map(f=>f.m).sort().pop();if(!last)return;
    for(let m=addM(last,1);m<=nowM;m=addM(m,1)){const close=closeDateOf(ci,m);if(close<=today)out.push({c:ci,m,close})}});
  return out;
}
function byCat(m){const o={};CATS.forEach(c=>o[c]=0);allTx().forEach(t=>{if(t.ref===m)o[t.cat]=(o[t.cat]||0)+t.valor});return o}
function totalMonth(m,tx){return (tx||allTx()).filter(t=>t.ref===m).reduce((a,t)=>a+t.valor,0)}
function avgCat(){const o={};CATS.forEach(c=>o[c]=0);allTx().forEach(t=>{if(COMPLETE.includes(t.ref)&&t.origem==="Fatura")o[t.cat]+=t.valor});CATS.forEach(c=>o[c]/=COMPLETE.length||1);return o}
function avgTotal(){const a=avgCat();return CATS.reduce((s,c)=>s+a[c],0)}
function teto(c){const k=who+"|"+c;if(S.tetos&&S.tetos[k]!=null)return +S.tetos[k];if(who==="Casal"&&S.tetos&&S.tetos[c]!=null)return +S.tetos[c];return 0}
function status(g,t){const a=S.alerta||0.8;if(t<=0&&g<=0)return null;if(t<=0||g/t>=1)return"over";if(g/t>=a)return"att";return"ok"}
const STL={ok:"✓ OK",att:"! Atenção",over:"✕ Estourou"};
function parcelasMes(m,ci){
  let s=0;
  DATA.parcelas.forEach(p=>{if(ci!=null&&p.c!==ci)return;if(who!=="Casal"&&CARDS[p.c].holder!==who)return;const off=monthsDiff(p.base,m);if(off>=1&&off<=p.n-p.k)s+=p.v});
  (S.novos||[]).forEach(t=>{if(ci!=null&&t.cartao!==CARDS[ci].nome)return;if(t.parcN>1){const off=monthsDiff(t.ref,m);if(off>=1&&off<t.parcN)s+=t.valor}});
  return s;
}

// ---------- importador de faturas (PDF lido no próprio aparelho)
const RULES=(DATA.rules||[]).map(r=>[r[0],new RegExp(r[1],r[2]?"i":"")]);
function categorize(d){for(const [c,rx] of RULES){if(rx.test(d))return c}return "Outros"}
const FIXRX=/CONTA VIVO|SPOTIFY|AmazonPrime|Amazonprime|APPLE\.?COM|Apple\.Com|APPLECOM|CONDOMIN|NETFLIX|Netflix|PJB\*Condom|Wellhub|Ultravioleta/;
const NUM=s=>parseFloat(String(s).replace(/\./g,"").replace(",","."));
const MONP={JAN:1,FEV:2,MAR:3,ABR:4,MAI:5,JUN:6,JUL:7,AGO:8,SET:9,OUT:10,NOV:11,DEZ:12};
const iso=(y,m,d)=>y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
function yfix(d,m,ref){let y=+ref.slice(0,4);let s=iso(y,m,d);if(s>ref)s=iso(y-1,m,d);return s}
let pdfjsP=null;
async function loadPdfjs(){
  if(pdfjsP) return pdfjsP;
  pdfjsP=(async()=>{
    const tryLoad=async(base)=>{await import(base+"pdf.worker.min.mjs");const lib=await import(base+"pdf.min.mjs");return lib};
    return await tryLoad("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/");
  })();
  pdfjsP.catch(()=>{pdfjsP=null});
  return pdfjsP;
}
async function pdfLines(buf){
  const lib=await loadPdfjs();
  const doc=await lib.getDocument({data:buf,isEvalSupported:false}).promise;
  const pages=[];
  for(let p=1;p<=doc.numPages;p++){
    const pg=await doc.getPage(p); const tc=await pg.getTextContent();
    const items=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],w:i.width}));
    const rows=[];
    items.sort((a,b)=>b.y-a.y||a.x-b.x).forEach(it=>{let r=rows.find(r=>Math.abs(r.y-it.y)<4);if(!r){r={y:it.y,it:[]};rows.push(r)}r.it.push(it)});
    rows.sort((a,b)=>b.y-a.y).forEach(r=>r.it.sort((a,b)=>a.x-b.x));
    pages.push(rows);
  }
  return pages;
}
const joinItems=its=>{let s="",end=null;its.forEach(i=>{if(end!=null)s+=(i.x-end>2?"  ":"");s+=i.s;end=i.x+i.w});return s.replace(/\s+$/,"")};
function pageText(rows){return rows.map(r=>joinItems(r.it)).join("\n").normalize("NFC")}

function parseBradesco(pages){
  const all=pages.map(pageText).join("\n");
  const k=all.match(/(20\d{6})(20\d{6})0000/); if(!k) throw new Error("não achei as datas da fatura Bradesco");
  const fech=k[1].replace(/(\d{4})(\d\d)(\d\d)/,"$1-$2-$3"), venc=k[2].replace(/(\d{4})(\d\d)(\d\d)/,"$1-$2-$3");
  const g=re=>{const m=all.match(re);return m?NUM(m[1]):null};
  const anterior=g(/Saldo anterior[\s.]*R\$\s*([\d.]+,\d\d)/), total=g(/\(=\)\s*Total[\s.]*R\$\s*([\d.]+,\d\d)/);
  const lim=g(/Limite de compras[\s\S]{0,200}?R\$\s*([\d.]+,\d\d)/);
  let final=((all.match(/Número do Cartão\s+\d{4} XXXX XXXX (\d{4})/)||[])[1])||""; const tx=[];
  pages.slice(1).forEach(rows=>rows.forEach(r=>{
    const its=r.it.filter(i=>i.x<355); if(!its.length)return;
    const line=joinItems(its);
    const cm=line.match(/Cartão\s+(\d{4})\s+XXXX\s+XXXX\s+(\d{4})/); if(cm){final=cm[2];return}
    if(its.length>1&&its[its.length-1].s.trim()==="-"){const t=its.pop();its[its.length-1]={...its[its.length-1],s:its[its.length-1].s.trim()+"-"}}
    const last=its[its.length-1];
    const dm=line.match(/^\s*(\d\d)\/(\d\d)\s+(.*)$/); if(!dm)return;
    const vm=last.s.trim().match(/^([\d.]+,\d\d)\s*(-?)$/); if(!vm||last.x<290)return;
    const mid=its.slice(0,-1);
    const desc=joinItems(mid.filter(i=>i.x<200)).replace(/^\s*\d\d\/\d\d\s*/,"").trim();
    const city=joinItems(mid.filter(i=>i.x>=200&&i.x<250)).trim();
    const v=NUM(vm[1])*(vm[2]?-1:1);
    const pm=desc.match(/(\d\d)\/(\d\d)$/);
    tx.push({data:yfix(+dm[1],+dm[2],fech),desc:desc.replace(/\s*\d\d\/\d\d$/,"").replace(/\s+/g," ").trim(),valor:v,parc:pm?pm[1]+"/"+pm[2]:"",final,cidade:city});
  }));
  return {tipo:"Bradesco",card:0,venc,anterior,total,limite:lim,tx,pay:t=>/^PAGTO\./.test(t.desc)};
}
function parseNubank(pages){
  const all=pages.map(pageText).join("\n");
  const vm=all.match(/Data de vencimento:\s*(\d\d) (\w{3}) (\d{4})/); if(!vm) throw new Error("não achei o vencimento do Nubank");
  const venc=iso(+vm[3],MONP[vm[2].toUpperCase()],+vm[1]);
  const roanna=/ROANNA/i.test(all);
  const res=all.slice(Math.max(0,all.indexOf("RESUMO DA FATURA ATUAL")));
  const g=re=>{const m=res.match(re);return m?NUM(m[1]):null};
  const anterior=g(/Fatura anterior\s+R\$\s*([\d.,]+)/), total=g(/Total a pagar\s+R\$\s*([\d.,]+)/);
  const lim=g(/Limite total\s+R\$\s*[\d.,]+\s+R\$\s*([\d.,]+)/);
  const tx=[]; const start=Math.max(0,all.indexOf("TRANSAÇÕES"));
  all.slice(start).split("\n").forEach(line=>{
    const m=line.match(/^\s*(\d\d) (JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(?:•+ (\d{4})\s+)?(.+?)\s+([−-]?)\s*R\$\s*([\d.,]+)\s*$/);
    if(!m)return;
    let desc=m[4].replace(/\s+/g," ").trim(); const pm=desc.match(/ - Parcela (\d+)\/(\d+)$/);
    desc=desc.replace(/ - Parcela \d+\/\d+$/,"");
    tx.push({data:yfix(+m[1],MONP[m[2]],venc),desc,valor:NUM(m[6])*(m[5]?-1:1),parc:pm?String(pm[1]).padStart(2,"0")+"/"+String(pm[2]).padStart(2,"0"):"",final:m[3]||"",cidade:""});
  });
  return {tipo:"Nubank",card:roanna?1:3,venc,anterior,total,limite:lim,tx,pay:t=>/^Pagamento em/.test(t.desc)};
}
function parseOurocard(pages){
  const all=pages.map(pageText).join("\n");
  const fm=all.match(/Fatura fechada em\s*(\d\d)\/(\d\d)\/(\d{4})/); if(!fm) throw new Error("não achei o fechamento do Ourocard");
  const fech=iso(+fm[3],+fm[2],+fm[1]);
  const ds=matchAllCompat(pageText(pages[0]),/(\d\d)\/(\d\d)\/(20\d\d)/g).map(m=>iso(+m[3],+m[2],+m[1])).filter(d=>d>fech).sort();
  const venc=ds[0]; if(!venc) throw new Error("não achei o vencimento do Ourocard");
  const g=re=>{const m=all.match(re);return m?NUM(m[1]):null};
  const anterior=g(/Saldo fatura anterior\s+R\$\s*([\d.,]+)/i), total=g(/Total da Fatura\s+R\$\s*([\d.,]+)/), lim=g(/Limite único\s+R\$\s*([\d.,]+)/);
  const finalOC=((all.match(/Final\s+(\d{4})/)||[])[1])||""; const tx=[]; const st=Math.max(0,all.indexOf("Lançamentos nesta fatura"));
  all.slice(st).split("\n").forEach(line=>{
    const m=line.match(/^\s*(\d\d)\/(\d\d)\s+(.+?)\s+BR\s+R\$\s*(-?[\d.,]+)\s*$/); if(!m)return;
    let desc=m[3].replace(/\s+/g," ").trim(); let parc="",city="";
    const pm=desc.match(/ PARC (\d+)\/(\d+)/); if(pm){parc=pm[1]+"/"+pm[2];city=desc.slice(pm.index+pm[0].length).trim();desc=desc.slice(0,pm.index).trim()}
    const v=NUM(m[4].replace("-",""))*(m[4].startsWith("-")?-1:1);
    tx.push({data:yfix(+m[1],+m[2],venc),desc,valor:v,parc,final:finalOC,cidade:city});
  });
  return {tipo:"Ourocard",card:2,venc,anterior,total,limite:lim,tx,pay:t=>/^PGTO/.test(t.desc)};
}
async function parseFatura(buf){
  const pages=await pdfLines(buf);
  const t=pages.map(pageText).join("\n");
  let r;
  if(/Nu Pagamentos|Nubank/i.test(t)) r=parseNubank(pages);
  else if(/OUROCARD|Ourocard/.test(t)) r=parseOurocard(pages);
  else if(/(20\d{6})(20\d{6})0000/.test(t)&&/Bradesco|BRADESCO|Livelo|Número do Cartão/.test(t)) r=parseBradesco(pages);
  else throw new Error("formato não reconhecido (aceita Bradesco, Nubank e Ourocard)");
  if(r.anterior==null||r.total==null) throw new Error("não consegui ler o resumo da fatura");
  const soma=r.tx.reduce((a,t)=>a+t.valor,0);
  r.esperado=+(r.total-r.anterior).toFixed(2); r.soma=+soma.toFixed(2); r.ok=Math.abs(r.soma-r.esperado)<0.01;
  r.pag=-r.tx.filter(r.pay).reduce((a,t)=>a+t.valor,0);
  r.m=r.venc.slice(0,7);
  r.rows=r.tx.filter(t=>!r.pay(t)).map(t=>{const c=categorize(t.desc);const tipo=c.startsWith("Ajustes")?"Ajuste":t.parc?"Parcelado":FIXRX.test(t.desc)?"Fixo":"Variável";return [t.data,t.desc,c,+t.valor.toFixed(2),t.parc,r.m,t.final,tipo]});
  return r;
}
window.__parseFatura=parseFatura;


const dueMonth=m=>addM(m,1);
function dueLabel(ci,m){const d=dueMonth(m);return String(CARDS[ci].venc).padStart(2,"0")+"/"+d.slice(5,7)}
function closeDateOf(ci,m){const c=CARDS[ci];const due=dueMonth(m);const cm=c.venc<=c.fech?addM(due,-1):due;return cm+"-"+String(c.fech).padStart(2,"0")}
function todayISO(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function bills(m){
  return cardsWho().map(c=>{
    const f=fatOf(c.i,m); const dia=dueLabel(c.i,m);
    const parc=parcelasMes(m,c.i);
    if(f) return {c,dia,v:f.total,st:"real",parc};
    const prev=DATA.faturas.filter(x=>x.c===c.i&&x.m<m).sort((a,b)=>a.m<b.m?1:-1).slice(0,3);
    const avg=prev.length?prev.reduce((a,x)=>a+x.total,0)/prev.length:0;
    const manual=(S.novos||[]).filter(t=>t.cartao===c.nome&&t.ref===m).reduce((a,t)=>a+t.valor,0);
    const v=Math.max(avg,parc+manual);
    const st=closeDateOf(c.i,m)<=todayISO()?"falta":"aberta";
    return {c,dia,v,st,parc,avg,n:prev.length};
  }).sort((a,b)=>a.c.venc-b.c.venc);
}
const sumB=l=>l.reduce((a,b)=>a+b.v,0);
const ESS_DEF={"Moradia":"E","Contas da casa":"E","Mercado":"E","Combustível e veículo":"E","Transporte":"E","Saúde":"E","Educação":"E","Impostos e contribuições":"E","Empréstimos e dívidas":"E","Tarifas e juros":"E","Pets":"E","Investimentos":"I"};
const CLS_L={E:"Essencial",N:"Não essencial",I:"Investimento"}, CLS_S={E:"Essencial",N:"Não essencial",I:"Invest."};
function txKey(t){return t.id||[t.cartao,t.data,t.desc,t.valor,t.parc].join("|")}
function clsOf(t){const o=(S.cls||{})[txKey(t)];if(o)return o;const d=(S.clsDesc||{})[t.desc];if(d)return d;const x=ESS_DEF[t.cat]||"N";return x==="I"?"E":x}
function clsSet(t){return !!((S.cls||{})[txKey(t)]||(S.clsDesc||{})[t.desc])}
function clsFix(f){return f.cls||ESS_DEF[f.cat]||"N"}
let clsTimer=null;
document.addEventListener('click',e=>{const b=e.target.closest('[data-delid]');if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.dataset.armed!=="1"){b.dataset.armed="1";b.textContent="Apagar?";b.style.color="#9c1c1c";setTimeout(()=>{if(b.isConnected){b.dataset.armed="";b.textContent="🗑";b.style.color=""}},3000);return}
  const id=b.dataset.delid;S.novos=(S.novos||[]).filter(t=>t.id!==id);if(S.cls)delete S.cls[id];render();save("Lançamento apagado")});
document.addEventListener('click',e=>{const b=e.target.closest('.cls[data-k]');if(!b)return;e.preventDefault();e.stopPropagation();
  const nx=b.dataset.fx?({E:"N",N:"I",I:"E"}[b.dataset.c]||"E"):(b.dataset.c==="E"?"N":"E");S.cls=S.cls||{};S.cls[b.dataset.k]=nx;b.dataset.c=nx;b.className="cls cls-"+nx;b.textContent=CLS_S[nx];
  clearTimeout(clsTimer);clsTimer=setTimeout(()=>save("Classificação salva"),900)});

// ---------- persistence
// ---------- nuvem: servidor do casal no Google Drive (Apps Script)
function areaBody(k){return k==="tetos"?{tetos:S.tetos||{},alerta:S.alerta||0.8}:{v:S[k]==null?null:S[k]}}
function applyArea(k,d){if(k==="tetos"){S.tetos=d.tetos||{};S.alerta=d.alerta||0.8}else S[k]=d.v}
const fId=f=>"f"+f.c+"_"+f.m;
function setSync(st){syncSt=st;const e=document.getElementById('sync');if(e)e.innerHTML=st==="ok"?"☁️ sincronizado":st==="conectando"?"⏳ conectando…":st==="salvando"?"⏳ salvando…":st==="ro"?"👁️ só leitura":"⚠️ sem conexão"}
async function api(op,body){
  if(op==="state"){const r=await fetch(BK.url+"?op=state&key="+encodeURIComponent(BK.key)+(REV!=null?"&since="+REV:""),{cache:"no-store"});return r.json()}
  const r=await fetch(BK.url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(Object.assign({op,key:BK.key},body||{}))});return r.json();
}
function save(msg){
  try{localStorage.setItem('casaRL_pending',JSON.stringify({areas:AREAS.reduce((o,k)=>{o[k]=areaBody(k);return o},{}),novos:S.novos,importadas:S.importadas}))}catch(e){}
  if(msg) toast(msg);
  if(RO){toast("Este acesso é só leitura.");return}
  dirty=true; clearTimeout(saveTimer); saveTimer=setTimeout(flush,600);
}
async function flush(){
  if(flushing){flushAgain=true;return} flushing=true; setSync("salvando");
  const areas={}; AREAS.forEach(k=>{const j=JSON.stringify(areaBody(k)); if(j!==LAST[k]) areas[k]=areaBody(k)});
  const nUp={}, nDel=[], fUp={}, fDel=[];
  const cur={}; (S.novos||[]).forEach(t=>{if(t.id)cur[t.id]=t});
  for(const id in cur){if(JSON.stringify(cur[id])!==LASTN[id]) nUp[id]=cur[id]} for(const id in LASTN) if(!cur[id]) nDel.push(id);
  const cf={}; (S.importadas||[]).forEach(f=>{cf[fId(f)]=f});
  for(const id in cf){if(JSON.stringify(cf[id])!==LASTF[id]) fUp[id]=cf[id]} for(const id in LASTF) if(!cf[id]) fDel.push(id);
  try{
    const r=await api("save",{areas,novos:{up:nUp,del:nDel},faturas:{up:fUp,del:fDel}});
    if(!r||!r.ok){ if(r&&/chave/i.test(r.error||"")){RO=true;setSync("ro");toast("Chave sem permissão para salvar.")} else throw new Error(r&&r.error||"falha"); }
    else{
      Object.keys(areas).forEach(k=>LAST[k]=JSON.stringify(areas[k]));
      Object.keys(nUp).forEach(id=>LASTN[id]=JSON.stringify(nUp[id])); nDel.forEach(id=>delete LASTN[id]);
      Object.keys(fUp).forEach(id=>LASTF[id]=JSON.stringify(fUp[id])); fDel.forEach(id=>delete LASTF[id]);
      REV=r.rev; dirty=false; try{localStorage.removeItem('casaRL_pending')}catch(e){}
      setSync("ok");
    }
  }catch(e){setSync("off"); setTimeout(()=>{if(dirty)flush()},5000)}
  finally{flushing=false; if(flushAgain){flushAgain=false;flush()}}
}
function applyState(st,silent){
  if(!st) return;
  const A=st.areas||{};
  AREAS.forEach(k=>{if(A[k]){const j=JSON.stringify(A[k]); if(j!==LAST[k]){LAST[k]=j; applyArea(k,A[k])}}});
  const nv=st.novos||{}; Object.keys(LASTN).forEach(k=>delete LASTN[k]); Object.keys(nv).forEach(id=>LASTN[id]=JSON.stringify(nv[id]));
  S.novos=Object.values(nv).sort((a,b)=>a.data<b.data?1:-1);
  const fv=st.faturas||{}; Object.keys(LASTF).forEach(k=>delete LASTF[k]); Object.keys(fv).forEach(id=>LASTF[id]=JSON.stringify(fv[id]));
  S.importadas=Object.values(fv);
  S.importadas.forEach(f=>{if(f.refv!==2){f.m=addM(f.m,-1);(f.rows||[]).forEach(r=>{r[5]=f.m});f.refv=2}});
  (S.novos||[]).forEach(t=>{if(t.refv!==2){if(isCardName(t.cartao))t.ref=addM(t.ref,-1);t.refv=2}});
  REV=st.rev;
  if(!silent) remoteRender();
}
function remoteRender(){
  const a=document.activeElement;
  if(a&&a.closest&&a.closest('#root')&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)){renderPending=true;return}
  clearTimeout(remoteRender._t); remoteRender._t=setTimeout(()=>{rebuild();render()},120);
}
document.addEventListener('focusout',()=>{if(renderPending){renderPending=false;setTimeout(()=>{const a=document.activeElement;if(!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))){rebuild();render()}else renderPending=true},200)}});
async function poll(){
  if(dirty||flushing||document.hidden) return;
  try{const r=await api("state"); if(r&&r.ok){ if(!r.same) applyState(r.state); if(syncSt!=="ok"&&!RO) setSync("ok")} else if(r&&/chave/i.test(r.error||"")){setSync("ro")}}catch(e){setSync("off")}
}
function confirmTap(b){if(b.dataset.armed==="1")return true;b.dataset.armed="1";const t=b.textContent;b.textContent="Toque de novo para confirmar";setTimeout(()=>{b.dataset.armed="";b.textContent=t},3000);return false}
function toast(t){const el=document.getElementById('toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2800)}

// ---------- mini SVG charts (no external deps)
const NS="http://www.w3.org/2000/svg";
function niceMax(v){if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v)));const n=v/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p}
function svgEl(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e}
function tipFor(box){let t=box.querySelector('.ctip');if(!t){t=document.createElement('div');t.className='ctip';box.appendChild(t)}return t}
function showTip(box,html,x,y){const t=tipFor(box);t.innerHTML=html;t.style.display='block';const bw=box.clientWidth;const tw=t.offsetWidth;let l=x+12;if(l+tw>bw)l=x-tw-12;if(l<0)l=4;t.style.left=l+'px';t.style.top=Math.max(0,y-t.offsetHeight-8)+'px'}
function hideTip(box){const t=box.querySelector('.ctip');if(t)t.style.display='none'}
function legend(box,items){if(!items||items.length<2)return;const d=document.createElement('div');d.className='clegend';d.innerHTML=items.map(i=>`<span><i style="background:${i.color};${i.line?'height:2px;':''}${i.dash?'background:repeating-linear-gradient(90deg,'+i.color+' 0 4px,transparent 4px 7px);height:2px;':''}"></i>${esc(i.name)}</span>`).join('');box.prepend(d)}
function vbar(id,o){
  const box=document.getElementById(id);if(!box)return;box.innerHTML='';
  legend(box,o.legend);
  const W=box.clientWidth||360,H=(box.clientHeight||220)-(o.legend&&o.legend.length>1?22:0);
  const m={l:46,r:6,t:8,b:24},iw=W-m.l-m.r,ih=H-m.t-m.b;
  const n=o.labels.length;
  const tot=o.labels.map((_,i)=>o.series.reduce((a,s)=>a+(s.data[i]||0),0));
  const mx=niceMax(Math.max(...(o.stacked?tot:o.series.flatMap(s=>s.data.map(v=>v||0))),o.ref||0)*1.05);
  const svg=svgEl('svg',{width:W,height:H,role:'img','aria-label':o.title||'gráfico'});
  for(let k=0;k<=4;k++){const v=mx*k/4,y=m.t+ih-ih*k/4;svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:y,y2:y,stroke:k?'#efeee9':'#cfcec7','stroke-width':1}));const tx=svgEl('text',{x:m.l-6,y:y+4,'text-anchor':'end','font-size':10,fill:'#8a8984'});tx.textContent=moneyTick(v);svg.appendChild(tx)}
  const bw=Math.min(o.maxBar||22,iw/n*0.62),step=iw/n;
  const every=Math.ceil(n/8);
  o.labels.forEach((l,i)=>{const cx=m.l+step*i+step/2;
    if(i%every===0){const t=svgEl('text',{x:cx,y:H-6,'text-anchor':'middle','font-size':10,fill:'#52514e'});t.textContent=l;svg.appendChild(t)}
    let base=0;
    o.series.forEach((s,si)=>{const v=s.data[i];if(v==null||v===0)return;const h=ih*v/mx;const y=m.t+ih-ih*(base+v)/mx;
      const top=!o.stacked||si===o.series.length-1||o.series.slice(si+1).every(ss=>!ss.data[i]);
      const r=top?Math.min(4,h/2):0;
      const x=o.stacked?cx-bw/2:cx-bw/2;
      const p=`M${x},${y+h} V${y+r} Q${x},${y} ${x+r},${y} H${x+bw-r} Q${x+bw},${y} ${x+bw},${y+r} V${y+h} Z`;
      svg.appendChild(svgEl('path',{d:p,fill:(s.colors?s.colors[i]:s.color),stroke:o.stacked?'#fff':'none','stroke-width':o.stacked?1.5:0}));
      base+=o.stacked?v:0;});
  });
  if(o.ref){const y=m.t+ih-ih*o.ref/mx;svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:y,y2:y,stroke:'#52514e','stroke-width':1.5,'stroke-dasharray':'4 4'}));
    if(o.refLabel){const t=svgEl('text',{x:W-m.r,y:y-4,'text-anchor':'end','font-size':10,fill:'#52514e'});t.textContent=o.refLabel;svg.appendChild(t)}}
  // hit areas
  o.labels.forEach((l,i)=>{const r=svgEl('rect',{x:m.l+step*i,y:m.t,width:step,height:ih,fill:'transparent',style:o.onClick?'cursor:pointer':''});
    r.addEventListener('mousemove',e=>{const b=box.getBoundingClientRect();showTip(box,`<b>${esc(l)}</b>`+o.series.filter(s=>s.data[i]!=null).map(s=>`<div>${s.name?esc(s.name)+': ':''}${fmt(s.data[i]||0)}</div>`).join('')+(o.stacked&&o.series.length>1?`<div style="opacity:.8">Total: ${fmt(tot[i])}</div>`:'')+(o.tipExtra?o.tipExtra(i):''),e.clientX-b.left,e.clientY-b.top)});
    r.addEventListener('mouseleave',()=>hideTip(box));
    r.addEventListener('click',e=>{if(o.onClick)o.onClick(i);else{const b=box.getBoundingClientRect();r.dispatchEvent(new MouseEvent('mousemove',{clientX:e.clientX,clientY:e.clientY}))}});
    svg.appendChild(r)});
  box.appendChild(svg);
}
function hbar(id,o){
  const box=document.getElementById(id);if(!box)return;box.innerHTML='';
  legend(box,o.legend);
  const rowH=30,m={l:Math.min(150,(box.clientWidth||360)*0.42),r:52,t:4,b:20};
  const W=box.clientWidth||360,H=m.t+m.b+rowH*o.labels.length,iw=W-m.l-m.r;
  const mx=niceMax(Math.max(...o.a,...o.b)*1.02);
  const svg=svgEl('svg',{width:W,height:H,role:'img','aria-label':o.title||'gráfico'});
  for(let k=0;k<=4;k++){const x=m.l+iw*k/4;svg.appendChild(svgEl('line',{x1:x,x2:x,y1:m.t,y2:H-m.b,stroke:k?'#efeee9':'#cfcec7'}));if(k%2===0){const t=svgEl('text',{x,y:H-6,'text-anchor':'middle','font-size':10,fill:'#8a8984'});t.textContent=moneyTick(mx*k/4);svg.appendChild(t)}}
  o.labels.forEach((l,i)=>{const y=m.t+rowH*i;
    const t=svgEl('text',{x:m.l-8,y:y+rowH/2+4,'text-anchor':'end','font-size':11,fill:'#0b0b0b'});t.textContent=l.length>22?l.slice(0,21)+'…':l;svg.appendChild(t);
    const tw=iw*o.b[i]/mx;if(tw>0)svg.appendChild(svgEl('rect',{x:m.l,y:y+5,width:tw,height:rowH-10,rx:4,fill:'#e6e5e0'}));
    const gw=iw*o.a[i]/mx;if(gw>0)svg.appendChild(svgEl('rect',{x:m.l,y:y+rowH/2-5,width:Math.max(2,gw),height:10,rx:4,fill:o.colors[i]}));
    const v=svgEl('text',{x:m.l+Math.max(gw,tw)+4,y:y+rowH/2+4,'font-size':10,fill:'#52514e'});v.textContent=o.valLabel(i);svg.appendChild(v);
    const hit=svgEl('rect',{x:0,y,width:W,height:rowH,fill:'transparent',style:'cursor:pointer'});
    hit.addEventListener('mousemove',e=>{const b=box.getBoundingClientRect();showTip(box,o.tip(i),e.clientX-b.left,e.clientY-b.top)});
    hit.addEventListener('mouseleave',()=>hideTip(box));
    hit.addEventListener('click',()=>o.onClick&&o.onClick(i));
    svg.appendChild(hit)});
  box.style.height='auto';box.appendChild(svg);
}
function lineChart(id,o){
  const box=document.getElementById(id);if(!box)return;box.innerHTML='';
  legend(box,o.series.map(s=>({name:s.name,color:s.color,line:!s.dash,dash:s.dash})));
  const W=box.clientWidth||360,H=(box.clientHeight||220)-22;
  const m={l:50,r:8,t:8,b:24},iw=W-m.l-m.r,ih=H-m.t-m.b,n=o.labels.length;
  const mx=niceMax(Math.max(...o.series.flatMap(s=>s.data.filter(v=>v!=null)))*1.05);
  const X=i=>m.l+(n<2?0:iw*i/(n-1)),Y=v=>m.t+ih-ih*v/mx;
  const svg=svgEl('svg',{width:W,height:H,role:'img','aria-label':o.title||'gráfico'});
  for(let k=0;k<=4;k++){const y=m.t+ih-ih*k/4;svg.appendChild(svgEl('line',{x1:m.l,x2:W-m.r,y1:y,y2:y,stroke:k?'#efeee9':'#cfcec7'}));const t=svgEl('text',{x:m.l-6,y:y+4,'text-anchor':'end','font-size':10,fill:'#8a8984'});t.textContent=moneyTick(mx*k/4);svg.appendChild(t)}
  const every=Math.ceil(n/6);o.labels.forEach((l,i)=>{if((i%every===0&&(n-1-i>=Math.max(2,every*0.8)||i===0))||i===n-1){const t=svgEl('text',{x:X(i),y:H-6,'text-anchor':i===0?'start':i===n-1?'end':'middle','font-size':10,fill:'#52514e'});t.textContent=l;svg.appendChild(t)}});
  o.series.forEach(s=>{const pts=s.data.map((v,i)=>v==null?null:[X(i),Y(v)]).filter(Boolean);if(!pts.length)return;
    const d='M'+pts.map(p=>p.join(',')).join(' L');
    if(s.fill)svg.appendChild(svgEl('path',{d:d+` L${pts[pts.length-1][0]},${m.t+ih} L${pts[0][0]},${m.t+ih} Z`,fill:s.fill}));
    svg.appendChild(svgEl('path',{d,fill:'none',stroke:s.color,'stroke-width':2,'stroke-dasharray':s.dash?'5 4':'none','stroke-linejoin':'round'}));});
  const cross=svgEl('line',{y1:m.t,y2:m.t+ih,stroke:'#8a8984','stroke-width':1,visibility:'hidden'});svg.appendChild(cross);
  const hit=svgEl('rect',{x:m.l,y:m.t,width:iw,height:ih,fill:'transparent'});
  const mv=e=>{const b=box.getBoundingClientRect();const px=e.clientX-b.left;const i=Math.max(0,Math.min(n-1,Math.round((px-m.l)/iw*(n-1))));cross.setAttribute('x1',X(i));cross.setAttribute('x2',X(i));cross.setAttribute('visibility','visible');
    showTip(box,`<b>${esc(o.labels[i])}</b>`+o.series.filter(s=>s.data[i]!=null).map(s=>`<div><i class="sw" style="background:${s.color}"></i>${esc(s.name)}: ${fmt0(s.data[i])}</div>`).join(''),X(i),e.clientY-b.top)};
  hit.addEventListener('mousemove',mv);hit.addEventListener('click',mv);hit.addEventListener('mouseleave',()=>{cross.setAttribute('visibility','hidden');hideTip(box)});
  svg.appendChild(hit);box.appendChild(svg);
}


// ---------- shell
const TABS=["inicio","gastos","cartoes","metas","lancar","plano"];
let tab=(location.hash||"#inicio").slice(1); if(!TABS.includes(tab))tab="inicio";
let curM=(()=>{const d=new Date(),nm=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");const withF=[...new Set(DATA.faturas.map(f=>f.m))].filter(m=>m<=nm).sort();if(withF.length)return withF[withF.length-1];return months().includes(nm)?nm:(COMPLETE[COMPLETE.length-1]||months()[months().length-1])})();
const moneyTick=v=>v>=1000?"R$ "+(v/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" mil":"R$ "+Math.round(v);
const ICONS={
inicio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
gastos:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
cartoes:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>',
plano:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v9l7.8 4.5"/><circle cx="12" cy="12" r="9"/></svg>',
metas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>'};

function render(){
  const ms=months();
  const root=document.getElementById('root');
  root.innerHTML=`<div class="app">
  <header class="top" style="${DATA.photo?`background:linear-gradient(180deg,rgba(14,61,55,.80),rgba(20,69,63,.94) 55%,#14453f),url(${DATA.photo}) center 30%/cover`:""}"><div class="row"><div style="display:flex;align-items:center;gap:10px"><div class="avatar" role="img" aria-label="${esc(DATA.casal||"")}" style="${DATA.avatar?`background-image:url(${DATA.avatar})`:""}"></div><div><div class="hello">${esc(DATA.casal||"Casal")} · <span id="sync"></span></div><div class="title">Finanças Casa RL</div></div></div>
  <select class="monthsel" id="msel" aria-label="Mês de referência">${ms.map(m=>`<option value="${m}" ${m===curM?"selected":""}>${ml(m)}</option>`).join("")}</select></div>
  <div class="who" role="tablist">${["Casal","Luis","Roanna"].map(w=>`<button data-w="${w}" class="${who===w?"on":""}">${w}</button>`).join("")}</div>
  <div class="hero" id="hero"></div></header>
  <main>${TABS.map(s=>`<section class="sec" id="s-${s}"></section>`).join("")}</main>
  <nav class="tabs">
   ${["inicio","gastos"].map(k=>`<button data-t="${k}" class="${tab===k?"on":""}">${ICONS[k]}${k==="inicio"?"Início":"Gastos"}</button>`).join("")}
   <button data-t="lancar" class="add ${tab==="lancar"?"on":""}"><span class="plus"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg></span>Lançar</button>
   ${[["cartoes","Cartões"],["metas","Metas"],["plano","Plano"]].map(([k,l])=>`<button data-t="${k}" class="${tab===k?"on":""}">${ICONS[k]}${l}</button>`).join("")}
  </nav></div><div class="toast" id="toast"></div>`;
  setSync(syncSt);
  document.getElementById('msel').onchange=e=>{curM=e.target.value;renderTab()};
  root.querySelectorAll('.who button').forEach(b=>b.onclick=()=>{who=b.dataset.w;render()});
  root.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;try{history.replaceState(null,"","#"+tab)}catch(e){location.hash=tab}render();window.scrollTo(0,0)});
  renderTab();
}
function renderTab(){
  ensureReserva();
  document.querySelectorAll('.sec').forEach(s=>s.classList.toggle('on',s.id==="s-"+tab));
  renderHero();
  ({inicio:renderInicio,gastos:renderGastos,cartoes:renderCartoes,metas:renderMetas,lancar:renderLancar,plano:renderPlano})[tab]();
}
function renderHero(){
  const B=bills(curM), bT=sumB(B), fx=sumF(fixosWho(),true), est=B.filter(b=>b.st!=="real").length;
  document.getElementById('hero').innerHTML=`<div class="lbl">${who==="Casal"?"Gastos do casal":"Gastos de "+who} de ${ml(curM)} · faturas que vencem em ${ml(addM(curM,1))} + fixos</div>
   <div class="big">${fmt(fx+bT)}</div>
   <div class="sub">Faturas ${fmt0(bT)}${est?` (${est} estimada${est>1?"s":""})`:""} + fixos ${fmt0(fx)}</div>`;
}

// ---------- INÍCIO
function renderInicio(){
  const el=document.getElementById('s-inicio');
  const bc=byCat(curM), tot=totalMonth(curM);
  const tTot=CATS.reduce((a,c)=>a+teto(c),0);
  const renda=rendaWho();
  const fx=fixosWho(), fxT=sumF(fx), fxFora=sumF(fx,true);
  const cw=cardsWho(); const lim=cw.reduce((a,c)=>a+c.limite,0);
  const fatT=sumB(bills(curM));
  const gTot=fxFora+sumB(bills(curM)); const gStat=renda?(gTot/renda>=1?"over":gTot/renda>=(S.alerta||.8)?"att":"ok"):null;
  const nextP=parcelasMes(addM(curM,1));
  const pend=pendentes();
  const B=bills(curM), bT=sumB(B);
  el.innerHTML=`${pend.length?`<div class="card" style="display:flex;gap:10px;align-items:center;background:#fff8e6"><div style="font-size:22px">📄</div><div style="flex:1;font-size:13px"><b>${pend.length} fatura(s) para enviar</b><br><span style="color:var(--ink2)">${pend.slice(0,3).map(p=>esc(short(CARDS[p.c].nome))+" "+ml(p.m)).join(", ")}${pend.length>3?"…":""}</span></div><button class="btn sm" id="goUp">Enviar</button></div>`:""}
  <div class="card" style="border-left:4px solid var(--brand2)"><h3>Gastos de ${ml(curM)} · pagamentos em ${ml(addM(curM,1))}${who!=="Casal"?" · "+who:""}</h3><p class="hint">Fatura de cada cartão com os gastos de ${ml(curM)}, no dia em que vence + gastos fixos</p>
   <table class="t">
    ${B.map(b=>`<tr><td><b style="font-variant-numeric:tabular-nums">${b.dia}</b> · ${esc(b.c.nome)}<div style="font-size:11px;color:var(--muted)">${b.st==="real"?"✓ fatura fechada":b.st==="falta"?"⚠ fechou, falta enviar o PDF · estimativa":"⏳ fatura em aberto · estimativa"}${b.st!=="real"?` (média das últimas ${b.n} = ${fmt0(b.avg)}; parcelas já previstas ${fmt0(b.parc)})`:b.parc?` · inclui ${fmt0(b.parc)} de parcelas`:""}</div></td><td class="n">${b.st==="real"?"":"~"}${fmt(b.v)}</td></tr>`).join("")}
    <tr><td>Faturas dos cartões</td><td class="n">${fmt(bT)}</td></tr>
    <tr><td>Gastos fixos <a href="#" id="goFix2" style="font-size:12px;color:var(--brand2)">ver</a></td><td class="n">${fmt(fxFora)}</td></tr>
    <tr><td><b>Total do mês</b></td><td class="n"><b style="font-size:16px">${fmt(fxFora+bT)}</b></td></tr>
    ${renda?`<tr><td style="color:var(--ink2)">% da renda (${fmt0(renda)})</td><td class="n"><span class="pill ${gStat}">${Math.round((fxFora+bT)/renda*100)}%</span></td></tr><tr><td style="color:var(--ink2)">${renda-fxFora-bT>=0?"Sobra":"Falta"}</td><td class="n" style="color:${renda-fxFora-bT<0?"#9c1c1c":"inherit"}">${fmt(Math.abs(renda-fxFora-bT))}</td></tr>`:""}
   </table></div>
  <div class="card"><h3>Alerta de gasto geral · ${ml(curM)}</h3><p class="hint">Gastos fixos + faturas que vencem no mês × renda${who!=="Casal"?" de "+who:" do casal"}</p>
   ${gStat?`<div class="alert" style="padding-top:0"><div class="ic ${gStat==="ok"?"att":gStat}" style="${gStat==="ok"?"background:var(--goodbg);color:#0a6b0a":""}">${gStat==="over"?"✕":gStat==="att"?"!":"✓"}</div><div style="flex:1"><b>${fmt(gTot)}</b> de ${fmt(renda)}<br><span style="color:var(--ink2)">${gStat==="over"?"Passou "+fmt(gTot-renda)+" da renda":"Restam "+fmt(renda-gTot)}</span></div><span class="pill ${gStat}">${STL[gStat]} · ${Math.round(gTot/renda*100)}%</span></div>
   <div class="bar" style="height:10px"><i style="width:${Math.min(100,gTot/renda*100)}%;background:${gStat==="over"?"var(--crit)":gStat==="att"?"#eda100":"var(--good)"}"></i></div>
   <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-top:6px"><span>Fixos ${fmt0(fxFora)} + faturas ${fmt0(gTot-fxFora)}</span><span>aviso em ${Math.round((S.alerta||.8)*100)}%</span></div>`:`<div class="note">Informe a renda em Plano › Rendas para ativar o alerta.</div>`}
  </div>
  <div class="kpis" style="margin-bottom:14px">
   <div class="kpi"><div class="l">Compras nos cartões</div><div class="v">${fmt0(tot)}</div><div class="s">lançadas com venc. em ${ml(curM)}</div><div class="bar"><i style="width:${Math.min(100,avgTotal()?tot/avgTotal()*100:0)}%"></i></div></div>
   <div class="kpi"><div class="l">Limite usado (${cw.length} ${cw.length>1?"cartões":"cartão"})</div><div class="v">${lim?(fatT/lim*100).toFixed(0):0}%</div><div class="s">${fmt0(fatT)} de ${fmt0(lim)}</div><div class="bar"><i style="width:${Math.min(100,lim?fatT/lim*100:0)}%"></i></div></div>
   <div class="kpi"><div class="l">Sobra do mês</div><div class="v" style="color:${renda&&renda-gTot<0?"#9c1c1c":"inherit"}">${renda?fmt0(renda-gTot):"—"}</div><div class="s">${renda?"renda − fixos − faturas":"informe a renda em Plano"}</div></div>
   <div class="kpi"><div class="l">Parcelas em ${ml(addM(curM,1))}</div><div class="v">${fmt0(nextP)}</div><div class="s">já comprometido</div></div>
  </div>
  ${metasOrd().length?`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Metas</h3><button class="btn sm ghost" id="goMeta">Ver metas</button></div>
   ${metasOrd().map(m=>{const p=m.alvo?Math.min(100,(+m.guardado||0)/m.alvo*100):0;return `<div style="margin:10px 0 0"><div style="display:flex;justify-content:space-between;font-size:13px"><b>${esc(m.nome)}</b><span>${fmt0(+m.guardado||0)} de ${fmt0(+m.alvo||0)} · ${Math.round(p)}%</span></div><div class="bar"><i style="width:${p}%;background:var(--brand2)"></i></div></div>`}).join("")}</div>`:""}
  <div class="card"><h3>Gasto por mês e por cartão</h3><p class="hint">Por mês dos gastos · tracejado = média de ${ml(COMPLETE[0])} a ${ml(COMPLETE[COMPLETE.length-1])}. Toque num mês para abri-lo.</p><div class="chart" style="height:250px" id="cMes"></div></div>`;
  const g=document.getElementById('goMeta'); if(g) g.onclick=()=>{tab="metas";render()};
  document.getElementById('goFix2').onclick=e=>{e.preventDefault();tab="gastos";gView="fix";render()};
  const gu=document.getElementById('goUp'); if(gu) gu.onclick=()=>{tab="lancar";render()};
  const ms=months(); const tx=allTx();
  vbar('cMes',{labels:ms.map(ml),stacked:true,legend:cw.map(c=>({name:short(c.nome),color:CCOL[c.i]})),
    series:cw.map(c=>({name:short(c.nome),color:CCOL[c.i],data:ms.map(m=>+tx.filter(t=>t.ref===m&&t.cartao===c.nome).reduce((a,t)=>a+t.valor,0).toFixed(2))})),
    ref:avgTotal(),refLabel:"média "+fmt0(avgTotal()),
    tipExtra:i=>{const mi=missing(ms[i]);return mi.length?`<div style="opacity:.8">⏳ sem fatura: ${mi.join(", ")}</div>`:""},
    onClick:i=>{curM=ms[i];render()}});
}

// ---------- GASTOS
let gView="cat", selCat=null;
function renderGastos(){
  const el=document.getElementById('s-gastos');
  const bc=byCat(curM);
  const rows=CATS.map(c=>({c,g:bc[c],t:teto(c)})).filter(r=>r.g||r.t).sort((a,b)=>b.g-a.g);
  el.innerHTML=`<div class="card"><div class="seg" id="gseg"><button data-v="cat" class="${gView==="cat"?"on":""}">Categorias</button><button data-v="fix" class="${gView==="fix"?"on":""}">Fixos</button><button data-v="tab" class="${gView==="tab"?"on":""}">Variáveis</button><button data-v="tipo" class="${gView==="tipo"?"on":""}">Tendência</button></div></div><div id="gbody"></div>`;
  el.querySelectorAll('#gseg button').forEach(b=>b.onclick=()=>{gView=b.dataset.v;renderGastos()});
  const body=document.getElementById('gbody');
  if(gView==="cat"){
    body.innerHTML=`<div class="card"><h3>Gasto por categoria em ${ml(curM)}${who!=="Casal"?" · "+who:""}</h3><p class="hint">Barra azul = gasto · faixa cinza = orçamento da categoria (se houver). Valores das faturas do mês. Toque numa categoria para ver o histórico.</p><div class="chart tall" id="cCat"></div></div><div class="card" id="catHist"></div>`;
    hbar('cCat',{labels:rows.map(r=>r.c),a:rows.map(r=>r.g),b:rows.map(r=>r.t),colors:rows.map(()=>'#2a78d6'),
      legend:[{name:'Gasto',color:'#2a78d6'},{name:'Orçamento',color:'#d9d8d2'}],
      valLabel:i=>fmt0(rows[i].g),
      tip:i=>{const r=rows[i];return `<b>${esc(r.c)}</b><div>Gasto: ${fmt(r.g)}</div>${r.t?`<div>Orçamento: ${fmt(r.t)}</div>`:""}`},
      onClick:i=>{selCat=rows[i].c;catHist()}});
    selCat=selCat&&rows.find(r=>r.c===selCat)?selCat:(rows[0]&&rows[0].c);
    catHist();
  } else if(gView==="tipo"){
    body.innerHTML=`<div class="card"><h3>Fixo, parcelado e variável por mês</h3><p class="hint">Quanto do gasto já vem "contratado" (fixos + parcelas)</p><div class="chart" style="height:250px" id="cTipo"></div></div>
    <div class="card"><h3>Maiores gastos de ${ml(curM)}</h3><div class="list" id="top"></div></div>`;
    const ms=months(),tx=allTx(); const tipos=["Fixo","Parcelado","Variável"],cols=['#14453f','#eb6834','#86b6ef'];
    vbar('cTipo',{labels:ms.map(ml),stacked:true,legend:tipos.map((t,i)=>({name:t,color:cols[i]})),series:tipos.map((t,i)=>({name:t,color:cols[i],data:ms.map(m=>+tx.filter(x=>x.ref===m&&x.tipo===t).reduce((a,x)=>a+x.valor,0).toFixed(2))}))});
    document.getElementById('top').innerHTML=tx.filter(t=>t.ref===curM).sort((a,b)=>b.valor-a.valor).slice(0,12).map(itemHTML).join("");
  } else if(gView==="fix"){
    const L=fixos().map(f=>Object.assign({},f));
    const draw=()=>{
      const tot=sumF(L), byW=w=>sumF(L.filter(f=>f.quem===w));
      body.innerHTML=`<div class="card"><h3>Gastos fixos mensais</h3><p class="hint">Gastos pagos fora dos cartões. Tudo editável: nome, valor, categoria, classificação (essencial, não essencial ou investimento) e quem paga.</p>
      <div id="fxl">${L.map((f,i)=>`<div class="fx" data-i="${i}"><div class="g2" style="grid-template-columns:1fr 120px"><input data-k="nome" value="${esc(f.nome)}" aria-label="Nome"><input data-k="valor" type="number" step="0.01" min="0" value="${f.valor||""}" placeholder="0,00" aria-label="Valor"></div>
        <div class="fxm"><select data-k="cat" aria-label="Categoria">${CATS.map(c=>`<option ${c===f.cat?"selected":""}>${esc(c)}</option>`).join("")}</select><select data-k="quem" aria-label="Quem">${["Casal","Luis","Roanna"].map(w=>`<option ${w===f.quem?"selected":""}>${w}</option>`).join("")}</select><select data-k="cls" aria-label="Classificação">${["E","N","I"].map(k=>`<option value="${k}" ${clsFix(f)===k?"selected":""}>${CLS_S[k]}</option>`).join("")}</select><button class="del" data-del="${i}" aria-label="Remover">✕</button></div></div>`).join("")}</div>
      <button class="btn ghost" id="fxAdd">+ Adicionar gasto fixo</button>
      <table class="t" style="margin-top:12px"><tr><td>Casal (compartilhado)</td><td class="n">${fmt(byW("Casal"))}</td></tr><tr><td>Luis</td><td class="n">${fmt(byW("Luis"))}</td></tr><tr><td>Roanna</td><td class="n">${fmt(byW("Roanna"))}</td></tr><tr><td><b>Total fixos</b></td><td class="n"><b>${fmt(tot)}</b></td></tr></table>
      <button class="btn" id="fxSave">Salvar gastos fixos</button></div>`;
      body.querySelectorAll('.fx').forEach(row=>{const i=+row.dataset.i;row.querySelectorAll('[data-k]').forEach(inp=>{inp.oninput=inp.onchange=()=>{const k=inp.dataset.k;L[i][k]=k==="valor"?(+inp.value||0):k==="cartao"?inp.checked:inp.value;if(k==="valor"||k==="quem"){const ft=body.querySelector('table.t');}}})});
      body.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{L.splice(+b.dataset.del,1);draw()});
      document.getElementById('fxAdd').onclick=()=>{L.push({nome:"Novo gasto fixo",cat:"Outros",valor:0,quem:"Casal",dia:"",cartao:false});draw();const ins=body.querySelectorAll('.fx input[data-k=nome]');const last=ins[ins.length-1];if(last){last.focus();last.select()}};
      document.getElementById('fxSave').onclick=()=>{S.fixos=L.map(f=>{const o=Object.assign({},f);delete o.cartao;return o});save("Gastos fixos salvos");draw()};
    };
    draw();
  } else {
    const A=byCat(curM); const missV=missing(curM);
    body.innerHTML=`<div class="card"><h3>Custos variáveis${who!=="Casal"?" · "+who:" · casal"} · ${ml(curM)}</h3><p class="hint">Gasto de cada categoria nas faturas que vencem em ${ml(curM)} (lançamentos carregados no app) e o orçamento que vocês definem.${missV.length?` ⏳ Ainda sem fatura: ${missV.join(", ")}.`:""}</p>
    <table class="t"><tr><th>Categoria</th><th class="n">Fatura ${ml(curM)}</th><th class="n">Orçamento</th></tr>
    ${CATS.map(c=>`<tr><td>${esc(c)}</td><td class="n">${fmt0(A[c])}</td><td class="n"><input type="number" min="0" step="50" data-c="${esc(c)}" value="${teto(c)}" aria-label="Orçamento ${esc(c)}"></td></tr>`).join("")}
    <tr><td><b>Total</b></td><td class="n"><b>${fmt0(CATS.reduce((a,c)=>a+A[c],0))}</b></td><td class="n"><b>${fmt0(CATS.reduce((a,c)=>a+teto(c),0))}</b></td></tr></table>
    <label class="f">Alerta de gasto geral: avisar quando atingir (% da renda)</label><input type="number" id="alerta" min="50" max="100" step="5" value="${Math.round((S.alerta||.8)*100)}">
    <button class="btn" id="saveTetos">Salvar custos variáveis</button><button class="btn ghost" id="resetTetos">Usar os valores da fatura de ${ml(curM)}</button></div>`;
    document.getElementById('resetTetos').onclick=()=>{body.querySelectorAll('input[data-c]').forEach(i=>{const a=A[i.dataset.c];i.value=a>0?Math.ceil(a/50)*50:0});toast("Valores da fatura preenchidos: toque em Salvar")};
    document.getElementById('saveTetos').onclick=()=>{S.tetos=S.tetos||{};body.querySelectorAll('input[data-c]').forEach(i=>S.tetos[who+"|"+i.dataset.c]=+i.value||0);S.alerta=Math.min(1,Math.max(.5,(+document.getElementById('alerta').value||80)/100));save("Custos variáveis salvos");renderGastos()};
  }
}
function catHist(){
  const el=document.getElementById('catHist'); if(!el||!selCat)return;
  const ms=months(),t=teto(selCat),tx=allTx().filter(x=>x.cat===selCat);
  const cw=cardsWho();
  el.innerHTML=`<h3>${esc(selCat)}: mês a mês</h3><p class="hint">Por cartão · tracejado = teto atual (${fmt0(t)})</p><div class="chart" style="height:240px" id="cCH"></div>`;
  vbar('cCH',{labels:ms.map(ml),stacked:true,legend:cw.map(c=>({name:short(c.nome),color:CCOL[c.i]})),series:cw.map(c=>({name:short(c.nome),color:CCOL[c.i],data:ms.map(m=>+tx.filter(x=>x.ref===m&&x.cartao===c.nome).reduce((a,x)=>a+x.valor,0).toFixed(2))})),ref:t,refLabel:'teto '+fmt0(t)});
}
function itemHTML(t){
  const src=t.origem==="WhatsApp"?'<span class="src wa">WhatsApp</span>':t.origem==="Apple Wallet"?'<span class="src wl">Wallet</span>':t.origem==="Fatura"?'':`<span class="src">${esc(t.origem)}</span>`;
  const d=t.data.split("-");
  return `<div class="it"><div style="min-width:0"><div class="d">${esc(t.desc)}${src}</div><div class="m">${d[2]}/${d[1]} · ${esc(t.cat)}${t.parc?" · "+t.parc:""} · ${esc(short(t.cartao))}</div></div><div style="text-align:right;flex:none"><div class="v ${t.valor<0?"neg":""}">${fmt(t.valor)}</div>${(()=>{const c=clsOf(t);return `<button class="cls cls-${c}" data-c="${c}" data-k="${esc(txKey(t))}" title="Toque para mudar entre essencial e não essencial">${CLS_S[c]}</button>`})()}${t.id?`<button class="delx" data-delid="${esc(t.id)}" aria-label="Apagar lançamento" title="Apagar">🗑</button>`:""}</div></div>`;
}

// ---------- CARTÕES
let selCard=0;
function renderCartoes(){
  const el=document.getElementById('s-cartoes');
  const cw=cardsWho(); if(!cw.find(c=>c.i===selCard)) selCard=cw[0].i;
  el.innerHTML=cw.map(c=>{const f=fatOf(c.i,curM);const last=DATA.faturas.filter(x=>x.c===c.i).sort((a,b)=>a.m<b.m?1:-1)[0];const ff=f||last;
    return `<div class="cc" style="background:${CGRAD[c.i]};cursor:pointer" data-c="${c.i}">${c.principal?'<span class="tag">PRINCIPAL</span>':`<span class="tag">${esc(c.holder)}</span>`}<div class="n"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${CCOL[c.i]};margin-right:6px;box-shadow:0 0 0 1.5px #fff"></i>${esc(c.nome)}</div><div class="f">Final ${esc(c.final)} · fecha ~dia ${c.fech} · vence dia ${c.venc}</div>
     <div class="lim">${f?"Gastos de "+ml(curM)+" (vence "+dueLabel(c.i,curM)+")":"Última fatura (gastos de "+ml(last.m)+")"}: <b>${fmt(ff.total)}</b> · limite ${fmt0(c.limite)}</div><div class="bar"><i style="width:${Math.min(100,ff.total/c.limite*100)}%"></i></div></div>`}).join("")+`
  <div class="card" id="clsCard"></div>
  <div class="card"><h3>Histórico de faturas</h3><div class="seg" id="cseg" style="margin:8px 0 10px">${cw.map(c=>`<button data-c="${c.i}" class="${c.i===selCard?"on":""}">${esc(short(c.nome))}</button>`).join("")}</div>
   <div class="chart" id="cFat"></div><table class="t" id="fTab" style="margin-top:8px"></table></div>
  <div class="card"><h3>Parcelas que já estão por vir</h3><p class="hint">Projeção a partir da última fatura de cada cartão${who==="Casal"?"":" · "+who}</p><div class="chart" style="height:240px" id="cParc"></div></div>`;
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{selCard=+b.dataset.c;renderCartoes()});
  renderClassif();
  const fs=DATA.faturas.filter(f=>f.c===selCard).sort((a,b)=>a.m<b.m?-1:1);
  const avg=fs.reduce((a,f)=>a+f.total,0)/fs.length;
  vbar('cFat',{labels:fs.map(f=>ml(f.m)),series:[{name:short(CARDS[selCard].nome),data:fs.map(f=>f.total),colors:fs.map(f=>f.m===curM?'#14453f':CCOL[selCard])}],ref:avg,refLabel:'média '+fmt0(avg)});
  document.getElementById('fTab').innerHTML=`<tr><th>Mês dos gastos</th><th class="n">Total</th><th class="n">vs média</th></tr>`+fs.slice().reverse().map(x=>`<tr><td>${ml(x.m)}</td><td class="n">${fmt(x.total)}</td><td class="n" style="color:${x.total>avg?"#9c1c1c":"#0a6b0a"}">${x.total>avg?"+":""}${((x.total/avg-1)*100).toFixed(0)}%</td></tr>`).join("")+`<tr><td colspan="3" class="hint" style="padding-top:8px">${fs.length} faturas${fs.some(f=>f.app)?" (inclui enviadas pelo app)":""}, conferidas com os lançamentos.</td></tr>`;
  const base=months()[months().length-1]; const fut=[];for(let i=1;i<=8;i++)fut.push(addM(base,i-1));
  vbar('cParc',{labels:fut.map(ml),stacked:true,legend:cw.map(c=>({name:short(c.nome),color:CCOL[c.i]})),series:cw.map(c=>({name:short(c.nome),color:CCOL[c.i],data:fut.map(m=>+parcelasMes(m,c.i).toFixed(2))}))});
}

// ---------- classificar gastos da fatura (por loja)
let onlyPend=false;
function renderClassif(){
  const box=document.getElementById('clsCard'); if(!box) return;
  const card=CARDS[selCard], f=fatOf(selCard,curM);
  const tx=rawTx().filter(t=>t.tipo!=="Ajuste"&&t.cartao===card.nome&&t.ref===curM&&t.valor>0);
  const G={}; tx.forEach(t=>{(G[t.desc]=G[t.desc]||{desc:t.desc,cat:t.cat,items:[],v:0}).items.push(t);G[t.desc].v+=t.valor});
  let groups=Object.values(G).sort((a,b)=>b.v-a.v);
  groups.forEach(g=>{const cs=new Set(g.items.map(clsOf));g.c=cs.size>1?"M":[...cs][0];g.set=g.items.every(clsSet)});
  const tE=tx.filter(t=>clsOf(t)==="E").reduce((a,t)=>a+t.valor,0), tN=tx.filter(t=>clsOf(t)!=="E").reduce((a,t)=>a+t.valor,0);
  const nSet=groups.filter(g=>g.set).length, T=tE+tN;
  const shown=onlyPend?groups.filter(g=>!g.set):groups;
  box.innerHTML=`<h3>Classificar gastos da fatura</h3><p class="hint">${esc(card.nome)} · venc. ${ml(curM)}. Marque cada loja como essencial ou não essencial; vale para todas as compras dela, inclusive nas próximas faturas. Abra a loja para mudar uma compra só.</p>
   <div class="seg" id="ccSel" style="margin-bottom:10px">${cardsWho().map(c=>`<button data-cc="${c.i}" class="${c.i===selCard?"on":""}">${esc(short(c.nome))}</button>`).join("")}</div>
   ${tx.length?`<div style="display:flex;gap:8px;font-size:12px;margin-bottom:6px"><span style="flex:${Math.max(tE,1)};background:#e4eefb;color:#1c5cab;border-radius:6px;padding:6px 8px"><b>Essencial</b><br>${fmt0(tE)} · ${T?Math.round(tE/T*100):0}%</span><span style="flex:${Math.max(tN,1)};background:#fde9e0;color:#a5431a;border-radius:6px;padding:6px 8px"><b>Não essencial</b><br>${fmt0(tN)} · ${T?Math.round(tN/T*100):0}%</span></div>
   <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--ink2);margin:8px 0">${nSet} de ${groups.length} lojas revisadas<label class="ck"><input type="checkbox" id="onlyPend" ${onlyPend?"checked":""}> só não revisadas</label></div>
   <div class="bar" style="margin-bottom:8px"><i style="width:${groups.length?nSet/groups.length*100:0}%;background:var(--brand2)"></i></div>
   <div class="list">${shown.map(g=>`<div class="it" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div style="min-width:0;flex:1"><div class="d">${g.set?"":'<span title="ainda não revisada" style="color:#eda100">● </span>'}${esc(g.desc)}</div><div class="m">${esc(g.cat)} · ${g.items.length} compra${g.items.length>1?"s":""} · ${fmt(g.v)}</div></div>
     <div class="seg2"><button data-g="${esc(g.desc)}" data-v="E" class="${g.c==="E"?"on e":""}">Essencial</button><button data-g="${esc(g.desc)}" data-v="N" class="${g.c==="N"?"on n":""}">Não essencial</button></div></div>
     ${g.items.length>1||g.c==="M"?`<details style="margin-top:4px"><summary style="font-size:11px">${g.c==="M"?"misto · ":""}ver ${g.items.length} compras</summary>${g.items.map(t=>{const c=clsOf(t);return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0"><span>${t.data.slice(8)}/${t.data.slice(5,7)}${t.parc?" · "+t.parc:""}</span><span>${fmt(t.valor)} <button class="cls cls-${c}" data-c="${c}" data-k="${esc(txKey(t))}">${CLS_S[c]}</button></span></div>`}).join("")}</details>`:""}</div>`).join("")||`<div class="note">Tudo revisado nesta fatura. ✓</div>`}</div>`:`<div class="note">${f?"Sem compras nesta fatura.":"Fatura de "+ml(curM)+" ainda não carregada para este cartão. Envie o PDF em Lançar."}</div>`}`;
  box.querySelectorAll('[data-cc]').forEach(b=>b.onclick=()=>{selCard=+b.dataset.cc;renderCartoes()});
  const op=document.getElementById('onlyPend'); if(op) op.onchange=()=>{onlyPend=op.checked;renderClassif()};
  box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{const d=b.dataset.g,v=b.dataset.v;S.clsDesc=S.clsDesc||{};S.clsDesc[d]=v;
    if(S.cls) rawTx().filter(t=>t.desc===d).forEach(t=>{delete S.cls[txKey(t)]});
    renderClassif();clearTimeout(clsTimer);clsTimer=setTimeout(()=>save("Classificação salva"),900)});
}

// ---------- METAS
const isReserva=m=>/reserva de emerg/i.test(m.nome||"");
function essMensal(){const fx=fixos().filter(f=>!f.cartao&&clsFix(f)==="E").reduce((a,f)=>a+(+f.valor||0),0);
  const card=allTx().filter(t=>COMPLETE.includes(t.ref)&&clsOf(t)==="E").reduce((a,t)=>a+t.valor,0)/(COMPLETE.length||1);return fx+card}
function ensureReserva(){S.metas=S.metas||[];if(!S.metas.some(isReserva))S.metas.push({nome:"Reserva de emergência",alvo:Math.round(essMensal()*6/1000)*1000,guardado:0,aporte:0,prazo:""})}
function metasOrd(){const l=(S.metas||[]).map((m,i)=>Object.assign({_i:i},m));return l.filter(m=>!isReserva(m)).concat(l.filter(isReserva))}
function metaCalc(m){const d=new Date(),nowM=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
  const falta=Math.max(0,(+m.alvo||0)-(+m.guardado||0)), mp=m.prazo?Math.max(1,monthsDiff(nowM,m.prazo)):null;
  const precisa=mp?falta/mp:null, ma=m.aporte>0?Math.ceil(falta/m.aporte):null, fim=ma!=null?addM(nowM,ma):null;
  return {nowM,falta,mp,precisa,fim,ok:fim&&m.prazo?fim<=m.prazo:null,pct:m.alvo?Math.min(100,(+m.guardado||0)/m.alvo*100):0}}
let selMeta=null, openMeta=null;
const PRESETS=[["✈️ Viagem",15000],["🏠 Entrada do imóvel",80000],["💳 Quitar dívidas",20000],["🎓 Educação da Helena",30000],["🚗 Troca do carro",60000],["🎯 Outra meta",10000]];
function renderMetas(){
  const el=document.getElementById('s-metas');
  S.metas=S.metas||[];
  const ess=essMensal(); ensureReserva();
  const L=metasOrd(); if(selMeta==null||!L.find(m=>m._i===selMeta)) selMeta=L[0]._i;
  const renda=rendaWho("Casal"), apT=L.reduce((a,m)=>a+(+m.aporte||0),0);
  el.innerHTML=`<div class="card"><h3>Metas do casal</h3><p class="hint">${L.length} meta(s) · aportes somam ${fmt0(apT)}/mês${renda?` (${Math.round(apT/renda*100)}% da renda; o ideal é 20% = ${fmt0(renda*.2)})`:""}</p>
   <div class="chart" style="height:230px" id="cMeta"></div><p class="hint" style="margin:6px 0 0">Gráfico da meta selecionada: toque numa meta abaixo.</p></div>
  ${L.map(m=>{const c=metaCalc(m);const res=isReserva(m);return `<div class="card" style="${m._i===selMeta?"box-shadow:0 0 0 2px var(--brand2)":""}" data-sel="${m._i}">
   <div class="goal-ring"><div class="ring" style="--p:${c.pct.toFixed(1)};width:76px;height:76px"><b style="width:58px;height:58px;font-size:15px">${c.pct.toFixed(0)}%</b></div>
   <div style="flex:1;min-width:0"><div class="hint" style="margin:0">${res?"🛟 Reserva de emergência":"Meta"}</div><h3 style="font-size:16px">${esc(m.nome)}</h3>
   <div style="font-size:12px;color:var(--ink2)">${fmt0(+m.guardado||0)} de ${fmt0(+m.alvo||0)} · faltam ${fmt0(c.falta)}${m.prazo?" até "+ml(m.prazo):""}</div>
   <div style="font-size:12px;margin-top:4px">${c.precisa!=null?`Precisa ${fmt0(c.precisa)}/mês · `:""}${c.fim?`No ritmo: ${ml(c.fim)} ${c.ok==null?"":c.ok?'<span class="pill ok">✓ no prazo</span>':'<span class="pill over">✕ atrasa</span>'}`:"defina um aporte"}</div></div></div>
   ${res?`<div class="note" style="margin-top:10px">Recomendado: 6 meses de gastos essenciais ≈ <b>${fmt0(ess*6)}</b> (essenciais ≈ ${fmt0(ess)}/mês). Guarde em aplicação de liquidez diária.</div>`:""}
   <details ${openMeta===m._i?"open":""} data-det="${m._i}"><summary>Editar</summary>
    <label class="f">Nome</label><input data-f="nome" value="${esc(m.nome||"")}">
    <div class="g2"><div><label class="f">Valor da meta (R$)</label><input data-f="alvo" type="number" min="0" step="100" value="${m.alvo||""}"></div><div><label class="f">Já guardado (R$)</label><input data-f="guardado" type="number" min="0" step="50" value="${m.guardado||0}"></div></div>
    <div class="g2"><div><label class="f">Aporte mensal (R$)</label><input data-f="aporte" type="number" min="0" step="50" value="${m.aporte||""}"></div><div><label class="f">Prazo</label><input data-f="prazo" type="month" value="${m.prazo||""}"></div></div>
    <div class="g2"><button class="btn" data-save="${m._i}">Salvar</button><button class="btn ghost" data-del="${m._i}">Excluir meta</button></div>
    <div class="g2" style="margin-top:10px"><input data-ap="${m._i}" type="number" min="0" step="50" placeholder="Valor guardado agora"><button class="btn ghost sm" style="width:100%" data-addap="${m._i}">+ Registrar aporte</button></div>
   </details></div>`}).join("")}
  <div class="card"><h3>Nova meta</h3><p class="hint">Escolha um tipo e ajuste os valores. A reserva de emergência fica sempre por último.</p>
   <div class="integr">${PRESETS.map(([n,v],i)=>`<button class="btn ghost" style="margin-top:0" data-preset="${i}">${n}</button>`).join("")}</div></div>`;
  el.querySelectorAll('[data-sel]').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('details,button,input'))return;selMeta=+c.dataset.sel;renderMetas()}));
  el.querySelectorAll('[data-det]').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)openMeta=+d.dataset.det}));
  el.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const i=+b.dataset.save;const box=b.closest('details');const m=S.metas[i];
    box.querySelectorAll('[data-f]').forEach(inp=>{const k=inp.dataset.f;m[k]=["alvo","guardado","aporte"].includes(k)?(+inp.value||0):inp.value.trim()});if(!m.nome)m.nome="Minha meta";openMeta=null;selMeta=i;save("Meta salva");renderMetas()});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{const i=+b.dataset.del;S.metas.splice(i,1);selMeta=null;openMeta=null;save("Meta excluída");renderMetas()});
  el.querySelectorAll('[data-addap]').forEach(b=>b.onclick=()=>{const i=+b.dataset.addap;const v=+el.querySelector(`[data-ap="${i}"]`).value;if(!v)return toast("Informe o valor do aporte");S.metas[i].guardado=(+S.metas[i].guardado||0)+v;save("Aporte de "+fmt0(v)+" registrado");renderMetas()});
  el.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{const [n,v]=PRESETS[+b.dataset.preset];const d=new Date();const prazo=(d.getFullYear()+1)+"-"+String(d.getMonth()+1).padStart(2,"0");
    const nm={nome:n.replace(/^\S+\s/,""),alvo:v,guardado:0,aporte:0,prazo};const ri=S.metas.findIndex(isReserva);if(ri>=0)S.metas.splice(ri,0,nm);else S.metas.push(nm);
    selMeta=S.metas.indexOf(nm);openMeta=selMeta;save("Meta criada: ajuste os valores");renderMetas();setTimeout(()=>{const d=el.querySelector(`[data-det="${selMeta}"]`);if(d)d.scrollIntoView({behavior:"smooth",block:"center"})},60)});
  const m=S.metas[selMeta], c=metaCalc(m);
  const end=m.prazo&&m.prazo>(c.fim||"")?m.prazo:(c.fim||addM(c.nowM,12));
  const n=Math.min(60,Math.max(3,monthsDiff(c.nowM,end)+1)); const lab=[],proj=[],need=[];
  for(let i=0;i<=n;i++){lab.push(ml(addM(c.nowM,i)));proj.push(Math.min((+m.alvo||0)*1.2,(+m.guardado||0)+(+m.aporte||0)*i));need.push(c.precisa!=null&&i<=c.mp?(+m.guardado||0)+c.precisa*i:null)}
  lineChart('cMeta',{labels:lab,title:m.nome,series:[{name:'Ritmo atual',data:proj,color:'#14453f',fill:'rgba(31,107,97,.08)'},{name:'Necessário p/ prazo',data:need,color:'#eb6834',dash:true},{name:'Meta: '+m.nome,data:lab.map(()=>+m.alvo||0),color:'#8a8984'}]});
}

// ---------- PLANO 50/30/20
function renderPlano(){
  const el=document.getElementById('s-plano');
  const renda=rendaWho("Casal");
  const fx=fixos(), tx=rawTx().filter(t=>t.tipo!=="Ajuste"&&t.ref===curM);
  const B={E:0,N:0,I:0}, top={E:{},N:{},I:{}};
  fx.forEach(f=>{const c=clsFix(f);B[c]+=(+f.valor||0);top[c][f.nome]=(top[c][f.nome]||0)+(+f.valor||0)});
  tx.forEach(t=>{const c=clsOf(t);B[c]+=t.valor;top[c][t.cat]=(top[c][t.cat]||0)+t.valor});
  const apT=(S.metas||[]).reduce((a,m)=>a+(+m.aporte||0),0); B.I+=apT; if(apT)top.I["Aportes das metas"]=apT;
  const open=bills(curM).filter(b=>b.st!=="real");
  const ideal={E:.5,N:.3,I:.2}, nm={E:"Gastos essenciais",N:"Gastos não essenciais",I:"Reserva de emergência e investimentos"}, col={E:"#2a78d6",N:"#eb6834",I:"#1baf7a"};
  const tops=k=>Object.entries(top[k]).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const st=k=>{const p=renda?B[k]/renda:0;return k==="I"?(p>=ideal[k]?"ok":"over"):(p<=ideal[k]?"ok":"over")};
  const fxAll=fixos(), fxE=fxAll.filter(f=>clsFix(f)==="E").reduce((a,f)=>a+(+f.valor||0),0), fxN=fxAll.filter(f=>clsFix(f)==="N").reduce((a,f)=>a+(+f.valor||0),0);
  const roomE=renda*.5-fxE, roomN=renda*.3-fxN, roomT=Math.max(0,roomE)+Math.max(0,roomN);
  const ctx=tx.filter(t=>t.cartao&&CARDS.some(c=>c.nome===t.cartao));
  const cE=ctx.filter(t=>clsOf(t)==="E").reduce((a,t)=>a+t.valor,0), cN=ctx.filter(t=>clsOf(t)!=="E").reduce((a,t)=>a+t.valor,0);
  const bl=bills(curM), blT=sumB(bl);
  const perCard=cardsWho().map(c=>{const l=ctx.filter(t=>t.cartao===c.nome);return {c,e:l.filter(t=>clsOf(t)==="E").reduce((a,t)=>a+t.valor,0),n:l.filter(t=>clsOf(t)!=="E").reduce((a,t)=>a+t.valor,0),has:!!fatOf(c.i,curM)}});
  const topN=Object.entries(ctx.filter(t=>clsOf(t)!=="E").reduce((o,t)=>{o[t.desc]=(o[t.desc]||0)+t.valor;return o},{})).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const barRow=(lbl,cur,lim,col)=>`<div style="margin:12px 0 2px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>${lbl}</b><span class="pill ${cur<=Math.max(lim,0)?"ok":"over"}">${cur<=Math.max(lim,0)?"✓ cabe":"↑ "+fmt0(cur-Math.max(lim,0))+" acima"}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink2);margin-top:3px"><span>Nos cartões <b style="color:var(--ink)">${fmt0(cur)}</b></span><span>Limite pela regra ${fmt0(Math.max(lim,0))}</span></div>
    <div class="bar" style="height:10px"><i style="width:${lim>0?Math.min(100,cur/lim*100):100}%;background:${col}"></i></div></div>`;
  el.innerHTML=`<div class="card" style="border-left:4px solid #eb6834"><h3>💳 Planejamento do cartão de crédito — ${ml(curM)}</h3><p class="hint">Quanto sobra para os cartões depois dos gastos fixos, pela regra 50/30/20.</p>
   ${renda?`<table class="t"><tr><td>50% essenciais (${fmt0(renda*.5)}) − fixos essenciais (${fmt0(fxE)})</td><td class="n">${fmt0(roomE)}</td></tr>
   <tr><td>30% não essenciais (${fmt0(renda*.3)}) − fixos não essenciais (${fmt0(fxN)})</td><td class="n">${fmt0(roomN)}</td></tr>
   <tr><td><b>Teto mensal para os 4 cartões</b></td><td class="n"><b style="font-size:16px">${fmt0(roomT)}</b></td></tr>
   <tr><td>Faturas que vencem em ${ml(curM)}${bl.some(b=>b.st!=="real")?" (com estimativas)":""}</td><td class="n"><span class="pill ${blT<=roomT?"ok":"over"}">${fmt0(blT)}</span></td></tr></table>
   ${barRow("Essenciais no cartão",cE,roomE,"#2a78d6")}${barRow("Não essenciais no cartão",cN,roomN,"#eb6834")}
   ${roomE<0?`<div class="note" style="margin-top:10px">Os fixos essenciais sozinhos já passam dos 50% da renda (${fmt0(fxE)} de ${fmt0(renda*.5)}). Qualquer gasto essencial no cartão aumenta essa diferença.</div>`:""}`:`<div class="note">Cadastre as rendas abaixo para calcular.</div>`}
   <table class="t" style="margin-top:12px"><tr><th>Cartão</th><th class="n">Essencial</th><th class="n">Não essencial</th></tr>${perCard.map(p=>`<tr><td>${esc(short(p.c.nome))}${p.has?"":' <span class="src">sem fatura</span>'}</td><td class="n">${fmt0(p.e)}</td><td class="n">${fmt0(p.n)}</td></tr>`).join("")}</table>
   ${topN.length?`<p class="hint" style="margin:12px 0 4px"><b>Maiores não essenciais no cartão</b> (onde dá para cortar):</p>${topN.map(([d,v])=>`<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span>${esc(d)}</span><span>${fmt0(v)}</span></div>`).join("")}`:""}
   <div class="chart" style="height:220px;margin-top:12px" id="cCls"></div>
   <button class="btn ghost" id="goCls">Classificar gastos das faturas</button></div>
  <div class="card"><h3>Regra 50 · 30 · 20 — ${ml(curM)}</h3><p class="hint">50% essenciais · 30% não essenciais · 20% reserva de emergência e investimentos. Base: renda de ${renda?fmt0(renda):"—"}.</p>
   ${renda?["E","N","I"].map(k=>{const p=B[k]/renda*100;return `<div style="margin:14px 0 4px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:14px"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${col[k]};margin-right:6px"></i>${nm[k]}</b><span class="pill ${st(k)}">${st(k)==="ok"?"✓ dentro":k==="I"?"↓ abaixo":"↑ acima"}</span></div>
     <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink2);margin-top:4px"><span>Atual <b style="color:var(--ink)">${fmt0(B[k])}</b> (${p.toFixed(0)}%)</span><span>Ideal ${fmt0(renda*ideal[k])} (${ideal[k]*100}%)</span></div>
     <div class="bar" style="height:10px;position:relative;overflow:visible"><i style="width:${Math.min(100,p)}%;background:${col[k]}"></i><span style="position:absolute;left:${ideal[k]*100}%;top:-3px;width:2px;height:16px;background:#0b0b0b"></span></div>
     <div style="font-size:11px;color:var(--muted);margin-top:4px">${tops(k).map(([n,v])=>esc(n)+" "+fmt0(v)).join(" · ")||"—"}</div></div>`}).join(""):`<div class="note">Cadastre as rendas abaixo para calcular.</div>`}
   ${open.length?`<div class="note" style="margin-top:10px">⏳ ${open.map(b=>esc(short(b.c.nome))).join(", ")}: fatura de ${ml(curM)} ainda não carregada; as compras delas entram quando o PDF for enviado.</div>`:""}
   <p class="hint" style="margin-top:10px">Cada gasto tem a etiqueta Essencial / Não essencial / Invest. Toque nela na lista de lançamentos, ou mude nos Gastos fixos.</p></div>
  <div class="card"><h3>Orientações para o casal</h3><div id="tips"></div></div>
  <div class="card"><h3>📱 Celulares do casal</h3><p class="hint">Usados para reconhecer quem mandou cada gasto nas mensagens do WhatsApp (e, no futuro, para o bot aceitar só estes números).</p>
   <div class="g2"><div><label class="f">Luis</label><input id="foL" inputmode="tel" value="${esc(fmtFone(fones().Luis))}"></div><div><label class="f">Roanna</label><input id="foR" inputmode="tel" value="${esc(fmtFone(fones().Roanna))}"></div></div>
   <button class="btn" id="foSave">Salvar celulares</button></div>
  <div class="card"><h3>⚙️ Este aparelho</h3><p class="hint">Conectado como <b>${esc(ME)}</b> ao servidor do casal no Google Drive.</p><button class="btn ghost" id="logout">Desconectar este aparelho</button></div>
  <div class="card" id="rendaCard"><h3>Rendas do casal</h3><p class="hint">Salário de cada um e outras entradas (valores líquidos mensais). Tudo editável.</p><div id="rdBox"></div></div>`;
  const msC=months(); const allC=rawTx().filter(t=>t.tipo!=="Ajuste"&&CARDS.some(c=>c.nome===t.cartao)&&(who==="Casal"||t.holder===who));
  vbar('cCls',{labels:msC.map(ml),stacked:true,legend:[{name:"Essencial",color:"#2a78d6"},{name:"Não essencial",color:"#eb6834"}],
    series:[{name:"Essencial",color:"#2a78d6",data:msC.map(m=>+allC.filter(t=>t.ref===m&&clsOf(t)==="E").reduce((a,t)=>a+t.valor,0).toFixed(2))},{name:"Não essencial",color:"#eb6834",data:msC.map(m=>+allC.filter(t=>t.ref===m&&clsOf(t)!=="E").reduce((a,t)=>a+t.valor,0).toFixed(2))}],
    ref:renda?roomT:null,refLabel:renda?"teto "+fmt0(roomT):"",onClick:i=>{curM=msC[i];render()}});
  const gc=document.getElementById('goCls'); if(gc) gc.onclick=()=>{tab="cartoes";render();setTimeout(()=>{const c=document.getElementById('clsCard');if(c)c.scrollIntoView({behavior:"smooth"})},60)};
  // tips
  const T=[]; const ess=essMensal(), res=(S.metas||[]).find(isReserva);
  if(renda){
    const dE=B.E-renda*.5, dN=B.N-renda*.3, dI=renda*.2-B.I;
    T.push(dE>0?`<b>Essenciais acima do ideal em ${fmt0(dE)}.</b> Os maiores: ${tops("E").slice(0,3).map(x=>esc(x[0])).join(", ")}. Renegociar plano de saúde, financiamento/empréstimo e contas fixas tem efeito todo mês.`:`<b>Essenciais dentro dos 50%.</b> Mantenham os fixos revisados uma vez por ano.`);
    T.push(dN>0?`<b>Não essenciais acima em ${fmt0(dN)}.</b> Comecem por ${tops("N").slice(0,3).map(x=>esc(x[0])).join(", ")}. Um teto mensal para alimentação fora e compras online costuma ser o corte mais rápido.`:`<b>Não essenciais dentro dos 30%.</b> Bom espaço para lazer sem culpa.`);
    T.push(dI>0?`<b>Faltam ${fmt0(dI)}/mês para chegar a 20% em reserva e investimentos.</b> Programem a transferência para o dia em que o salário cai, antes de gastar.`:`<b>Reserva e investimentos em ${(B.I/renda*100).toFixed(0)}% da renda.</b> Meta cumprida.`);
  }
  T.push(`<b>Reserva de emergência primeiro:</b> 6 meses de gastos essenciais ≈ ${fmt0(ess*6)}. ${res?`Hoje: ${fmt0(+res.guardado||0)} (${res.alvo?Math.round((+res.guardado||0)/res.alvo*100):0}% da meta).`:""} Só depois dela, investimentos de longo prazo.`);
  T.push(`<b>Parcelas:</b> ${fmt0(parcelasMes(addM(curM,1)))} já comprometidos no próximo mês. Evitem novos parcelamentos até a reserva estar montada.`);
  T.push(`<b>Faturas:</b> paguem sempre o valor total. Rotativo e parcelamento de fatura cobram de 12% a 17% ao mês.`);
  T.push(`<b>Revisem "Pagamentos a pessoas (identificar)"</b> e marquem cada gasto como essencial ou não. Quanto melhor a classificação, mais fiel fica a regra 50/30/20.`);
  T.push(`<b>Rotina:</b> envie os PDFs das faturas assim que fecharem (Bradesco ~28, Nubank Roanna ~6, Nubank Luis e Ourocard ~8) e confira esta aba uma vez por mês.`);
  document.getElementById('tips').innerHTML=T.map(t=>`<div class="alert" style="align-items:flex-start"><div class="ic att" style="background:#eef3f2;color:var(--brand2)">•</div><div style="flex:1;line-height:1.45">${t}</div></div>`).join("");
  document.getElementById('logout').onclick=()=>{if(confirmTap(document.getElementById('logout'))){localStorage.removeItem('casaRL_cfg');location.reload()}};
  document.getElementById('foSave').onclick=()=>{const n=v=>{let d=v.replace(/\D/g,"");if(d.length<=11)d="55"+d;return d};S.fones={Luis:n(document.getElementById('foL').value),Roanna:n(document.getElementById('foR').value)};save("Celulares salvos")};
  // rendas editor (moved from Metas)
  const g=id=>document.getElementById(id);
  const RL=rendas().map(r=>Object.assign({},r));
  const drawR=()=>{
    const bw=w=>RL.filter(r=>r.quem===w).reduce((a,r)=>a+(+r.valor||0),0), tot=RL.reduce((a,r)=>a+(+r.valor||0),0);
    g('rdBox').innerHTML=RL.map((r,i)=>`<div class="fx" data-i="${i}"><div class="g2" style="grid-template-columns:1fr 130px"><input data-k="desc" value="${esc(r.desc)}" placeholder="Descrição (ex.: Salário, aluguel, freela)" aria-label="Descrição"><input data-k="valor" type="number" step="0.01" min="0" value="${r.valor||""}" placeholder="R$ 0,00" aria-label="Valor"></div>
      <div class="fxm" style="grid-template-columns:1fr 1.2fr 28px"><select data-k="quem" aria-label="Quem">${["Luis","Roanna","Casal"].map(w=>`<option ${w===r.quem?"selected":""}>${w}</option>`).join("")}</select><select data-k="tipo" aria-label="Tipo">${["Salário","Outra renda","Benefício","Aluguel","Freelance/extra","Investimentos"].map(t=>`<option ${t===r.tipo?"selected":""}>${t}</option>`).join("")}</select><button class="del" data-del="${i}" aria-label="Remover">✕</button></div></div>`).join("")+`
      <div class="g2" style="margin-top:10px"><button class="btn ghost" style="margin-top:0" data-add="Luis">+ Renda do Luis</button><button class="btn ghost" style="margin-top:0" data-add="Roanna">+ Renda da Roanna</button></div>
      <table class="t" style="margin-top:12px"><tr><td>Luis</td><td class="n">${fmt(bw("Luis"))}</td></tr><tr><td>Roanna</td><td class="n">${fmt(bw("Roanna"))}</td></tr>${bw("Casal")?`<tr><td>Casal</td><td class="n">${fmt(bw("Casal"))}</td></tr>`:""}<tr><td><b>Renda total</b></td><td class="n"><b>${fmt(tot)}</b></td></tr></table>
      <button class="btn" id="saveRenda">Salvar rendas</button>`;
    g('rdBox').querySelectorAll('.fx').forEach(row=>{const i=+row.dataset.i;row.querySelectorAll('[data-k]').forEach(inp=>{inp.oninput=inp.onchange=()=>{const k=inp.dataset.k;RL[i][k]=k==="valor"?(+inp.value||0):inp.value}})});
    g('rdBox').querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{RL.splice(+b.dataset.del,1);drawR()});
    g('rdBox').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{RL.push({quem:b.dataset.add,tipo:"Outra renda",desc:"",valor:0});drawR();const ins=g('rdBox').querySelectorAll('input[data-k=desc]');ins[ins.length-1].focus()});
    g('saveRenda').onclick=()=>{S.rendas=RL.map(r=>Object.assign({},r));save("Rendas salvas");renderPlano();renderHero()};
  };
  drawR();
}

const QCAT=[["Mercado",/mercad|supermerc|feira|padaria|açougue|acougue|hortifr|atacad/i],["Saúde",/farm[aá]c|rem[eé]dio|drogar|m[eé]dic|consulta|exame|dentist|psic/i],["Transporte",/\buber\b|\b99\b|[oô]nibus|t[aá]xi|metr[oô]|passagem/i],["Combustível e veículo",/gasolin|posto|combust|[aá]lcool|etanol|estacion|oficina|pneu|lavagem/i],["Alimentação fora",/restaur|lanche|ifood|pizza|almo[cç]o|jantar|caf[eé]|sorvet|hamb[uú]rg|a[cç]a[ií]|bar\b|cerveja|delivery/i],["Lazer e eventos",/cinema|show|ingresso|teatro|festa|passeio/i],["Vestuário",/roupa|sapato|t[eê]nis|camisa|vestido|cal[cç]a|bolsa|joia|[oó]culos/i],["Educação",/escola|curso|livro|faculdade|material escolar|mensalidade/i],["Pets",/\bpet\b|ra[cç][aã]o|veterin/i],["Contas da casa",/\bluz\b|energia|[aá]gua|internet|telefone|g[aá]s\b|vivo|claro/i],["Casa e manutenção",/m[oó]vel|decora|ferrament|constru|limpeza|utens/i],["Assinaturas",/netflix|spotify|prime|assinatura|icloud|youtube/i],["Viagem e hospedagem",/hotel|pousada|airbnb|passagem a[eé]rea|viagem/i],["Cuidados pessoais",/sal[aã]o|cabelo|unha|manicure|barbe|maquiag|perfum/i],["Eletrônicos e compras online",/amazon|shopee|mercado ?livre|magalu|celular|fone|notebook/i]];
function parseQuick(txt){
  const out=[]; const d0=new Date(); const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  txt.split(/\n|;|·/).map(l=>l.trim()).filter(Boolean).forEach(line=>{
    let data=iso(d0), quem=who==="Casal"?ME:who, cartao=null, parcN=1;
    const wa=line.match(/^\[?\s*(?:(\d{1,2}:\d{2})(?::\d{2})?,?\s*)?(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:,?\s*(\d{1,2}:\d{2})(?::\d{2})?)?\s*\]?\s*-?\s*([^:]{2,40}?):\s+(.+)$/);
    if(wa){const y=wa[4].length===2?"20"+wa[4]:wa[4];data=y+"-"+wa[3].padStart(2,"0")+"-"+wa[2].padStart(2,"0");const q=quemPorRemetente(wa[6]);if(q)quem=q;line=wa[7]}
    let L=" "+line.toLowerCase()+" ";
    if(/\bontem\b/.test(L)){const d=new Date(d0);d.setDate(d.getDate()-1);data=iso(d);L=L.replace(/\bontem\b/," ")}
    const dm=L.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/); if(dm){const y=dm[3]?(dm[3].length==2?"20"+dm[3]:dm[3]):d0.getFullYear();data=y+"-"+dm[2].padStart(2,"0")+"-"+dm[1].padStart(2,"0");L=L.replace(dm[0]," ")}
    const pm=L.match(/\b(\d{1,2})\s*x\b/); if(pm){parcN=+pm[1];L=L.replace(pm[0]," ")}
    if(/roanna/.test(L))quem="Roanna"; else if(/\blu[ií]s\b/.test(L))quem="Luis";
    if(/bradesco|visa|infinite/.test(L))cartao="Bradesco Visa Infinite";
    else if(/ourocard|\bbb\b|\belo\b|banco do brasil/.test(L))cartao="Ourocard Elo BB";
    else if(/nubank|\bnu\b|roxinho/.test(L))cartao=quem==="Roanna"?"Nubank Roanna":"Nubank Luis";
    else if(/\bpix\b/.test(L))cartao="Pix"; else if(/d[eé]bito/.test(L))cartao="Débito"; else if(/dinheiro|esp[eé]cie/.test(L))cartao="Dinheiro";
    if(!cartao)cartao=quem==="Roanna"?"Nubank Roanna":"Bradesco Visa Infinite";
    const nums=matchAllCompat(L,/r?\$?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g).map(m=>m[1]);
    if(!nums.length)return; const raw=nums[nums.length-1]; const valor=/,/.test(raw)?NUM(raw):parseFloat(raw);
    if(!(valor>0))return;
    let desc=L.replace(/r\$/g," ").replace(raw," ").replace(/bradesco|visa|infinite|ourocard|\bbb\b|\belo\b|banco do brasil|nubank|\bnu\b|roxinho|\bpix\b|d[eé]bito|dinheiro|esp[eé]cie|roanna|\blu[ií]s\b|\bno\b|\bna\b|\bcom\b|\bcart[aã]o\b|\breais\b|\bgastei\b|\bpaguei\b|\bem\b|\bde\b/g," ").replace(/\s+/g," ").trim();
    if(!desc)desc="Gasto"; desc=desc.charAt(0).toUpperCase()+desc.slice(1);
    let cat=(QCAT.find(([c,rx])=>rx.test(desc))||[])[0]; if(!cat){const c=categorize(desc);cat=c==="Outros"||c.startsWith("Pagamentos")?"Outros":c}
    const c=ESS_DEF[cat]==="E"?"E":"N";
    out.push({data,desc,cat,valor:valor/parcN,parcN,cartao,quem,c,ref:refMonth(data,cartao)});
  });
  return out;
}
async function importFiles(files,selC,selM){
  const box=document.getElementById('upRes'); if(!box||!files.length) return;
  const res=[]; let added=0;
  for(const f of files){
    box.innerHTML=res.join("")+`<div class="it"><div class="d">⏳ Lendo ${esc(f.name)}…</div></div>`;
    try{
      const r=await parseFatura(await f.arrayBuffer());
      const detC=r.card, detM=addM(r.m,-1);
      if(selC!=null){r.card=selC} if(selM){r.m=selM} else {r.m=detM}
      r.rows.forEach(x=>{x[5]=r.m});
      const aviso=(detC!==r.card||detM!==r.m)?` · ⚠ o PDF parece ser ${esc(short(CARDS[detC].nome))} · gastos de ${ml(detM)}; foi salvo como você escolheu`:"";
      const card=CARDS[r.card];
      if(DATA.faturas.find(x=>x.c===r.card&&x.m===r.m)){res.push(`<div class="it"><div><div class="d">↺ ${esc(card.nome)} · gastos de ${ml(r.m)}</div><div class="m">Essa fatura já estava no app: ignorada (sem duplicar)</div></div></div>`);continue}
      const nov=(S.novos||[]); const subst=nov.filter(t=>t.cartao===card.nome&&t.ref===r.m).length;
      S.novos=nov.filter(t=>!(t.cartao===card.nome&&t.ref===r.m));
      const par=r.tx.filter(t=>t.parc&&!r.pay(t)).map(t=>{const [k,n]=t.parc.split("/").map(Number);return {d:t.desc,v:+t.valor.toFixed(2),k,n}}).filter(p=>p.k<p.n);
      S.importadas=(S.importadas||[]).concat([{refv:2,c:r.card,m:r.m,total:r.total,anterior:r.anterior,pag:+r.pag.toFixed(2),limite:r.limite,ok:r.ok,dif:+(r.esperado-r.soma).toFixed(2),file:f.name,rows:r.rows,par}]);
      added++;
      res.push(`<div class="it"><div><div class="d">${r.ok?"✅":"⚠️"} ${esc(card.nome)} · gastos de ${ml(r.m)} (vence ${dueLabel(r.card,r.m)})</div><div class="m">${r.rows.length} lançamentos · ${r.ok?"conferida centavo a centavo com o total do banco":"diferença de "+fmt(r.esperado-r.soma)+" — confira"}${subst?` · ${subst} lançamento(s) manual(is) substituído(s) pela fatura`:""}${aviso}</div></div><div class="v">${fmt(r.total)}</div></div>`);
    }catch(err){let msg=err&&err.message||String(err);if(/Invalid PDF|InvalidPDF|password|Password/i.test(msg))msg=/assword/.test(msg)?"PDF protegido por senha: baixe a fatura sem senha no app do banco":"Não é um PDF de fatura válido";else if(/import|module|Failed to fetch/i.test(msg))msg="Não consegui carregar o leitor de PDF. Verifique a internet e tente de novo, ou mande a fatura no chat";res.push(`<div class="it"><div><div class="d">❌ ${esc(f.name)}</div><div class="m">${esc(msg)}</div></div></div>`)}
  }
  if(added){rebuild();const last=S.importadas[S.importadas.length-1];curM=last.m;render();save(added+" fatura(s) importada(s)")}
  const b2=document.getElementById('upRes'); if(b2) b2.innerHTML=res.join("");
}

// ---------- LANÇAR
let q="";
function renderLancar(){
  const el=document.getElementById('s-lancar');
  const _d=new Date();const today=_d.getFullYear()+"-"+String(_d.getMonth()+1).padStart(2,"0")+"-"+String(_d.getDate()).padStart(2,"0");
  const pend=pendentes(); const imps=(S.importadas||[]).slice().sort((a,b)=>a.m<b.m?1:-1);
  const nowM=today.slice(0,7); const upMonths=[]; for(let i=-12;i<=1;i++)upMonths.push(addM(nowM,i)); upMonths.reverse();
  const upDef=pend[0]?pend[0].m:addM(nowM,-1);
  el.innerHTML=`<div class="card" id="upCard"><h3>📄 Enviar faturas do mês</h3><p class="hint">1) Escolha o cartão e o mês dos gastos · 2) selecione o PDF. O app importa os lançamentos e confere com o total do banco. A fatura que vence em novembro corresponde aos gastos de outubro.</p>
   ${pend.length?`<div class="note" style="margin-bottom:10px"><b>Faturas já fechadas e ainda não enviadas:</b><br>${pend.map(p=>`• ${esc(CARDS[p.c].nome)} — gastos de ${ml(p.m)} (vence ${dueLabel(p.c,p.m)})`).join("<br>")}</div>`:`<div class="note" style="margin-bottom:10px">✓ Todas as faturas fechadas já estão no app.</div>`}
   <div class="g2"><div><label class="f">Cartão</label><select id="upC">${CARDS.map((c,i)=>`<option value="${i}" ${pend[0]&&pend[0].c===i?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></div>
   <div><label class="f">Mês dos gastos</label><select id="upM">${upMonths.map(m=>`<option value="${m}" ${m===upDef?"selected":""}>${ml(m)}</option>`).join("")}</select></div></div>
   <div class="hint" id="upDue" style="margin:6px 0 10px"></div>
   <label class="btn" style="margin-top:0" for="upF">Escolher o PDF da fatura</label><input id="upF" type="file" accept="application/pdf,.pdf" style="display:none">
   <div id="upRes" class="list" style="margin-top:8px"></div>
   ${imps.length?`<details style="margin-top:10px"><summary>Faturas enviadas pelo app (${imps.length})</summary>${imps.map(f=>`<div class="it"><div><div class="d">${esc(CARDS[f.c].nome)} · gastos de ${ml(f.m)}</div><div class="m">vence ${dueLabel(f.c,f.m)} · ${f.rows.length} lançamentos · ${f.ok?"✓ conferida":"⚠ diferença "+fmt(f.dif)}</div></div><div style="display:flex;gap:8px;align-items:center"><span class="v">${fmt(f.total)}</span><button class="del" data-rm="${f.c}|${f.m}" aria-label="Remover fatura" style="width:30px">✕</button></div></div>`).join("")}</details>`:""}
  </div>
  <div class="card"><h3>💬 Lançamento rápido por mensagem</h3><p class="hint">Escreva ou cole mensagens do WhatsApp, um gasto por linha. Mensagens copiadas do WhatsApp trazem o remetente: o app reconhece Luis ${esc(fmtFone(fones().Luis))} e Roanna ${esc(fmtFone(fones().Roanna))}. Ex.:<br><i>mercado 132,50 nubank roanna · uber 25 bradesco · farmácia 89,90 pix · tênis 600 3x ourocard · ontem posto 200 bradesco</i></p>
   <textarea id="qTxt" rows="3" placeholder="mercado 132,50 nubank roanna" style="width:100%;font:inherit;font-size:15px;padding:10px 12px;border:1px solid var(--line);border-radius:12px"></textarea>
   <button class="btn" id="qGo">Interpretar mensagem</button><div id="qPrev"></div></div>
  <div class="card"><h3>Novo gasto</h3><p class="hint">Registro rápido. O app calcula em qual fatura o gasto cai.</p>
   <div class="seg" id="orig"><button data-o="Manual" class="on">✍️ Manual</button><button data-o="WhatsApp">💬 WhatsApp</button><button data-o="Apple Wallet">📱 Wallet</button></div>
   <div class="g2"><div><label class="f">Valor (R$)</label><input id="nV" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0,00"></div><div><label class="f">Data</label><input id="nD" type="date" value="${today}"></div></div>
   <label class="f">Descrição</label><input id="nDesc" placeholder="Ex.: Supermercado">
   <div class="g2"><div><label class="f">Categoria</label><select id="nC">${CATS.map(c=>`<option>${esc(c)}</option>`).join("")}</select></div>
   <div><label class="f">Pagamento</label><select id="nP">${CARDS.map(c=>`<option ${who!=="Casal"&&c.holder===who&&c===CARDS.find(x=>x.holder===who)?"selected":""}>${esc(c.nome)}</option>`).join("")}<option>Pix</option><option>Débito</option><option>Dinheiro</option></select></div></div>
   <label class="f">Classificação</label><div class="seg" id="nCls"><button data-v="E" class="on">Essencial</button><button data-v="N">Não essencial</button><button data-v="I">Investimento</button></div>
   <div class="g2"><div><label class="f">Parcelas</label><input id="nN" type="number" min="1" max="24" value="1"></div><div><label class="f">Quem</label><select id="nW">${["Luis","Roanna","Casal"].map(w=>`<option ${w===(who==="Casal"?ME:who)?"selected":""}>${w}</option>`).join("")}</select></div></div>
   <div class="g2" style="align-items:end"><div><label class="f">Comprovante (foto/PDF)</label><input id="nF" type="file" accept="image/*,application/pdf"></div><div style="font-size:12px;color:var(--muted);padding-bottom:10px" id="fRef"></div></div>
   <button class="btn" id="nSave">Adicionar gasto</button></div>
  <div class="card"><h3>Integrações</h3><p class="hint">Como os gastos chegam ao app</p>
   <div class="integr">
    <div class="kpi"><b>💬 WhatsApp</b><div class="s" style="margin-top:4px">Foto/áudio do comprovante para o bot; ele lê valor, data e loja.</div></div>
    <div class="kpi"><b>📱 Apple Wallet</b><div class="s" style="margin-top:4px">Automação do Atalhos dispara a cada Apple Pay.</div></div>
    <div class="kpi"><b>🏦 Open Finance</b><div class="s" style="margin-top:4px">Sincroniza Bradesco, BB e Nubank automaticamente.</div></div>
    <div class="kpi"><b>📄 Fatura PDF</b><div class="s" style="margin-top:4px">Envie o PDF e os lançamentos são importados e conciliados.</div></div>
   </div>
   <p class="note" style="margin-top:10px">Neste protótipo, WhatsApp e Wallet aparecem como origem do lançamento. Para faturas novas, use "Enviar faturas do mês" no topo desta tela.</p></div>
  <div class="card"><h3>Lançamentos${who!=="Casal"?" · "+who:""}</h3><input id="srch" placeholder="Buscar loja, categoria ou cartão…" value="${esc(q)}" style="margin-bottom:6px"><div class="list" id="lst"></div></div>`;
  const upInfo=()=>{const c=+document.getElementById('upC').value,m=document.getElementById('upM').value;const d=dueMonth(m);const has=fatOf(c,m);document.getElementById('upDue').innerHTML=`Fatura com vencimento em <b>${String(CARDS[c].venc).padStart(2,"0")}/${d.slice(5,7)}/${d.slice(0,4)}</b> (gastos de ${ml(m)})${has?" · ⚠ essa fatura já está no app":""}`};
  document.getElementById('upC').onchange=upInfo; document.getElementById('upM').onchange=upInfo; upInfo();
  document.getElementById('upF').onchange=e=>{importFiles([...e.target.files],+document.getElementById('upC').value,document.getElementById('upM').value);e.target.value=""};
  el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const [c,m]=b.dataset.rm.split("|");S.importadas=(S.importadas||[]).filter(f=>!(f.c===+c&&f.m===m));rebuild();render();save("Fatura removida")});
  let origem="Manual";
  el.querySelectorAll('#orig button').forEach(b=>b.onclick=()=>{origem=b.dataset.o;el.querySelectorAll('#orig button').forEach(x=>x.classList.toggle('on',x===b))});
  const g=id=>document.getElementById(id);
  const upd=()=>{const d=g('nD').value;if(d)g('fRef').textContent="Conta nos gastos de "+ml(refMonth(d,g('nP').value))};
  g('qGo').onclick=()=>{const items=parseQuick(g('qTxt').value);if(!items.length)return toast("Não entendi nenhum gasto: inclua o valor (ex.: mercado 50)");
    const box=g('qPrev');box.innerHTML=`<div class="list" style="margin-top:8px">${items.map(t=>`<div class="it"><div style="min-width:0"><div class="d">${esc(t.desc)}</div><div class="m">${t.data.slice(8)}/${t.data.slice(5,7)} · ${esc(t.cat)} · ${esc(short(t.cartao))}${t.parcN>1?" · "+t.parcN+"x":""} · ${esc(t.quem)} · gastos de ${ml(t.ref)}</div></div><div style="text-align:right"><div class="v">${fmt(t.valor*t.parcN)}</div><span class="cls cls-${t.c}" style="cursor:default">${CLS_S[t.c]}</span></div></div>`).join("")}</div><button class="btn" id="qOk">Lançar ${items.length} gasto(s)</button>`;
    g('qOk').onclick=()=>{S.cls=S.cls||{};items.forEach((t,i)=>{const id="n"+Date.now()+"_"+i;const n=t.parcN;S.novos=[{id,data:t.data,desc:t.desc,cat:t.cat,valor:+(t.valor).toFixed(2),parc:n>1?"01/"+String(n).padStart(2,"0"):"",parcN:n,ref:t.ref,cartao:t.cartao,final:"",tipo:n>1?"Parcelado":"Variável",origem:"WhatsApp",quem:t.quem,holder:t.quem}].concat(S.novos||[]);S.cls[id]=t.c});
      curM=items[0].ref;render();save(items.length+" gasto(s) lançado(s) pela mensagem")}};
  g('nD').onchange=upd;g('nP').onchange=upd;upd();
  let nCls="E";const setCls=v=>{nCls=v;el.querySelectorAll('#nCls button').forEach(x=>x.classList.toggle('on',x.dataset.v===v))};
  el.querySelectorAll('#nCls button').forEach(b=>b.onclick=()=>setCls(b.dataset.v));
  g('nC').onchange=()=>setCls(ESS_DEF[g('nC').value]||"N"); setCls(ESS_DEF[g('nC').value]||"N");
  g('nSave').onclick=()=>{
    const v=+g('nV').value, d=g('nD').value, desc=g('nDesc').value.trim(), n=Math.max(1,+g('nN').value||1);
    if(!v||!d||!desc) return toast("Preencha valor, data e descrição");
    const cart=g('nP').value, ref=refMonth(d,cart), cat=g('nC').value;
    const t={id:"n"+Date.now(),data:d,desc,cat,valor:+(v/n).toFixed(2),parc:n>1?"01/"+String(n).padStart(2,"0"):"",parcN:n,ref,cartao:cart,final:"",tipo:n>1?"Parcelado":"Variável",origem,quem:g('nW').value,holder:g('nW').value,comprovante:g('nF').files[0]?g('nF').files[0].name:""};
    S.novos=[t].concat(S.novos||[]); S.cls=S.cls||{}; S.cls[t.id]=nCls;
    const rr=rendaWho(), gt=sumF(fixosWho(),true)+sumB(bills(ref)), p=rr?gt/rr:0;
    const msg=rr&&p>=1?`⚠️ Gasto geral de ${ml(ref)} passou a renda (${Math.round(p*100)}%)`:rr&&p>=(S.alerta||.8)?`⚠️ Gasto geral de ${ml(ref)} em ${Math.round(p*100)}% da renda`:"Gasto adicionado em "+ml(ref);
    curM=ref; render(); save(msg);
  };
  const draw=()=>{const qq=q.toLowerCase();const l=allTx().filter(t=>!qq||t.desc.toLowerCase().includes(qq)||t.cat.toLowerCase().includes(qq)||t.cartao.toLowerCase().includes(qq));
    g('lst').innerHTML=l.slice(0,60).map(itemHTML).join("")+(l.length>60?`<p class="hint" style="margin-top:8px">Mostrando 60 de ${l.length}. Refine a busca.</p>`:"")};
  g('srch').oninput=e=>{q=e.target.value;draw()}; draw();
}

render();
let rsz;window.addEventListener("resize",()=>{clearTimeout(rsz);rsz=setTimeout(renderTab,200)});
window.addEventListener('hashchange',()=>{const t=location.hash.slice(1);if(t&&t!==tab&&TABS.includes(t)){tab=t;render()}});
setSync(RO?"ro":"ok"); setInterval(poll,15000); document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
try{const p=JSON.parse(localStorage.getItem('casaRL_pending')||"null"); if(p&&p.areas){/* alterações não enviadas de uma sessão anterior */ AREAS.forEach(k=>{if(p.areas[k]&&JSON.stringify(p.areas[k])!==LAST[k])applyArea(k,p.areas[k])}); if(Array.isArray(p.novos))S.novos=p.novos; if(Array.isArray(p.importadas))S.importadas=p.importadas; rebuild(); render(); dirty=true; flush();}}catch(e){}
};