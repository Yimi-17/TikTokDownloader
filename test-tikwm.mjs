async function test() {
  const url = 'https://vt.tiktok.com/ZSq5YjpsD/';
  const apiRes = await fetch('https://tikwm.com/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({ url: url, count: '12', cursor: '0', web: '1', hd: '1' })
  });
  
  const text = await apiRes.text();
  console.log('Status:', apiRes.status);
  console.log('Headers:', Object.fromEntries(apiRes.headers.entries()));
  console.log('Body snippet:', text.substring(0, 200));
}
test();
