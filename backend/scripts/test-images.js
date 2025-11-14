const https = require('https');

const imageUrls = [
  'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=800&fit=crop', // Feid
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=800&fit=crop', // Karol G
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop', // Rock al Parque
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop', // Arctic Monkeys
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&h=800&fit=crop', // The Strokes
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop', // Bad Bunny
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop', // Café Tacvba
];

function testImage(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const status = res.statusCode;
      res.on('data', () => {}); // Consumir datos
      res.on('end', () => {
        if (status === 200) {
          console.log(`✅ ${status} - ${url.substring(0, 80)}...`);
          resolve(true);
        } else {
          console.log(`❌ ${status} - ${url.substring(0, 80)}...`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ERROR - ${url.substring(0, 80)}...`);
      console.log(`   ${err.message}`);
      resolve(false);
    });
  });
}

async function testAllImages() {
  console.log('🧪 Testeando URLs de imágenes...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const url of imageUrls) {
    const result = await testImage(url);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Resultados: ${passed} ✅  ${failed} ❌`);
  
  if (failed === 0) {
    console.log('🎉 Todas las imágenes están funcionando!');
  } else {
    console.log('⚠️  Algunas imágenes no están disponibles');
  }
}

testAllImages().catch(console.error);
