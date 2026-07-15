const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const AT_BANKS = [
  { slug: "bank-austria", domain: "bankaustria.at" },
  { slug: "bawag-ag", domain: "bawag.at" },
  { slug: "erste-bank-und-sparkassen", domain: "sparkasse.at" },
  { slug: "raiffeisen-bankengruppe-oesterreich", domain: "raiffeisen.at" },
  { slug: "volksbanken", domain: "volksbank.at" },
  { slug: "posojilnica-bank-egen", domain: "posojilnica-bank.at" },
  { slug: "bank99-ag", domain: "bank99.at" },
  { slug: "btv-vier-lander-bank", domain: "btv.at" },
  { slug: "bks-bank-ag", domain: "bks.at" },
  { slug: "oberbank-ag", domain: "oberbank.at" },
  { slug: "hypo-noe-lb", domain: "hyponoe.at" },
  { slug: "hypo-tirol-bank-ag", domain: "hypotirol.com" },
  { slug: "hypo-vorarlberg-bank-ag", domain: "hypovbg.at" },
  { slug: "hypo-bank-burgenland-ag", domain: "bank-bgld.at" },
  { slug: "hypo-oberoesterreich-salzburg", domain: "hypo.at" },
  { slug: "oesterreichische-aerzte-und-apothekerbank", domain: "apothekerbank.at" },
  { slug: "bankhaus-carl-spangler-und-co-ag", domain: "spaengler.at" },
  { slug: "schelhammer-capital-bank-ag", domain: "schelhammer.at" },
  { slug: "easybank", domain: "easybank.at" },
  { slug: "schoellerbank-ag", domain: "schoellerbank.at" },
  { slug: "sparda-bank-wien", domain: "sparda.at" },
  { slug: "volkskreditbank-ag", domain: "vkb-bank.at" },
  { slug: "austrian-anadi-bank-ag", domain: "anadibank.com" },
  { slug: "marchfelder-bank", domain: "marchfelderbank.at" },
  { slug: "dolomitenbank", domain: "dolomitenbank.at" }
];

const logosDir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    client.get(url, options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
        return download(res.headers.location.startsWith('http') ? res.headers.location : `https://${new URL(url).hostname}${res.headers.location}`, dest).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const bank of AT_BANKS) {
    const dest = path.join(logosDir, `${bank.slug}.png`);
    const clearbitUrl = `https://logo.clearbit.com/${bank.domain}`;
    const googleUrl = `https://www.google.com/s2/favicons?domain=${bank.domain}&sz=128`;
    
    console.log(`Downloading logo for ${bank.slug}...`);
    try {
      await download(clearbitUrl, dest);
      console.log(`  -> Downloaded from Clearbit`);
    } catch (e) {
      console.log(`  -> Clearbit failed, trying Google...`);
      try {
        await download(googleUrl, dest);
        console.log(`  -> Downloaded from Google`);
      } catch (e2) {
        console.log(`  -> Failed completely: ${e2.message}`);
        // Create an empty file to prevent 404s if completely failed
        fs.writeFileSync(dest, '');
      }
    }
  }
}

main().catch(console.error);