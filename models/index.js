const mongoose = require('mongoose');

// 科室模型
const DepartmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  organs: [{
    name: String,
    order: Number,
    procedures: [String]
  }]
});

// 术式详情模型
const ProcedureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  dept: String,
  organ: String,
  indications: String,
  contraindications: String,
  guidelines: [{
    name: String,
    status: String
  }],
  clinicalMetrics: [{
    name: String,
    value: String,
    desc: String
  }],
  operationMetrics: [{
    name: String,
    value: String,
    desc: String
  }],
  guidelineDiff: String,
  steps: [{
    name: String,
    timestamp: Number
  }],
  traditionalVideo: String,
  roboticVideo: String
});

// 竞品模型
const CompetitorSchema = new mongoose.Schema({
  procedureName: {
    type: String,
    required: true
  },
  brand: String,
  model: String,
  params: String,
  priceAvg: String,
  installs: String,
  advantage: String,
  source: String
});

const Department = mongoose.model('Department', DepartmentSchema);
const Procedure = mongoose.model('Procedure', ProcedureSchema);
const Competitor = mongoose.model('Competitor', CompetitorSchema);

module.exports = {
  Department,
  Procedure,
  Competitor
};
