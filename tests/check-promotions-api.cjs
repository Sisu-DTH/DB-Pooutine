const fs = require('node:fs');
const assert = require('node:assert/strict');

async function main() {
  const source = JSON.parse(fs.readFileSync('smart-promotions-source.json','utf8'));
  assert.equal(source.enabled,false,
    'Production rollout switch must stay OFF until the restaurant confirms the public API has no unapproved offers.');
  assert.equal(source.apiUrl,
    'https://promotions-manager-api-production.up.railway.app/api/promotions');

  const response = await fetch(source.apiUrl,{
    headers:{Origin:'https://dbpoutine.com'},
    signal:AbortSignal.timeout(12000)
  });
  assert.equal(response.status,200,'Railway public promotions endpoint is not healthy');
  assert.equal(response.headers.get('access-control-allow-origin'),
    'https://dbpoutine.com','Railway CORS must permit the restaurant domain');
  const feed = await response.json();
  assert.equal(feed.timeZone,'America/Toronto');
  assert.ok(Array.isArray(feed.offers));
  console.log('Public API check passed; active offers currently returned:',feed.offers.length);
  if(feed.offers.length>0) {
    console.log('WARNING: Keep rollout switch OFF until the restaurant confirms these offers are authorised.');
  }
}
main().catch(err => { console.error('API verification failed:',err.message);process.exitCode=1; });
