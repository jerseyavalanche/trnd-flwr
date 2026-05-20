import { parseStringPromise } from 'xml2js';
import type { Signal, SignalSource, SourceStatus } from '../types.js';

const nowIso = () => new Date().toISOString();
const baseTokens = ['ai','automation','energy','grid','housing','defense','loneliness','consumer','infrastructure','search'];

async function asJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}
const clamp = (v:number)=> Math.max(0, Math.min(10, Number(v.toFixed(2))));

function extractTokens(text: string): string[] {
  const t = text.toLowerCase();
  return baseTokens.filter((k) => t.includes(k));
}

function ok(source: SignalSource, detail: string): SourceStatus { return { source, status: 'ok', detail, updatedAt: nowIso() }; }
function bad(source: SignalSource, detail: string): SourceStatus { return { source, status: 'unavailable', detail, updatedAt: nowIso() }; }

async function rssAdapter(){
  const source: SignalSource='rss';
  try{
    const xml=await fetch('https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml').then(r=>r.text());
    const item=(await parseStringPromise(xml)).rss.channel[0].item?.[0]; if(!item) throw new Error('No RSS item');
    const title=item.title[0]; const summary=(item.description?.[0]?.replace(/<[^>]+>/g,'').slice(0,220) ?? 'No summary');
    const ts=new Date(item.pubDate?.[0] ?? nowIso()).toISOString();
    const ageHours=(Date.now()-new Date(ts).getTime())/36e5;
    const signal: Signal={id:`rss-${Date.now()}`,title,source,url:item.link[0],timestamp:ts,summary,score:clamp(10-ageHours/24),metrics:{age_hours:Number(ageHours.toFixed(2))},tokens:extractTokens(`${title} ${summary}`)};
    return {signals:[signal],status:ok(source,'NYT Tech RSS live')};
  }catch(e){return {signals:[],status:bad(source,`RSS unavailable: ${(e as Error).message}`)};}
}

async function githubAdapter(){
  const source: SignalSource='github';
  try{
    const after=new Date(Date.now()-14*86400_000).toISOString().slice(0,10);
    const data=await asJson(`https://api.github.com/search/repositories?q=created:%3E${after}&sort=stars&order=desc&per_page=1`,{headers:{Accept:'application/vnd.github+json'}});
    const r=data.items?.[0]; if(!r) throw new Error('No repo result');
    const title=r.full_name; const summary=r.description ?? 'No description';
    const signal: Signal={id:`gh-${r.id}`,title,source,url:r.html_url,timestamp:r.created_at,summary,score:clamp(Math.log10((r.stargazers_count??0)+1)*2.5),metrics:{stars:r.stargazers_count??0,forks:r.forks_count??0},tokens:extractTokens(`${title} ${summary}`)};
    return {signals:[signal],status:ok(source,'GitHub repo search live')};
  }catch(e){return {signals:[],status:bad(source,`GitHub unavailable: ${(e as Error).message}`)};}
}

async function redditAdapter(){ const source: SignalSource='reddit'; try{ const data=await asJson('https://www.reddit.com/r/technology/new.json?limit=1',{headers:{'User-Agent':'trnd-flwr/0.1'}}); const p=data.data?.children?.[0]?.data; if(!p) throw new Error('No reddit post'); const title=p.title; const summary=(p.selftext||'Link post').slice(0,220); const upvotes=p.ups??0; const signal: Signal={id:`rd-${p.id}`,title,source,url:`https://reddit.com${p.permalink}`,timestamp:new Date(p.created_utc*1000).toISOString(),summary,score:clamp(Math.log10(upvotes+1)*3),metrics:{upvotes},tokens:extractTokens(`${title} ${summary}`)}; return {signals:[signal],status:ok(source,'Reddit JSON feed live')}; }catch(e){return {signals:[],status:bad(source,`Reddit unavailable: ${(e as Error).message}`)};}}

async function marketAdapter(){ const source: SignalSource='market'; try{ const d=await asJson('https://query1.finance.yahoo.com/v7/finance/quote?symbols=SPY,QQQ,XLE'); const q=d.quoteResponse?.result?.[0]; if(!q) throw new Error('No quote'); const summary=`${q.symbol} ${q.regularMarketPrice} change ${q.regularMarketChangePercent}%`; const signal: Signal={id:`mk-${q.symbol}`,title:`${q.symbol} ${q.regularMarketPrice}`,source,url:`https://finance.yahoo.com/quote/${q.symbol}`,timestamp:new Date(q.regularMarketTime*1000).toISOString(),summary,score:clamp(Math.abs(Number(q.regularMarketChangePercent ?? 0))),metrics:{price:q.regularMarketPrice,change_pct:q.regularMarketChangePercent},tokens:extractTokens(summary)}; return {signals:[signal],status:ok(source,'Yahoo quote live')}; }catch(e){return {signals:[],status:bad(source,`Market unavailable: ${(e as Error).message}`)};}}

async function economyAdapter(){ const source: SignalSource='economy'; try{ const u=new URL('https://api.stlouisfed.org/fred/series/observations'); u.searchParams.set('series_id','CPIAUCSL'); u.searchParams.set('file_type','json'); u.searchParams.set('limit','1'); u.searchParams.set('sort_order','desc'); if(process.env.FRED_API_KEY) u.searchParams.set('api_key',process.env.FRED_API_KEY); const d=await asJson(u.toString()); const o=d.observations?.[0]; if(!o) throw new Error('No FRED observation'); const summary=`US CPI ${o.value} on ${o.date}`; const signal: Signal={id:`ec-${o.date}`,title:`US CPI ${o.value}`,source,url:'https://fred.stlouisfed.org/series/CPIAUCSL',timestamp:`${o.date}T00:00:00.000Z`,summary,score:clamp(Number(o.value)/50),metrics:{cpi_value:o.value},tokens:extractTokens(summary)}; return {signals:[signal],status:ok(source,'FRED API live')}; }catch(e){return {signals:[],status:bad(source,`Economy unavailable: ${(e as Error).message}`)};}}

async function gdeltAdapter(){ const source: SignalSource='gdelt'; try{ const d=await asJson('https://api.gdeltproject.org/api/v2/doc/doc?query=technology&mode=ArtList&maxrecords=1&format=json'); const a=d.articles?.[0]; if(!a) throw new Error('No GDELT article'); const title=a.title || 'GDELT Article'; const summary=(a.seendate ? `Seen ${a.seendate}. `:'') + (a.domain ? `Domain ${a.domain}`:''); const signal: Signal={id:`gd-${encodeURIComponent(title).slice(0,18)}`,title,source,url:a.url,timestamp:new Date().toISOString(),summary,score:5,metrics:{},tokens:extractTokens(`${title} ${summary}`)}; return {signals:[signal],status:ok(source,'GDELT live')}; }catch(e){ return {signals:[],status:bad(source,`GDELT unavailable: ${(e as Error).message}`)}; }}

export async function ingestSignals(){
  const results=await Promise.all([rssAdapter(),githubAdapter(),redditAdapter(),marketAdapter(),economyAdapter(),gdeltAdapter()]);
  return {signals:results.flatMap(r=>r.signals).sort((a,b)=>a.timestamp<b.timestamp?1:-1), status: results.map(r=>r.status)};
}
