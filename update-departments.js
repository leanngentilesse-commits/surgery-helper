const mongoose = require('mongoose');

// 连接到MongoDB数据库
mongoose.connect('mongodb://localhost:27017/robot-surgery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 定义Department模型
const Department = mongoose.model('Department', new mongoose.Schema({
  id: String,
  name: String,
  organs: Array
}));

// 要保留的科室
const departmentsToKeep = [
  {
    id: "general",
    name: "普外科",
    organs: [
      { name: "肝胆", order: 1, procedures: ["腹腔镜胆囊切除术"] },
      { name: "胃肠", order: 2, procedures: ["胃癌根治术"] }
    ]
  },
  {
    id: "ortho",
    name: "骨科",
    organs: [
      { name: "膝关节", order: 1, procedures: ["全膝关节置换术"] },
      { name: "脊柱", order: 2, procedures: ["脊柱融合术"] }
    ]
  },
  {
    id: "urology",
    name: "泌尿外科",
    organs: [
      { name: "前列腺", order: 1, procedures: ["前列腺癌根治术"] },
      { name: "肾脏", order: 2, procedures: ["肾部分切除术"] }
    ]
  },
  {
    id: "gyn",
    name: "妇产科",
    organs: [
      { name: "子宫", order: 1, procedures: ["子宫切除术"] }
    ]
  },
  {
    id: "neurosurgery",
    name: "神经外科",
    organs: [
      { name: "颅内肿瘤", order: 1, procedures: ["颅内肿瘤切除术"] }
    ]
  },
  {
    id: "thoracic",
    name: "胸外科",
    organs: [
      { name: "肺部", order: 1, procedures: ["肺叶切除术"] }
    ]
  },
  {
    id: "cardiac",
    name: "心脏外科",
    organs: [
      { name: "冠脉", order: 1, procedures: ["冠状动脉搭桥术"] }
    ]
  },
  {
    id: "vascular",
    name: "血管外科",
    organs: [
      { name: "主动脉", order: 1, procedures: ["腹主动脉瘤切除术"] }
    ]
  },
  {
    id: "dental",
    name: "口腔科",
    organs: [
      { name: "口腔", order: 1, procedures: ["口腔种植手术", "根管治疗术"] }
    ]
  }
];

// 要删除的科室ID
const departmentsToDelete = ["pediatric", "plastic"];

// 更新科室信息
async function updateDepartments() {
  try {
    console.log("开始更新科室信息...");

    // 删除要删除的科室
    for (const deptId of departmentsToDelete) {
      const result = await Department.deleteOne({ id: deptId });
      if (result.deletedCount > 0) {
        console.log(`已删除科室: ${deptId}`);
      } else {
        console.log(`科室 ${deptId} 不存在，跳过`);
      }
    }

    // 添加或更新要保留的科室
    for (const dept of departmentsToKeep) {
      const existingDept = await Department.findOne({ id: dept.id });
      if (existingDept) {
        // 更新现有科室
        existingDept.name = dept.name;
        existingDept.organs = dept.organs;
        await existingDept.save();
        console.log(`已更新科室: ${dept.name}`);
      } else {
        // 添加新科室
        const newDept = new Department(dept);
        await newDept.save();
        console.log(`已添加科室: ${dept.name}`);
      }
    }

    // 验证更新结果
    const allDepartments = await Department.find();
    console.log("\n更新后的科室列表:");
    allDepartments.forEach(dept => {
      console.log(`- ${dept.name} (${dept.id})`);
      dept.organs.forEach(organ => {
        console.log(`  - ${organ.name}: ${organ.procedures.join(', ')}`);
      });
    });

    console.log("\n科室信息更新完成！");
    mongoose.disconnect();
  } catch (error) {
    console.error("科室信息更新失败:", error);
    mongoose.disconnect();
  }
}

// 执行更新
updateDepartments();
