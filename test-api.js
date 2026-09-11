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
    console.log('Tikwm response:', data);
    
    if (data.code === 0 && data.data && data.data.play) {
        console.log('Video URL:', data.data.play);
        const videoRes = await fetch(data.data.play);
        console.log('Video fetch status:', videoRes.status, videoRes.statusText);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
test();
