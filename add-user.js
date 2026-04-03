const mongoose = require('mongoose');

// 连接到MongoDB数据库
mongoose.connect('mongodb://localhost:27017/robot-surgery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 定义User模型
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  role: String
}));

// 添加普通用户
async function addUser() {
  try {
    // 检查用户是否已存在
    const existingUser = await User.findOne({ username: 'user' });
    if (existingUser) {
      console.log('用户已存在，跳过');
      mongoose.disconnect();
      return;
    }

    // 创建新用户
    const newUser = new User({
      username: 'user',
      password: 'user123', // 实际应用中应该使用加密的密码
      role: 'user' // 普通用户角色，没有更新数据权限
    });

    // 保存用户
    await newUser.save();
    console.log('已添加普通用户:');
    console.log(`用户名: ${newUser.username}`);
    console.log(`密码: ${newUser.password}`);
    console.log(`角色: ${newUser.role}`);

    mongoose.disconnect();
  } catch (error) {
    console.error('添加用户失败:', error);
    mongoose.disconnect();
  }
}

// 执行添加用户
addUser();
