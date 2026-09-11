async function test() {
  const targetUrl = 'https://tikwm.com/video/media/play/7194957859245821190.mp4';
  try {
     const videoRes = await fetch(targetUrl);
     console.log('Video fetch status (mp4):', videoRes.status);
     const buf = await videoRes.arrayBuffer();
     console.log('Size:', buf.byteLength);
  } catch(e) { console.log(e); }
}
test();
