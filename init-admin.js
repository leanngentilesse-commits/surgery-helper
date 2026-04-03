// 初始化数据库，添加admin账户
const mongoose = require('mongoose');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/surgical-robot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
  
  // 创建用户模型
  const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String
  }));
  
  // 检查admin账户是否已存在
  User.findOne({ username: 'admin' }).then(existingUser => {
    if (existingUser) {
      console.log('Admin account already exists');
      mongoose.disconnect();
    } else {
      // 创建admin账户
      const adminUser = new User({
        username: 'admin',
        password: '123456'
      });
      
      adminUser.save().then(() => {
        console.log('Admin account created successfully');
        mongoose.disconnect();
      }).catch(err => {
        console.error('Error creating admin account:', err);
        mongoose.disconnect();
      });
    }
  }).catch(err => {
    console.error('Error checking admin account:', err);
    mongoose.disconnect();
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
});