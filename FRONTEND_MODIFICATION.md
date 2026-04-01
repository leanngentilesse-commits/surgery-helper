# 前端代码修改指南

## 目的
将前端代码中的本地数据调用改为API调用，连接到后端服务。

## 修改步骤

### 1. 添加API基础URL
在脚本开头添加API基础URL：

```javascript
// API基础URL
const API_BASE_URL = 'http://localhost:3001/api';
```

### 2. 修改数据获取函数

#### 2.1 获取科室数据
```javascript
// 替换原来的硬编码departments数组
async function getDepartments() {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    // 返回默认数据作为 fallback
    return [
      { id: "general", name: "普外科", organs: [{ name: "肝胆", order: 1, procedures: ["腹腔镜胆囊切除术"] }, { name: "胃肠", order: 2, procedures: ["胃癌根治术"] }]},
      // 其他科室数据...
    ];
  }
}
```

#### 2.2 获取术式详情
```javascript
// 替换原来的getDetail函数
async function getDetail(procName) {
  try {
    const response = await fetch(`${API_BASE_URL}/procedures/${encodeURIComponent(procName)}`);
    if (response.ok) {
      return await response.json();
    }
    // 如果API返回404，使用默认数据
    return getDefaultDetail(procName, "待定", "待定");
  } catch (error) {
    console.error('Failed to fetch procedure:', error);
    return getDefaultDetail(procName, "待定", "待定");
  }
}
```

#### 2.3 获取竞品数据
```javascript
// 替换原来的getCompetitors函数
async function getCompetitors(procName) {
  try {
    const response = await fetch(`${API_BASE_URL}/competitors/${encodeURIComponent(procName)}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch competitors:', error);
    return [];
  }
}
```

#### 2.4 搜索功能
```javascript
// 替换原来的搜索逻辑
async function searchItems(keyword) {
  try {
    const response = await fetch(`${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}`);
    const results = await response.json();
    // 转换为前端需要的格式
    const items = [];
    if (results.departments) {
      items.push(...results.departments.map(item => ({ type: item.type, name: item.name, matchKey: item.name.toLowerCase() })));
    }
    if (results.procedures) {
      items.push(...results.procedures.map(item => ({ type: item.type, name: item.name, matchKey: item.name.toLowerCase() })));
    }
    return items;
  } catch (error) {
    console.error('Failed to search:', error);
    // 使用本地搜索作为 fallback
    return getAllSearchItems().filter(item => item.matchKey.includes(keyword.toLowerCase()));
  }
}
```

### 3. 修改渲染函数
由于现在数据获取是异步的，需要修改渲染函数以支持异步操作。

#### 3.1 修改renderPCHome函数
```javascript
async function renderPCHome(deptId) {
  const departments = await getDepartments();
  const dept = departments.find(d => d.id === deptId);
  if (!dept) return;
  // 其余逻辑保持不变...
}
```

#### 3.2 修改renderDetailViewPC函数
```javascript
async function renderDetailViewPC(procName) {
  const data = await getDetail(procName);
  const competitors = await getCompetitors(procName);
  // 其余逻辑保持不变...
}
```

#### 3.3 修改搜索下拉逻辑
```javascript
async function updateDropdown() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) { dropdown.style.display = 'none'; return; }
  const matches = await searchItems(keyword);
  if (matches.length === 0) { dropdown.style.display = 'none'; return; }
  // 其余逻辑保持不变...
}
```

### 4. 修改初始化函数
```javascript
async function init() {
  const departments = await getDepartments();
  const navHtml = departments.map(d => `<li class="nav-item ${activeDeptId===d.id?'active':''}" data-dept-id="${d.id}">${d.name}</li>`).join('');
  deptNavList.innerHTML = navHtml;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', async () => {
      activeDeptId = el.dataset.deptId;
      const dept = departments.find(d => d.id === activeDeptId);
      activeOrgan = dept.organs.find(o=>o.procedures.length>0) || dept.organs[0];
      if(window.innerWidth > 767) await renderPCHome(activeDeptId);
      else { mobileLevel = 0; renderMobileHome(); }
      if(window.innerWidth<=767) sidebarEl.classList.remove('open');
    });
  });
  if(window.innerWidth > 767) await renderPCHome(activeDeptId);
  else renderMobileHome();
}
```

### 5. 修改移动端相关函数
同样需要修改移动端的渲染函数，使其支持异步数据获取。

## 测试步骤

1. 启动后端服务：`npm start`
2. 运行数据初始化：`npm run seed`
3. 打开前端页面，测试所有功能是否正常

## 注意事项

- 确保后端服务运行在端口3001
- 如果后端服务运行在不同端口，需要修改API_BASE_URL
- 为了提高用户体验，建议在数据加载过程中添加加载动画
- 实现错误处理，确保在API调用失败时仍能显示默认数据
