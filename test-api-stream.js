const http = require('http');

async function test() {
  const url = 'https://www.tiktok.com/@tiktok/video/7106594312292453675';
  console.log('Fetching from tikwm...');
  try {
    const apiRes = await fetch('https://tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({ url: url, count: '12', cursor: '0', web: '1', hd: '1' })
    });
    const data = await apiRes.json();
    
    if (data.code === 0 && data.data && data.data.play) {
        let targetUrl = data.data.play;
        if (targetUrl.startsWith('/')) {
            targetUrl = `https://tikwm.com${targetUrl}`;
        }
        
        const videoRes = await fetch(targetUrl);
        console.log('Video fetch status:', videoRes.status);
        
        let bytes = 0;
        if (videoRes.body) {
            const reader = videoRes.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                bytes += value.byteLength;
            }
        }
        console.log('Streamed bytes:', bytes);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
