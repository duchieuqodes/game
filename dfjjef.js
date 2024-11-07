const express = require('express');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb+srv://duchieufaryoung0:80E9gUahdOXmGKuy@cluster0.6nlv1cv.mongodb.net/telegram_bot_db?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

const bot = new TelegramBot('7753869579:AAHzngwsjPkK_q5W4g3vGVMSb4HwEbtxChY', {
  polling: true,
  request: {
    prefer_authorize: 'never',
    preferred_language: 'vi',
  },
});
// Cấu hình các schema trong MongoDB
const taskSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  completedTasks: [{ taskId: String, completedAt: Date }],
  dailyTasks: [{ taskId: String, lastCompletedAt: Date }],
  lastDailyReset: { type: Date, default: Date.now }
});

const taskTemplateSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['one_time', 'daily', 'join_group', 'join_channel', 'watch_video', 'interact'], required: true },
  title: { type: String, required: true },
  description: String,
  link: String,
  rewards: { vndc: { type: Number, default: 0 }, gold: { type: Number, default: 0 }, spins: { type: Number, default: 0 }},
  isActive: { type: Boolean, default: true },
  createdBy: Number,
  expiresAt: Date
});

const clickSchema = new mongoose.Schema({
  userId: Number,
  taskId: String,
  clickedAt: Date
});

const Task = mongoose.model('Task', taskSchema);
const TaskTemplate = mongoose.model('TaskTemplate', taskTemplateSchema);
const Click = mongoose.model('Click', clickSchema);

// Định nghĩa URL trung gian để xử lý click và chuyển hướng
app.get('/intermediary', async (req, res) => {
  const { userId, taskId, videoUrl } = req.query;
  await Click.create({ userId, taskId, clickedAt: new Date() });
  res.redirect(videoUrl);
});

// Tạo URL trung gian để theo dõi click
function createIntermediaryUrl(taskId, userId, videoUrl) {
  return `http://localhost:${PORT}/intermediary?taskId=${taskId}&userId=${userId}&videoUrl=${encodeURIComponent(videoUrl)}`;
}

// Hàm tạo nút xem video và kiểm tra nhiệm vụ
function createWatchVideoButton(taskId) {
  return { text: '🎥 Xem Video', callback_data: `watch_video_${taskId}` };
}

function createCheckButton(taskId) {
  return { text: '🔍 Kiểm tra', callback_data: `check_${taskId}` };
}

// Hàm kiểm tra nhiệm vụ hoàn thành
async function checkTaskCompletion(taskId, userId, chatId) {
  const clickRecord = await Click.findOne({ userId, taskId });
  const message = clickRecord
    ? "✅ Bạn đã hoàn thành nhiệm vụ xem video!"
    : "❌ Bạn chưa nhấp vào liên kết xem video!";
  await bot.sendMessage(chatId, message);
}

// Hàm lên lịch reset nhiệm vụ hàng ngày
async function resetDailyTasks() {
  const users = await Task.find({});
  for (const user of users) {
    user.dailyTasks = [];
    user.lastDailyReset = new Date();
    await user.save();
  }
}

// Lên lịch reset nhiệm vụ hàng ngày vào lúc nửa đêm
schedule.scheduleJob('0 0 * * *', resetDailyTasks);

// Xử lý callback khi người dùng nhấn nút "Xem Video" hoặc "Kiểm tra"
bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const chatId = callbackQuery.message.chat.id;

  if (action.startsWith('watch_video_')) {
    const taskId = action.replace('watch_video_', '');
    const taskTemplate = await TaskTemplate.findOne({ taskId });
    if (taskTemplate) {
      const videoUrl = taskTemplate.link;
      const intermediaryUrl = createIntermediaryUrl(taskId, userId, videoUrl);
      await bot.sendMessage(chatId, `🔗 Bạn sẽ được chuyển đến video qua một liên kết trung gian: ${intermediaryUrl}`);
    } else {
      await bot.sendMessage(chatId, "❌ Nhiệm vụ không tồn tại!");
    }
  } else if (action.startsWith('check_')) {
    const taskId = action.replace('check_', '');
    await checkTaskCompletion(taskId, userId, chatId);
  }
});

// Xử lý lệnh tạo nhiệm vụ
bot.onText(/\/themnhiemvu/, async (msg) => {
  const chatId = msg.chat.id;

  // Ví dụ: tạo một nhiệm vụ xem video
  const newTask = new TaskTemplate({
    taskId: `task_${Date.now()}`,
    type: 'watch_video',
    title: 'Xem video',
    description: 'Xem video yêu cầu để nhận thưởng',
    link: 'https://youtu.be/PT2_F-1esPk?si=F6EmADzD_kTDHEwY', // Thay thế bằng link thật
    rewards: { vndc: 100, gold: 50, spins: 1 },
    createdBy: msg.from.id
  });

  await newTask.save();
  await bot.sendMessage(chatId, "✅ Đã tạo nhiệm vụ thành công!");
});

// Hiển thị danh sách nhiệm vụ với các nút "Xem Video" và "Kiểm tra"
async function showTasks(chatId, userId) {
  const tasks = await TaskTemplate.find({ isActive: true });

  let message = "🎯 *DANH SÁCH NHIỆM VỤ*\n━━━━━━━━━━━━━━━━━━━━\n\n";
  let keyboard = [];

  tasks.forEach((task) => {
    message += `🎥 ${task.title}\n${task.description}\nPhần thưởng: ${task.rewards.vndc} VNDC, ${task.rewards.gold} vàng, ${task.rewards.spins} lượt quay\n\n`;

    keyboard.push([
      { text: '🎥 Xem Video', callback_data: `watch_video_${task.taskId}` },
      { text: '🔍 Kiểm tra', callback_data: `check_${task.taskId}` }
    ]);
  });

  await bot.sendMessage(chatId, message, {
    reply_markup: { inline_keyboard: keyboard }
  });
}

// Xử lý lệnh hiển thị nhiệm vụ
bot.onText(/\/tasks/, async (msg) => {
  const chatId = msg.chat.id;
  await showTasks(chatId, msg.from.id);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
console.log('Bot is running...');
