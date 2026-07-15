const https = require('https');
const fs = require('fs');

const prompt = encodeURIComponent("Realistic photography of a SPAR supermarket gift competition, large red gift boxes with shiny ribbons, green and red color palette, festive shopping atmosphere, bright store background, shopping carts, 8k resolution, highly detailed, photorealistic");
const url = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_16_9`;
const file = fs.createWriteStream('public/spar-campaign-bg.jpg');

https.get(url, (res) => {
  if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
    https.get(res.headers.location, (redirectRes) => {
      redirectRes.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded AI background via redirect!');
      });
    });
  } else {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded AI background directly!');
    });
  }
}).on('error', (err) => {
  console.error(err);
});
