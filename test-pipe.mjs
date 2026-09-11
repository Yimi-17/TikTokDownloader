import { Readable } from 'stream';

async function test() {
  const targetUrl = 'https://tikwm.com/video/media/play/7194957859245821190.mp4';
  const videoRes = await fetch(targetUrl);
  
  if (videoRes.body) {
     console.log('Body is present');
     try {
       const readable = Readable.fromWeb(videoRes.body);
       console.log('Readable created');
     } catch(e) {
       console.error('Error creating Readable', e);
     }
  }
}
test();
