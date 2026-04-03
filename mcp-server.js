const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 确保正确的字符编码
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// 术式数据存储
const procedureData = {
    "全膝关节置换术": {
        name: "全膝关节置换术",
        dept: "骨科",
        organ: "膝关节",
        indications: "1. 重度骨关节炎；2. 类风湿关节炎晚期；3. 创伤性关节炎；4. 膝关节畸形。",
        contraindications: "1. 活动性感染；2. 伸膝装置功能丧失；3. 严重骨质疏松；4. 神经源性关节病。",
        guidelineDiff: "1. 传统手术：依赖医生经验，截骨精度受人为因素影响；2. 机器人辅助手术：通过3D规划和实时导航，提高截骨精度和力线重建准确性。",
        clinicalMetrics: [
            { name: '下肢力线偏差', value: '≤3°', desc: '髋-膝-踝角与术前规划偏差' },
            { name: '截骨深度偏差', value: '≤1mm', desc: '股骨远端/胫骨近端截骨厚度与计划偏差' },
            { name: '5年假体生存率', value: '≥95%', desc: '翻修率≤5%' },
            { name: '术后疼痛评分', value: '2-3分', desc: 'VAS评分，满分10分' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '90-120分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '3-6个月', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '切口' },
            { timestamp: '900', name: '暴露膝关节' },
            { timestamp: '1200', name: '股骨远端截骨' },
            { timestamp: '1800', name: '胫骨近端截骨' },
            { timestamp: '2400', name: '试模' },
            { timestamp: '3000', name: '假体植入' },
            { timestamp: '3600', name: '缝合' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "全髋关节置换术": {
        name: "全髋关节置换术",
        dept: "骨科",
        organ: "髋关节",
        indications: "1. 重度髋关节骨关节炎；2. 股骨头缺血性坏死；3. 髋关节发育不良；4. 类风湿关节炎；5. 创伤性关节炎。",
        contraindications: "1. 活动性感染；2. 严重骨质疏松；3. 神经源性关节病；4. 严重心肺功能不全。",
        guidelineDiff: "1. 传统手术：依赖医生经验，髋臼假体位置和角度受人为因素影响；2. 机器人辅助手术：通过3D规划和实时导航，提高髋臼假体放置精度和下肢长度恢复准确性。",
        clinicalMetrics: [
            { name: '髋臼假体位置', value: '±5°', desc: '外展角和前倾角与术前规划偏差' },
            { name: '下肢长度差异', value: '≤5mm', desc: '术后双侧下肢长度差异' },
            { name: '5年假体生存率', value: '≥95%', desc: '翻修率≤5%' },
            { name: '术后疼痛评分', value: '2-3分', desc: 'VAS评分，满分10分' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '90-120分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '300-500ml', desc: '估计失血量' },
            { name: '住院时间', value: '3-7天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '3-6个月', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '切口' },
            { timestamp: '900', name: '暴露髋关节' },
            { timestamp: '1200', name: '股骨颈截骨' },
            { timestamp: '1800', name: '髋臼准备' },
            { timestamp: '2400', name: '股骨准备' },
            { timestamp: '3000', name: '假体植入' },
            { timestamp: '3600', name: '缝合' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "腹腔镜胆囊切除术": {
        name: "腹腔镜胆囊切除术",
        dept: "普外科",
        organ: "胆囊",
        indications: "1. 症状性胆囊结石；2. 胆囊息肉≥10mm；3. 胆囊炎反复发作；4. 胆囊腺肌症。",
        contraindications: "1. 严重凝血功能障碍；2. 急性化脓性胆囊炎穿孔；3. 腹腔广泛粘连；4. 严重心肺功能不全。",
        guidelineDiff: "1. 传统开腹手术：适用于复杂胆囊病变，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快，已成为金标准；3. 机器人辅助手术：操作更精准，尤其适用于复杂病例。",
        clinicalMetrics: [
            { name: '手术成功率', value: '99%', desc: '成功切除胆囊' },
            { name: '并发症率', value: '1-3%', desc: '包括胆漏、出血等' },
            { name: '住院时间', value: '1-3天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '1-2周', desc: '完全恢复正常活动' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '30-60分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '5-50ml', desc: '估计失血量' },
            { name: '切口数量', value: '3-4个', desc: '每个切口0.5-1.5cm' },
            { name: '中转开腹率', value: '1-2%', desc: '因解剖困难或并发症' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '建立气腹' },
            { timestamp: '600', name: '穿刺置管' },
            { timestamp: '900', name: '探查腹腔' },
            { timestamp: '1200', name: '解剖胆囊三角' },
            { timestamp: '1800', name: '离断胆囊管和动脉' },
            { timestamp: '2400', name: '剥离胆囊' },
            { timestamp: '3000', name: '取出胆囊' },
            { timestamp: '3300', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "脊柱融合术": {
        name: "脊柱融合术",
        dept: "骨科",
        organ: "脊柱",
        indications: "1. 腰椎间盘突出症；2. 腰椎滑脱；3. 脊柱侧弯；4. 脊柱骨折；5. 脊柱肿瘤。",
        contraindications: "1. 严重骨质疏松；2. 活动性感染；3. 严重心肺功能不全；4. 凝血功能障碍。",
        guidelineDiff: "1. 传统开放手术：视野清晰，适用于复杂病变；2. 微创手术：创伤小，恢复快；3. 机器人辅助手术：提高置钉精度，减少辐射暴露。",
        clinicalMetrics: [
            { name: '置钉准确率', value: '98-99%', desc: '螺钉位置优良率' },
            { name: '融合率', value: '90-95%', desc: '术后1年融合成功率' },
            { name: '并发症率', value: '5-10%', desc: '包括感染、神经损伤等' },
            { name: '住院时间', value: '5-7天', desc: '术后平均住院时间' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '120-240分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '200-500ml', desc: '估计失血量' },
            { name: '辐射暴露', value: '减少70%', desc: '机器人辅助相比传统透视' },
            { name: '恢复时间', value: '3-6个月', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '切口' },
            { timestamp: '900', name: '暴露脊柱' },
            { timestamp: '1200', name: '椎弓根置钉' },
            { timestamp: '1800', name: '椎体间融合' },
            { timestamp: '2400', name: '安装内固定' },
            { timestamp: '3000', name: '缝合' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "前列腺癌根治术": {
        name: "前列腺癌根治术",
        dept: "泌尿外科",
        organ: "前列腺",
        indications: "1. 局限性前列腺癌；2. 预期寿命>10年；3. 无远处转移；4. 身体状况能耐受手术。",
        contraindications: "1. 远处转移；2. 严重心肺功能不全；3. 凝血功能障碍；4. 晚期前列腺癌。",
        guidelineDiff: "1. 传统开放手术：手术视野清晰，适用于复杂病例；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尿控和性功能保留率更高。",
        clinicalMetrics: [
            { name: '切缘阳性率', value: '5-10%', desc: '手术切缘肿瘤残留率' },
            { name: '尿失禁率', value: '5-15%', desc: '术后1年尿失禁发生率' },
            { name: '勃起功能障碍率', value: '20-30%', desc: '术后1年勃起功能障碍发生率' },
            { name: '5年生存率', value: '85-95%', desc: '局限性前列腺癌术后生存率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '120-180分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '住院时间', value: '1-3天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '游离前列腺' },
            { timestamp: '1800', name: '离断输精管和精囊' },
            { timestamp: '2400', name: '切除前列腺' },
            { timestamp: '3000', name: '膀胱尿道吻合' },
            { timestamp: '3600', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "肺叶切除术": {
        name: "肺叶切除术",
        dept: "胸外科",
        organ: "肺部",
        indications: "1. 早期肺癌；2. 肺部良性肿瘤；3. 肺脓肿；4. 支气管扩张。",
        contraindications: "1. 严重心肺功能不全；2. 远处转移；3. 凝血功能障碍；4. 全身状况差。",
        guidelineDiff: "1. 传统开胸手术：适用于复杂肺部病变，手术视野清晰；2. 胸腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于复杂病例。",
        clinicalMetrics: [
            { name: '手术成功率', value: '95-99%', desc: '成功切除病变肺叶' },
            { name: '并发症率', value: '10-15%', desc: '包括肺炎、肺不张等' },
            { name: '住院时间', value: '5-7天', desc: '术后平均住院时间' },
            { name: '5年生存率', value: '60-80%', desc: '早期肺癌术后生存率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '120-180分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '切口数量', value: '3-4个', desc: '每个切口0.5-2cm' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '探查胸腔' },
            { timestamp: '1800', name: '游离肺叶' },
            { timestamp: '2400', name: '离断肺动脉、肺静脉' },
            { timestamp: '3000', name: '离断支气管' },
            { timestamp: '3600', name: '切除肺叶' },
            { timestamp: '4200', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "子宫切除术": {
        name: "子宫切除术",
        dept: "妇产科",
        organ: "子宫",
        indications: "1. 子宫肌瘤；2. 子宫内膜癌；3. 子宫脱垂；4. 异常子宫出血。",
        contraindications: "1. 严重凝血功能障碍；2. 急性感染；3. 严重心肺功能不全；4. 全身状况差。",
        guidelineDiff: "1. 传统开腹手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于复杂病例。",
        clinicalMetrics: [
            { name: '手术成功率', value: '99%', desc: '成功切除子宫' },
            { name: '并发症率', value: '5-10%', desc: '包括感染、出血等' },
            { name: '住院时间', value: '2-4天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '90-150分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '切口数量', value: '3-4个', desc: '每个切口0.5-1.5cm' },
            { name: '中转开腹率', value: '1-2%', desc: '因解剖困难或并发症' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '探查盆腔' },
            { timestamp: '1800', name: '游离子宫' },
            { timestamp: '2400', name: '离断子宫血管' },
            { timestamp: '3000', name: '切除子宫' },
            { timestamp: '3600', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "冠状动脉搭桥术": {
        name: "冠状动脉搭桥术",
        dept: "心脏外科",
        organ: "冠状动脉",
        indications: "1. 多支血管病变；2. 左主干病变；3. 糖尿病患者；4. 药物治疗无效的心绞痛。",
        contraindications: "1. 严重心功能不全；2. 全身情况差；3. 凝血功能障碍；4. 严重肝肾功能不全。",
        guidelineDiff: "1. 传统体外循环搭桥：适用于大多数病例，手术视野清晰；2. 非体外循环搭桥：创伤小，恢复快；3. 机器人辅助搭桥：创伤更小，恢复更快，尤其适用于前降支病变。",
        clinicalMetrics: [
            { name: '手术成功率', value: '95-98%', desc: '成功完成搭桥' },
            { name: '死亡率', value: '1-3%', desc: '手术死亡率' },
            { name: '并发症率', value: '10-15%', desc: '包括感染、出血等' },
            { name: '5年通畅率', value: '80-85%', desc: '桥血管5年通畅率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '240-360分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '300-500ml', desc: '估计失血量' },
            { name: '住院时间', value: '7-10天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '6-12周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '游离桥血管' },
            { timestamp: '1200', name: '建立体外循环' },
            { timestamp: '1800', name: '心脏停跳' },
            { timestamp: '2400', name: '吻合桥血管' },
            { timestamp: '3000', name: '心脏复跳' },
            { timestamp: '3600', name: '脱离体外循环' },
            { timestamp: '4200', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "腹主动脉瘤切除术": {
        name: "腹主动脉瘤切除术",
        dept: "血管外科",
        organ: "腹主动脉",
        indications: "1. 腹主动脉瘤直径≥5.5cm；2. 瘤体增长速度≥0.5cm/年；3. 瘤体破裂或有破裂风险；4. 瘤体引起症状。",
        contraindications: "1. 严重心肺功能不全；2. 凝血功能障碍；3. 全身情况差；4. 无法耐受手术。",
        guidelineDiff: "1. 传统开放手术：适用于复杂动脉瘤，手术视野清晰；2. 腔内修复术：创伤小，恢复快，已成为首选；3. 机器人辅助手术：操作更精准，尤其适用于复杂解剖病例。",
        clinicalMetrics: [
            { name: '手术成功率', value: '90-95%', desc: '成功修复动脉瘤' },
            { name: '死亡率', value: '2-5%', desc: '手术死亡率' },
            { name: '并发症率', value: '10-15%', desc: '包括感染、出血等' },
            { name: '5年生存率', value: '70-80%', desc: '术后5年生存率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '180-240分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '200-500ml', desc: '估计失血量' },
            { name: '住院时间', value: '5-7天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '切口' },
            { timestamp: '900', name: '暴露腹主动脉' },
            { timestamp: '1200', name: '阻断主动脉' },
            { timestamp: '1800', name: '切除动脉瘤' },
            { timestamp: '2400', name: '植入人工血管' },
            { timestamp: '3000', name: '吻合血管' },
            { timestamp: '3600', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "胃癌根治术": {
        name: "胃癌根治术",
        dept: "普外科",
        organ: "胃",
        indications: "1. 早期胃癌；2. 进展期胃癌；3. 无远处转移；4. 身体状况能耐受手术。",
        contraindications: "1. 远处转移；2. 严重心肺功能不全；3. 凝血功能障碍；4. 全身状况差。",
        guidelineDiff: "1. 传统开放手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，淋巴结清扫更彻底。",
        clinicalMetrics: [
            { name: '手术切除率', value: '90-95%', desc: 'R0切除率' },
            { name: '淋巴结清扫数量', value: '≥15枚', desc: '平均清扫淋巴结数' },
            { name: '并发症率', value: '15-20%', desc: '包括吻合口瘘、感染等' },
            { name: '5年生存率', value: '40-60%', desc: '进展期胃癌术后生存率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '180-240分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '住院时间', value: '7-10天', desc: '术后平均住院时间' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '探查腹腔' },
            { timestamp: '1800', name: '游离胃' },
            { timestamp: '2400', name: '清扫淋巴结' },
            { timestamp: '3000', name: '切除胃' },
            { timestamp: '3600', name: '胃肠吻合' },
            { timestamp: '4200', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "肾部分切除术": {
        name: "肾部分切除术",
        dept: "泌尿外科",
        organ: "肾脏",
        indications: "1. 肾肿瘤直径≤4cm；2. 肿瘤位于肾表面；3. 孤立肾肿瘤；4. 双侧肾肿瘤。",
        contraindications: "1. 肿瘤侵犯肾盂；2. 肿瘤侵犯肾静脉；3. 凝血功能障碍；4. 严重心肺功能不全。",
        guidelineDiff: "1. 传统开放手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，肾功能保留率更高。",
        clinicalMetrics: [
            { name: '肿瘤切除率', value: '95-99%', desc: 'R0切除率' },
            { name: '肾功能保留率', value: '≥80%', desc: '术后肾功能保留' },
            { name: '并发症率', value: '10-15%', desc: '包括出血、尿漏等' },
            { name: '复发率', value: '5-10%', desc: '术后肿瘤复发率' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '90-150分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-200ml', desc: '估计失血量' },
            { name: '热缺血时间', value: '20-30分钟', desc: '肾脏缺血时间' },
            { name: '住院时间', value: '3-5天', desc: '术后平均住院时间' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '暴露肾脏' },
            { timestamp: '1800', name: '阻断肾动脉' },
            { timestamp: '2400', name: '切除肿瘤' },
            { timestamp: '3000', name: '缝合肾脏' },
            { timestamp: '3600', name: '恢复肾动脉血流' },
            { timestamp: '4200', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "巨结肠根治术": {
        name: "巨结肠根治术",
        dept: "小儿外科",
        organ: "结肠",
        indications: "1. 先天性巨结肠；2. 肠神经元发育不良；3. 巨结肠类缘病；4. 保守治疗无效的便秘。",
        contraindications: "1. 严重营养不良；2. 感染性肠炎；3. 凝血功能障碍；4. 全身状况差。",
        guidelineDiff: "1. 传统开放手术：适用于复杂病例，手术视野清晰；2. 腹腔镜手术：创伤小，恢复快；3. 机器人辅助手术：操作更精准，尤其适用于小儿患者。",
        clinicalMetrics: [
            { name: '手术成功率', value: '90-95%', desc: '成功切除病变肠段' },
            { name: '并发症率', value: '15-20%', desc: '包括吻合口瘘、感染等' },
            { name: '排便功能恢复', value: '80-90%', desc: '术后正常排便功能' },
            { name: '住院时间', value: '7-10天', desc: '术后平均住院时间' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '180-240分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '50-100ml', desc: '估计失血量' },
            { name: '切口数量', value: '3-4个', desc: '每个切口0.5-1cm' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '建立气腹' },
            { timestamp: '900', name: '穿刺置管' },
            { timestamp: '1200', name: '探查腹腔' },
            { timestamp: '1800', name: '游离结肠' },
            { timestamp: '2400', name: '切除病变肠段' },
            { timestamp: '3000', name: '肠吻合' },
            { timestamp: '3600', name: '关闭切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "乳房重建术": {
        name: "乳房重建术",
        dept: "整形外科",
        organ: "乳房",
        indications: "1. 乳腺癌术后乳房缺失；2. 先天性乳房发育不良；3. 乳房不对称；4. 乳房外伤性缺损。",
        contraindications: "1. 活动性感染；2. 全身状况差；3. 凝血功能障碍；4. 乳腺癌复发风险高。",
        guidelineDiff: "1. 假体植入：手术时间短，恢复快；2. 自体组织重建：效果更自然，无需假体；3. 机器人辅助重建：操作更精准，美学效果更好。",
        clinicalMetrics: [
            { name: '手术成功率', value: '90-95%', desc: '成功重建乳房' },
            { name: '并发症率', value: '15-20%', desc: '包括感染、皮瓣坏死等' },
            { name: '患者满意度', value: '85-90%', desc: '术后乳房外观满意度' },
            { name: '住院时间', value: '3-5天', desc: '术后平均住院时间' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '240-360分钟', desc: '从切皮到缝合' },
            { name: '出血量', value: '100-300ml', desc: '估计失血量' },
            { name: '恢复时间', value: '4-6周', desc: '完全恢复正常活动' },
            { name: '假体生存率', value: '80-85%', desc: '10年假体生存率' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '消毒铺巾' },
            { timestamp: '600', name: '切口设计' },
            { timestamp: '900', name: '游离皮瓣' },
            { timestamp: '1800', name: '制备乳房假体' },
            { timestamp: '2400', name: '植入假体' },
            { timestamp: '3000', name: '塑形' },
            { timestamp: '3600', name: '缝合切口' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    },
    "颅内肿瘤切除术": {
        name: "颅内肿瘤切除术",
        dept: "神经外科",
        organ: "大脑",
        indications: "1. 颅内良性肿瘤，如脑膜瘤、垂体瘤等；2. 颅内恶性肿瘤，如胶质瘤、转移瘤等；3. 肿瘤引起的颅内高压症状；4. 肿瘤位于可手术切除的部位。",
        contraindications: "1. 严重心、肺、肝、肾功能不全，无法耐受手术；2. 肿瘤位于重要功能区，手术风险极高；3. 凝血功能障碍；4. 全身状况差，无法承受手术打击。",
        guidelineDiff: "1. 传统开颅手术：适用于大多数颅内肿瘤，尤其是体积较大、位置较深的肿瘤；2. 微创手术：适用于体积较小、位置表浅的肿瘤，具有创伤小、恢复快的优势；3. 机器人辅助手术：适用于精准定位要求高的肿瘤，如垂体瘤、颅底肿瘤等。",
        clinicalMetrics: [
            { name: '手术死亡率', value: '1-2%', desc: '根据肿瘤类型和位置有所不同' },
            { name: '术后并发症率', value: '10-15%', desc: '包括出血、感染、神经功能障碍等' },
            { name: '肿瘤全切率', value: '70-90%', desc: '取决于肿瘤类型、位置和大小' },
            { name: '平均住院时间', value: '7-14天', desc: '根据手术复杂程度和患者恢复情况' }
        ],
        operationMetrics: [
            { name: '手术时间', value: '3-8小时', desc: '取决于肿瘤大小和位置' },
            { name: '出血量', value: '200-800ml', desc: '根据手术难度和肿瘤血供情况' },
            { name: '麻醉时间', value: '4-10小时', desc: '包括术前准备和术后苏醒' },
            { name: '术后ICU停留时间', value: '1-3天', desc: '根据患者术后状态' }
        ],
        steps: [
            { timestamp: '0', name: '患者麻醉' },
            { timestamp: '300', name: '头部消毒铺巾' },
            { timestamp: '600', name: '切开头皮' },
            { timestamp: '900', name: '颅骨钻孔' },
            { timestamp: '1200', name: '打开硬脑膜' },
            { timestamp: '1500', name: '暴露肿瘤' },
            { timestamp: '2400', name: '切除肿瘤' },
            { timestamp: '3000', name: '止血' },
            { timestamp: '3300', name: '关闭硬脑膜' },
            { timestamp: '3600', name: '颅骨复位' },
            { timestamp: '3900', name: '缝合头皮' }
        ],
        traditionalVideo: 'BV1LTyaYeEas',
        roboticVideo: 'BV1LTyaYeEas'
    }
};

// MCP工具定义
const mcpTools = {
    "get_procedure_data": {
        name: "get_procedure_data",
        description: "获取指定术式的详细数据",
        inputSchema: {
            type: "object",
            properties: {
                procedureName: {
                    type: "string",
                    description: "术式名称"
                }
            },
            required: ["procedureName"]
        }
    },
    "list_procedures": {
        name: "list_procedures",
        description: "获取所有可用的术式列表",
        inputSchema: {
            type: "object",
            properties: {}
        }
    }
};

// MCP API端点
app.get('/mcp/tools', (req, res) => {
    res.json({
        tools: Object.values(mcpTools)
    });
});

app.post('/mcp/tools/get_procedure_data', (req, res) => {
    const { procedureName } = req.body;
    
    if (!procedureName) {
        return res.status(400).json({
            error: "术式名称不能为空"
        });
    }
    
    const data = procedureData[procedureName];
    
    if (data) {
        res.json({
            success: true,
            data: data
        });
    } else {
        res.status(404).json({
            success: false,
            error: "未找到该术式的数据"
        });
    }
});

app.post('/mcp/tools/list_procedures', (req, res) => {
    res.json({
        success: true,
        data: {
            procedures: Object.keys(procedureData)
        }
    });
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`MCP服务器运行在 http://localhost:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`工具列表: http://localhost:${PORT}/mcp/tools`);
});