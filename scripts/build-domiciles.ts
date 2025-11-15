import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

async function fetchProvinces(): Promise<Province[]> {
  const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch provinces: ${response.statusText}`);
  }
  return response.json();
}

async function fetchRegencies(provinceId: string): Promise<Regency[]> {
  const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch regencies for province ${provinceId}: ${response.statusText}`);
  }
  return response.json();
}

async function buildDomiciles() {
  console.log('🚀 Memulai pengambilan data wilayah Indonesia...\n');

  try {
    console.log('📍 Mengambil data provinsi...');
    const provinces = await fetchProvinces();
    console.log(`✅ Berhasil mengambil ${provinces.length} provinsi\n`);

    const domiciles: string[] = [];

    const toCapitalize = (str: string): string => {
      return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    for (const province of provinces) {
      console.log(`📍 Mengambil kabupaten/kota dari ${province.name}...`);
      const regencies = await fetchRegencies(province.id);
      
      for (const regency of regencies) {
        const formattedRegency = toCapitalize(regency.name);
        const formattedProvince = toCapitalize(province.name);
        domiciles.push(`${formattedRegency} - ${formattedProvince}`);
      }
      
      console.log(`   ✅ ${regencies.length} kabupaten/kota`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    domiciles.sort((a, b) => a.localeCompare(b, 'id'));
    console.log(`\n✅ Total: ${domiciles.length} kabupaten/kota dari seluruh Indonesia\n`);

    const jsonData = {
      _metadata: {
        generatedAt: new Date().toISOString(),
        totalDomiciles: domiciles.length,
        source: "API Wilayah Indonesia - Emsifa"
      },
      domiciles: domiciles
    };

    const outputPath = join(process.cwd(), 'public', 'data', 'domiciles.json');
    
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
      console.log('📁 Folder dibuat:', outputDir);
    }
    
    writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log('💾 File berhasil disimpan ke:', outputPath);
    console.log('\n✨ Selesai!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

buildDomiciles();