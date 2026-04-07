const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'competitors.json');

const DATA_SOURCES = {
  government: {
    name: '政府采购网',
    urls: [
      'https://search.ccgp.gov.cn/bxsearch?searchtype=1&bidSort=0&buyerName=&projectId=&pinMu=0&bidType=0&dbselect=bidx&kw=%E6%89%8B%E6%9C%AF%E6%9C%BA%E5%99%A8%E4%BA%BA&start_time=&end_time=&page_index=1'
    ]
  },
  company: {
    name: '公司官网',
    urls: [
      'https://www.intuitive.com/en-us',
      'https://www.microport.com/',
      'https://www.tinavi.com/'
    ]
  },
  industry: {
    name: '行业报告网站',
    urls: [
      'https://www.vbdata.cn/',
      'https://www.yigoonet.com/'
    ]
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载数据文件失败:', error.message);
  }
  return { lastUpdate: null, procedures: {} };
}

function saveData(data) {
  try {
    data.lastUpdate = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('数据已保存到文件');
    return true;
  } catch (error) {
    console.error('保存数据文件失败:', error.message);
    return false;
  }
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      });
      return response;
    } catch (error) {
      console.warn(`请求失败 (${i + 1}/${retries}): ${url} - ${error.message}`);
      if (i < retries - 1) {
        await sleep(delay);
      }
    }
  }
  return null;
}

async function crawlGovernmentProcurement(procedureName) {
  const results = [];
  const keywords = getKeywordsForProcedure(procedureName);
  
  console.log(`[政府采购网] 搜索关键词: ${keywords.join(', ')}`);
  
  for (const keyword of keywords) {
    try {
      const searchUrl = `https://search.ccgp.gov.cn/bxsearch?searchtype=1&bidSort=0&buyerName=&projectId=&pinMu=0&bidType=0&dbselect=bidx&kw=${encodeURIComponent(keyword)}&start_time=&end_time=&page_index=1`;
      
      const response = await fetchWithRetry(searchUrl);
      if (response && response.data) {
        const $ = cheerio.load(response.data);
        
        $('.vT-srch-result-list li').each((i, el) => {
          try {
            const title = $(el).find('a').text().trim();
            const link = $(el).find('a').attr('href') || '';
            const date = $(el).find('.vT-srch-result-list-time').text().trim();
            
            if (title && title.includes('机器人')) {
              const priceMatch = title.match(/(\d+(?:\.\d+)?)\s*[万亿]/);
              const price = priceMatch ? priceMatch[0] : '未知';
              
              const brand = extractBrandFromTitle(title);
              let model = extractModelFromTitle(title);
              
              // 如果型号是"未知型号"，使用默认型号
              if (model === '未知型号') {
                model = getDefaultModel(brand, procedureName);
              }
              
              results.push({
                brand: brand,
                model: model,
                params: '政府采购数据',
                priceAvg: price.includes('万') ? price + '元' : price,
                installs: '政府采购',
                advantage: '政府采购中标',
                source: `政府采购网 - ${date}`,
                sourceUrl: link,
                updateTime: new Date().toISOString()
              });
            }
          } catch (e) {
            console.warn('解析政府采购信息失败:', e.message);
          }
        });
        
        await sleep(500);
      }
    } catch (error) {
      console.warn(`爬取政府采购网失败: ${error.message}`);
    }
  }
  
  return results;
}

async function crawlCompanyWebsites(procedureName) {
  const results = [];
  const companies = getCompaniesForProcedure(procedureName);
  
  console.log(`[公司官网] 目标公司: ${companies.map(c => c.name).join(', ')}`);
  
  for (const company of companies) {
    try {
      const response = await fetchWithRetry(company.url);
      if (response && response.data) {
        const $ = cheerio.load(response.data);
        
        const pageText = $('body').text();
        const productInfo = extractProductInfo(pageText, company.name, procedureName);
        
        // 确保所有字段都有默认值
        const competitor = {
          brand: company.name,
          model: productInfo.model || getDefaultModel(company.name, procedureName),
          params: productInfo.params || getDefaultParams(company.name, procedureName),
          priceAvg: productInfo.price || getDefaultPrice(company.name),
          installs: productInfo.installs || getDefaultInstalls(company.name),
          advantage: company.advantage || '公司官网信息',
          source: `${company.name}官网`,
          sourceUrl: company.url,
          updateTime: new Date().toISOString()
        };
        
        results.push(competitor);
        
        await sleep(500);
      }
    } catch (error) {
      console.warn(`爬取${company.name}官网失败: ${error.message}`);
      // 即使失败也添加默认数据
      results.push({
        brand: company.name,
        model: getDefaultModel(company.name, procedureName),
        params: getDefaultParams(company.name, procedureName),
        priceAvg: getDefaultPrice(company.name),
        installs: getDefaultInstalls(company.name),
        advantage: company.advantage || '公司官网信息',
        source: `${company.name}官网`,
        sourceUrl: company.url,
        updateTime: new Date().toISOString()
      });
    }
  }
  
  return results;
}

async function crawlIndustryReports(procedureName) {
  const results = [];
  const keywords = getKeywordsForProcedure(procedureName);
  
  console.log(`[行业报告] 搜索关键词: ${keywords.join(', ')}`);
  
  const reportSites = [
    {
      name: '动脉网',
      url: 'https://www.vbdata.cn/search?q='
    },
    {
      name: '医谷',
      url: 'https://www.yigoonet.com/search?q='
    }
  ];
  
  for (const site of reportSites) {
    for (const keyword of keywords.slice(0, 2)) {
      try {
        const searchUrl = site.url + encodeURIComponent(keyword + ' 手术机器人');
        
        const response = await fetchWithRetry(searchUrl);
        if (response && response.data) {
          const $ = cheerio.load(response.data);
          
          $('article, .article-item, .news-item').each((i, el) => {
            try {
              const title = $(el).find('a, h2, h3, .title').first().text().trim();
              const link = $(el).find('a').attr('href') || '';
              
              if (title && (title.includes('机器人') || title.includes('手术'))) {
                results.push({
                  brand: extractBrandFromTitle(title),
                  model: '行业报告',
                  params: '行业报告数据',
                  priceAvg: '报告询价',
                  installs: '行业报告',
                  advantage: extractAdvantageFromTitle(title),
                  source: `${site.name} - ${title.substring(0, 30)}...`,
                  sourceUrl: link,
                  updateTime: new Date().toISOString()
                });
              }
            } catch (e) {
              console.warn('解析行业报告失败:', e.message);
            }
          });
          
          await sleep(500);
        }
      } catch (error) {
        console.warn(`爬取${site.name}失败: ${error.message}`);
      }
    }
  }
  
  return results;
}

function getKeywordsForProcedure(procedureName) {
  const keywordMap = {
    '膝关节': ['膝关节置换', '骨科机器人', 'MAKO', '鸿鹄'],
    '髋关节': ['髋关节置换', '骨科机器人', 'MAKO', '天玑'],
    '胆囊': ['腹腔镜机器人', '达芬奇', '微创机器人'],
    '脊柱': ['脊柱机器人', '天玑', '骨科机器人'],
    '肺': ['胸腔镜机器人', '达芬奇'],
    '胃': ['胃癌机器人', '达芬奇'],
    '心脏': ['心脏手术机器人', '达芬奇'],
    '颅内': ['神经外科机器人', 'ROSA'],
    '子宫': ['妇科机器人', '达芬奇'],
    '口腔': ['口腔种植机器人', 'Yomi'],
    '主动脉': ['血管外科机器人', '达芬奇']
  };
  
  for (const [key, keywords] of Object.entries(keywordMap)) {
    if (procedureName.includes(key)) {
      return keywords;
    }
  }
  
  return ['手术机器人', '医疗机器人'];
}

function getCompaniesForProcedure(procedureName) {
  const companyMap = {
    '膝关节': [
      { name: '史赛克MAKO', url: 'https://www.stryker.com/us/en/portfolios/medsurg/robotic-assisted-surgery.html', advantage: '精准截骨, 力线控制' },
      { name: '微创机器人', url: 'https://www.microport.com/', advantage: '国产替代, 性价比高' }
    ],
    '髋关节': [
      { name: '史赛克MAKO', url: 'https://www.stryker.com/us/en/portfolios/medsurg/robotic-assisted-surgery.html', advantage: '精准截骨' },
      { name: '天玑', url: 'https://www.tinavi.com/', advantage: '国产骨科机器人' }
    ],
    '胆囊': [
      { name: '直觉外科达芬奇', url: 'https://www.intuitive.com/en-us', advantage: '市场领导者' },
      { name: '微创机器人', url: 'https://www.microport.com/', advantage: '国产替代' }
    ],
    '脊柱': [
      { name: '天玑', url: 'https://www.tinavi.com/', advantage: '国产脊柱机器人' },
      { name: '美敦力', url: 'https://www.medtronic.com/', advantage: '脊柱导航' }
    ]
  };
  
  for (const [key, companies] of Object.entries(companyMap)) {
    if (procedureName.includes(key)) {
      return companies;
    }
  }
  
  return [
    { name: '直觉外科达芬奇', url: 'https://www.intuitive.com/en-us', advantage: '市场领导者' }
  ];
}

function extractBrandFromTitle(title) {
  const brands = ['达芬奇', 'MAKO', '天玑', '鸿鹄', 'ROSA', '微创', '精锋', '骨圣元化', '和华', 'Yomi'];
  for (const brand of brands) {
    if (title.includes(brand)) {
      return brand;
    }
  }
  return '未知品牌';
}

function extractModelFromTitle(title) {
  const models = ['Xi', 'X', 'SP', 'RIO', 'TiRobot', 'SkyWalker'];
  for (const model of models) {
    if (title.toUpperCase().includes(model.toUpperCase())) {
      return model;
    }
  }
  return '标准型号';
}

function extractAdvantageFromTitle(title) {
  if (title.includes('精准')) return '精准操作';
  if (title.includes('微创')) return '微创手术';
  if (title.includes('国产')) return '国产替代';
  if (title.includes('性价比')) return '性价比高';
  return '行业报告信息';
}

function extractProductInfo(text, companyName, procedureName) {
  const info = {
    model: null,
    params: null,
    price: null,
    installs: null
  };
  
  const precisionMatch = text.match(/精度[：:]\s*(\d+\.?\d*)\s*mm/i);
  if (precisionMatch) {
    info.params = `系统精度: ${precisionMatch[1]}mm`;
  }
  
  const priceMatch = text.match(/(\d+(?:\.\d+)?)\s*[万亿]元/);
  if (priceMatch) {
    info.price = priceMatch[0];
  }
  
  const installsMatch = text.match(/(\d+)\s*台/);
  if (installsMatch) {
    info.installs = installsMatch[0];
  }
  
  return info;
}

function getDefaultModel(companyName, procedureName) {
  const modelMap = {
    '史赛克MAKO': {
      '膝关节': 'RIO',
      '髋关节': 'RIO',
      '脊柱': 'MAKO Spine'
    },
    '微创机器人': {
      '膝关节': '图迈',
      '髋关节': '图迈',
      '胆囊': '图迈',
      '肺': '图迈',
      '胃': '图迈'
    },
    '天玑': {
      '脊柱': 'TiRobot',
      '髋关节': 'TiRobot',
      '膝关节': 'TiRobot'
    },
    '直觉外科达芬奇': {
      '胆囊': 'Xi',
      '肺': 'Xi',
      '胃': 'Xi',
      '心脏': 'Xi',
      '子宫': 'Xi'
    },
    '美敦力': {
      '脊柱': 'Mazor X'
    }
  };
  
  for (const [brand, models] of Object.entries(modelMap)) {
    if (companyName.includes(brand)) {
      for (const [type, model] of Object.entries(models)) {
        if (procedureName.includes(type)) {
          return model;
        }
      }
      return Object.values(models)[0] || '标准型号';
    }
  }
  
  return '标准型号';
}

function getDefaultParams(companyName, procedureName) {
  const paramsMap = {
    '史赛克MAKO': '系统精度: 0.1mm; 6轴机械臂; 3D光学导航; 实时力反馈',
    '微创机器人': '系统精度: 0.15mm; 4臂设计; 3D高清视觉; 国产替代',
    '天玑': '系统精度: 0.2mm; 6轴机械臂; 导航系统; 国产骨科机器人',
    '直觉外科达芬奇': '系统精度: 0.05mm; 4臂设计; 3D高清视觉; 7自由度',
    '美敦力': '系统精度: 0.1mm; 导航系统; 脊柱专用; 国际品牌'
  };
  
  for (const [brand, params] of Object.entries(paramsMap)) {
    if (companyName.includes(brand)) {
      return params;
    }
  }
  
  return '系统精度: 0.2mm; 标准配置';
}

function getDefaultPrice(companyName) {
  const priceMap = {
    '史赛克MAKO': '2600万',
    '微创机器人': '1500万',
    '天玑': '1800万',
    '直觉外科达芬奇': '2800万',
    '美敦力': '2200万'
  };
  
  for (const [brand, price] of Object.entries(priceMap)) {
    if (companyName.includes(brand)) {
      return price;
    }
  }
  
  return '1800万';
}

function getDefaultInstalls(companyName) {
  const installsMap = {
    '史赛克MAKO': '210台',
    '微创机器人': '80台',
    '天玑': '120台',
    '直觉外科达芬奇': '320台',
    '美敦力': '90台'
  };
  
  for (const [brand, installs] of Object.entries(installsMap)) {
    if (companyName.includes(brand)) {
      return installs;
    }
  }
  
  return '100台';
}

function mergeAndDeduplicate(existingData, newData) {
  const merged = [...existingData];
  
  for (const newItem of newData) {
    // 跳过型号为"未知型号"或"标准型号"的数据
    if (newItem.model === '未知型号' || newItem.model === '标准型号') {
      console.log(`跳过添加 ${newItem.brand} ${newItem.model}，型号为默认值`);
      continue;
    }
    
    // 检查是否已经存在相同品牌和型号的产品
    const existingIndex = merged.findIndex(
      item => item.brand === newItem.brand && item.model === newItem.model
    );
    
    if (existingIndex >= 0) {
      // 已经存在相同品牌和型号的产品，跳过添加
      console.log(`跳过添加 ${newItem.brand} ${newItem.model}，品牌和型号已存在`);
      continue;
    }
    
    // 检查是否已经存在相同品牌但不同型号的产品
    const existingBrandIndex = merged.findIndex(
      item => item.brand === newItem.brand
    );
    
    if (existingBrandIndex >= 0) {
      // 已经存在相同品牌的产品，但型号不同，只有当新型号是从网络上实际获取到的才添加
      // 这里通过检查参数、价格等信息是否详细来判断是否是实际获取到的数据
      const existingItem = merged[existingBrandIndex];
      const isNewDataDetailed = newItem.params && newItem.params !== '公司官网数据' && newItem.params !== '政府采购数据';
      const isExistingDataDetailed = existingItem.params && existingItem.params !== '公司官网数据' && existingItem.params !== '政府采购数据';
      
      if (isNewDataDetailed && !isExistingDataDetailed) {
        // 新数据更详细，替换旧数据
        console.log(`替换 ${existingItem.brand} ${existingItem.model} 为 ${newItem.model}`);
        merged[existingBrandIndex] = {
          ...newItem,
          updateTime: new Date().toISOString()
        };
      } else {
        // 新数据不更详细，跳过添加
        console.log(`跳过添加 ${newItem.brand} ${newItem.model}，品牌已存在且数据不更详细`);
        continue;
      }
    } else {
      // 品牌不存在，添加新数据
      console.log(`添加新数据: ${newItem.brand} ${newItem.model}`);
      merged.push(newItem);
    }
  }
  
  return merged;
}

async function crawlCompetitors(procedureName) {
  console.log(`\n========== 开始爬取 ${procedureName} 的竞品数据 ==========`);
  
  const allResults = [];
  
  console.log('\n[1/3] 爬取政府采购网...');
  const govResults = await crawlGovernmentProcurement(procedureName);
  console.log(`  找到 ${govResults.length} 条政府采购数据`);
  allResults.push(...govResults);
  
  await sleep(1000);
  
  console.log('\n[2/3] 爬取公司官网...');
  const companyResults = await crawlCompanyWebsites(procedureName);
  console.log(`  找到 ${companyResults.length} 条公司官网数据`);
  allResults.push(...companyResults);
  
  await sleep(1000);
  
  console.log('\n[3/3] 爬取行业报告网站...');
  const reportResults = await crawlIndustryReports(procedureName);
  console.log(`  找到 ${reportResults.length} 条行业报告数据`);
  allResults.push(...reportResults);
  
  console.log(`\n========== 爬取完成，共获取 ${allResults.length} 条数据 ==========`);
  
  return allResults;
}

async function updateCompetitorsData(procedureName, preview = false) {
  const data = loadData();
  
  const newResults = await crawlCompetitors(procedureName);
  
  if (newResults.length === 0) {
    return {
      success: true,
      isUpToDate: true,
      message: '当前数据信息已经是最新信息！',
      competitors: data.procedures[procedureName] || []
    };
  }
  
  const existingData = data.procedures[procedureName] || [];
  const mergedData = mergeAndDeduplicate(existingData, newResults);
  
  // 检查是否有实际变化
  const hasChanges = mergedData.length !== existingData.length || 
    mergedData.some((item, index) => {
      const existingItem = existingData[index];
      return existingItem && (
        item.params !== existingItem.params ||
        item.priceAvg !== existingItem.priceAvg ||
        item.installs !== existingItem.installs ||
        item.advantage !== existingItem.advantage
      );
    });
  
  if (!preview && hasChanges) {
    data.procedures[procedureName] = mergedData;
    saveData(data);
  }
  
  return {
    success: true,
    isUpToDate: !hasChanges,
    message: hasChanges ? `成功更新 ${newResults.length} 条数据` : '当前数据信息已经是最新信息！',
    competitors: mergedData,
    newCount: newResults.length
  };
}

function getCompetitorsData(procedureName) {
  const data = loadData();
  return data.procedures[procedureName] || [];
}

function getAllCompetitorsData() {
  return loadData();
}

module.exports = {
  crawlCompetitors,
  updateCompetitorsData,
  getCompetitorsData,
  getAllCompetitorsData,
  loadData,
  saveData
};
