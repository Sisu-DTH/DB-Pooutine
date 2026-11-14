const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../smart-promotions.js'), 'utf8');
const ottawa = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Toronto', year: 'numeric', month: '2-digit',
  day: '2-digit', weekday: 'long'
}).formatToParts(new Date());
const parts = Object.fromEntries(ottawa.filter(x => x.type !== 'literal').map(x => [x.type,x.value]));
const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].indexOf(parts.weekday);
const today = parts.year + '-' + parts.month + '-' + parts.day;
const URL = 'https://promotions-manager-api-production.up.railway.app/api/promotions';

function offer(changes={}) {
  return {
    approved:true,enabled:true,startDate:today,endDate:today,weekdays:[day],
    name:{'en-CA':'D&B Poutine','en-GB':'D&B Poutine',
      'fr-CA':'Poutine D&B',es:'Poutine D&B'},
    image:'small-pou.webp',originalCents:699,discountedCents:594,
    redemption:'In-store only; ask the cashier',...changes
  };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

async function render(sourceConfig, responseData, onFetch) {
  const fields=new Map();
  for(const key of ['eyebrow','heading','meal','image','original','discounted',
   'saving','validity','redemption','link']) fields.set(key,{textContent:'',src:'',alt:''});
  const section={
    hidden:false,
    querySelector(selector){
      const match=selector.match(/data-promo="([^"]+)"/);
      return fields.get(match?.[1]) || null;
    }
  };
  const picker={value:'en-CA',listeners:{},
    addEventListener(type,cb){this.listeners[type]=cb}};
  const document={hidden:false,listeners:{},getElementById(){return section},
    querySelector(){return picker},
    addEventListener(type,cb){this.listeners[type]=cb}};
  let interval;
  const calls=[];
  const responses=[{enabled:false}, ...(responseData===undefined?[]:[responseData])];
  const fetch=async target=>{
    calls.push(target);if(onFetch) return onFetch(target,calls.length);
    if(target==='smart-promotions-source.json') {
      return {ok:true,json:async()=>sourceConfig};
    }
    if(target===URL) return {ok:true,json:async()=>responseData};
    throw new Error('Unexpected URL '+target);
  };
  const window={setTimeout:()=>23,clearTimeout:()=>{},setInterval:(cb)=>{interval=cb}};
  vm.runInNewContext(source,{document,window,fetch,AbortController,Intl,Date},
    {timeout:3000});
  for(let i=0;i<8;i++) await tick();
  return {section,fields,picker,calls,interval,document,
    async flush(){for(let i=0;i<8;i++)await tick()}};
}

test('default-off rollout does not call the API or display an offer',async()=>{
  const state=await render({enabled:false,apiUrl:URL},{
    timeZone:'America/Toronto',offers:[offer()]
  });
  assert.equal(state.section.hidden,true);
  assert.deepEqual(state.calls,['smart-promotions-source.json']);
});

test('enabled empty feed keeps promotion section hidden',async()=>{
  const state=await render({enabled:true,apiUrl:URL},{
    timeZone:'America/Toronto',offers:[]
  });
  assert.equal(state.section.hidden,true);
  assert.deepEqual(state.calls,['smart-promotions-source.json',URL]);
});

test('valid Ottawa offer renders translated meal, CAD amount and redemption terms',async()=>{
  const state=await render({enabled:true,apiUrl:URL},{
    timeZone:'America/Toronto',offers:[offer()]
  });
  assert.equal(state.section.hidden,false);
  assert.equal(state.fields.get('meal').textContent,'D&B Poutine');
  assert.match(state.fields.get('saving').textContent,/1\.05/);
  assert.match(state.fields.get('saving').textContent,/^15\s*% off today only.*1\.05/);
  assert.match(state.fields.get('redemption').textContent,/In-store only/);
  state.picker.value='fr-CA';
  state.picker.listeners.change();
  assert.match(state.fields.get('heading').textContent,/Offre du jour/);
  assert.match(state.fields.get('redemption').textContent,/Modalités/);
});

test('rejects unavailable or unapproved or expired offers',async()=>{
  for(const changed of [
    {approved:false}, {enabled:false}, {startDate:'2020-01-01',endDate:'2020-01-02'},
    {redemption:''}, {discountedCents:800}, {image:'../../secret.txt'}
  ]) {
    const state=await render({enabled:true,apiUrl:URL},{
      timeZone:'America/Toronto',offers:[offer(changed)]
    });
    assert.equal(state.section.hidden,true,JSON.stringify(changed));
  }
});

test('feed failure and invalid source URL fail closed',async()=>{
  const invalid=await render({enabled:true,apiUrl:'https://evil.example/api/promotions'},{
    timeZone:'America/Toronto',offers:[offer()]
  });
  assert.equal(invalid.section.hidden,true);
  assert.equal(invalid.calls.length,1);
  const failed=await render({enabled:true,apiUrl:URL},null,async target=>{
    if(target===URL)throw Error('API unavailable');
    return {ok:true,json:async()=>({enabled:true,apiUrl:URL})};
  });
  assert.equal(failed.section.hidden,true);
});

test('paused offer disappears after periodic refresh',async()=>{
  let calls=0;
  const state=await render({enabled:true,apiUrl:URL},null,async target=>{
    if(target==='smart-promotions-source.json')return {ok:true,
      json:async()=>({enabled:true,apiUrl:URL})};
    calls++;
    return {ok:true,json:async()=>({
      timeZone:'America/Toronto',offers:calls===1?[offer()]:[]
    })};
  });
  assert.equal(state.section.hidden,false);
  state.interval();
  await state.flush();
  assert.equal(state.section.hidden,true);
});
