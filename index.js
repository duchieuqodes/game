const TelegramBot = require('node-telegram-bot-api');
const keep_alive = require('./keep_alive.js');
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://duchieufaryoung0:80E9gUahdOXmGKuy@cluster0.6nlv1cv.mongodb.net/telegram_bot_db?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });

  const accountSchema = new mongoose.Schema({

    userId: { type: Number, required: true, unique: true },
      username: String,
      gold: { type: Number, default: 0 },
      specialGemCount: { type: Number, default: 0 },
      spinCount: { type: Number, default: 0 },
      robberyCount: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      exp: { type: Number, default: 0 },
      islandImage: { type: String, default: 'default-island-image-url' },
      lastSpecialSpinTime: { type: Date, default: null },
      lastRobberyTime: { type: Date, default: null },
      islandUpgradeCount: { type: Number, default: 0 },
      currentIslandImageUrl: { type: String, default: 'default-island-url' },
      giftBoxCount: { type: Number, default: 0 },
      currentGiftBoxMilestone: { type: Number, default: 0 },
      multiplier: { type: Number, default: 1 }, // Mức gấp thếp hiện tại
      lastSpinTime: { type: Date, default: null }, // Thời gian quay lần cuối
      lastRewardTime: { type: Date, default: null }, // Thời gian nhận lượt quay cuối
      spinMessageId: { type: Number, default: null }, // ID của tin nhắn quay thưởng
      isSpinning: { type: Boolean, default: false } // Biến theo dõi trạng thái quay
    });




const Account = mongoose.model('Account', accountSchema);



const bot = new TelegramBot('7753869579:AAHzngwsjPkK_q5W4g3vGVMSb4HwEbtxChY', {
  polling: true,
  request: {
    prefer_authorize: 'never',
    preferred_language: 'vi',
  },
});

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  let account = await Account.findOne({ userId });

  if (!account) {
    account = new Account({
      userId,
      username: msg.from.username,
      gold: 100000,
      specialGemCount: 0,
      spinCount: 10,
      robberyCount: 5,
      level: 1,
      exp: 0,
      islandImage: 'https://img.upanh.tv/2023/11/23/Cap0.jpg',
    });

    await account.save();
  }

  bot.sendMessage(msg.chat.id, `Chào mừng, ${msg.from.first_name}!`, {
    reply_markup: {
      keyboard: [
        [{ text: 'Đảo Của Bạn 🏝️' }], [{ text: 'Quay Thưởng 🎰' }, { text: 'Vòng Quay Đặc Biệt 🃏' }],
        [{ text: 'Nâng Cấp Hòn Đảo 🚀' }], [{ text: 'Đi Cướp Biển ☠️' }],
      ],
      resize_keyboard: true,
    },
  });
});

// Xử lý khi nhấn vào nút reply keyboard Quản lý người dùng
bot.onText(/Quản lý người dùng/, async (msg) => {
  const adminUsername = 'duchieu287'; // Replace with the actual admin username

  if (msg.from.username === adminUsername) {
    const totalAccounts = await Account.countDocuments();
    const totalSpecialGems = await Account.aggregate([{ $group: { _id: null, total: { $sum: "$specialGemCount" } } }]);

    const replyMessage = `
      Tổng số tài khoản hiện tại: ${totalAccounts}
      Tổng số Ngọc Biển Huyền Bí: ${totalSpecialGems.length > 0 ? totalSpecialGems[0].total : 0}
    `;

    bot.sendMessage(msg.chat.id, replyMessage);
  } else {
    bot.sendMessage(msg.chat.id, 'Bạn không có quyền truy cập vào quản lý người dùng.');
  }
});


bot.onText(/Đảo Của Bạn/, async (msg) => {
  const userId = msg.from.id;
  const account = await Account.findOne({ userId });

  if (account) {
    bot.sendPhoto(msg.chat.id, account.islandImage, {
      caption: `
        Thông tin đảo của bạn:
        Tặc danh: ${account.username} 🧑
        Số Vàng: ${account.gold} Vàng 🌕
        Ngọc Biển Huyền Bí: ${account.specialGemCount} Viên🔮
        Số lượt quay thưởng: ${account.spinCount} 🔄
        Số lượt cướp đảo: ${account.robberyCount} ☠️
        Level: ${account.level} 🎚️
        Exp: ${account.exp} 🌟
            `,
    });
  } else {
    bot.sendMessage(msg.chat.id, 'Tài khoản không tồn tại.');
  }
});


// Các mốc hộp quà
const giftBoxMilestones = [
  { max: 5, reward: { type: 'gold', min: 10000, max: 25000 } }, // Mốc 1
  { max: 14, reward: { type: 'spin', amount: 5 } },           // Mốc 2
  { max: 15, reward: { type: 'gold', min: 20000, max: 35000 } }, // Mốc 3
  { max: 20, reward: { type: 'spin', amount: 10 } },          // Mốc 4
  { max: 120, reward: { type: 'gold', min: 50000, max: 80000 } }, // Mốc 5
  { max: 750, reward: { type: 'spin', amount: 20 } },         // Mốc 6
  { max: 20000, reward: { type: 'gold', min: 100000, max: 150000 } } // Mốc 7
];

function calculateGiftBoxReward(account) {
  const milestone = giftBoxMilestones[account.currentGiftBoxMilestone];
  if (account.giftBoxCount >= milestone.max) {
    const reward = milestone.reward;
    account.giftBoxCount = 0; // Reset hộp quà
    account.currentGiftBoxMilestone = Math.min(account.currentGiftBoxMilestone + 1, giftBoxMilestones.length - 1); // Tăng mốc
    return reward;
  }
  return null;
}

function getRemainingTime() {
  const now = new Date();
  const minutes = Math.floor(now.getMinutes() / 30) * 30;
  const nextRewardTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes + 30);
  const timeDiff = Math.floor((nextRewardTime - now) / 1000);
  return timeDiff > 0 ? timeDiff : 0;
}

bot.onText(/Menu/, async (msg) => {
  const options = {
    reply_markup: {
      keyboard: [
        ['X1', 'X2', 'X3', 'X5'],
        ['X10', 'X50', 'X100', 'Quay Thưởng'],
        ['Quay Lại']
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
  bot.sendMessage(msg.chat.id, '🎰 Chọn mức nhân và quay thưởng:', options);
});

bot.onText(/Quay Thưởng/, async (msg) => {
  const userId = msg.from.id;
  let account = await Account.findOne({ userId });

  if (!account) {
    bot.sendMessage(msg.chat.id, '🚫 Tài khoản không tồn tại.');
    return;
  }

  // Kiểm tra xem người chơi có đang quay không
  if (account.isSpinning) {
    bot.sendMessage(msg.chat.id, '⏳ Bạn đang trong quá trình quay! Vui lòng chờ.');
    return;
  }

  const remainingSpin = account.spinCount;

  // Nếu không đủ lượt quay, thông báo và kết thúc
  if (remainingSpin <= 0) {
    bot.sendMessage(msg.chat.id, '🚫 Bạn đã hết lượt quay thưởng. Vào Vòng Quay Đặc Biệt để có thể nhận thêm lượt quay.');
    return;
  }

  account.lastSpinTime = new Date(); // Cập nhật thời gian quay gần nhất
  account.isSpinning = true; // Đặt trạng thái quay thành true
  await account.save();

  const spinImage = 'https://img.upanh.tv/2023/11/25/Spin2.gif';
  const caption = `Đang quay thưởng... 🎉\nThời gian hồi phục lượt quay: ${Math.floor(getRemainingTime() / 60)} phút\nMốc hộp quà hiện tại: ${account.giftBoxCount}/${giftBoxMilestones[account.currentGiftBoxMilestone].max}\nMức gấp thếp: x${account.multiplier}\nLượt quay còn lại: ${remainingSpin} 🎫`;

  const spinMessage = await bot.sendDocument(msg.chat.id, spinImage, { caption });
  account.spinMessageId = spinMessage.message_id; // Lưu ID tin nhắn quay thưởng
  await account.save(); // Lưu tài khoản với ID mới

  // Trừ số lượt quay thưởng dựa trên mức gấp thếp
  account.spinCount -= account.multiplier; 
  await account.save();

  setTimeout(async () => {
    const items = ['🏅 Vàng', '🏆 Hũ vàng', '🎁 Hộp quà', '🎫 Lượt quay thưởng', '🏴‍☠️ Lượt cướp đảo'];
    const spinResults = [
      items[Math.floor(Math.random() * items.length)],
      items[Math.floor(Math.random() * items.length)],
      items[Math.floor(Math.random() * items.length)]
    ];

    let rewardMessage = `🎊 Kết quả quay: ${spinResults.join(', ')}`;
    let totalReward = { gold: 0, spinCount: 0, robberyCount: 0, giftBox: 0 };

    const uniqueItems = [...new Set(spinResults)];
    const counts = spinResults.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    // Tính phần thưởng theo các trường hợp
    if (uniqueItems.length === 3) {
      if (counts['🏅 Vàng']) totalReward.gold += 8000 * account.multiplier;
      if (counts['🏆 Hũ vàng']) totalReward.gold += 30000 * account.multiplier;
    } else if (uniqueItems.length === 2) {
      if (counts['🏅 Vàng'] === 2) totalReward.gold += 16000 * account.multiplier;
      if (counts['🏆 Hũ vàng'] === 2) totalReward.gold += 80000 * account.multiplier;
      if (counts['🎫 Lượt quay thưởng'] === 2) totalReward.spinCount += 2 * account.multiplier;
    } else if (uniqueItems.length === 1) {
      if (counts['🏅 Vàng'] === 3) totalReward.gold += 60000 * account.multiplier;
      if (counts['🏆 Hũ vàng'] === 3) totalReward.gold += 160000 * account.multiplier;
      if (counts['🎫 Lượt quay thưởng'] === 3) totalReward.spinCount += 20 * account.multiplier;
      if (counts['🏴‍☠️ Lượt cướp đảo'] === 3) totalReward.robberyCount += 1;
    }

    // Tính thưởng hộp quà
    if (counts['🎁 Hộp quà'] === 3) {
      totalReward.giftBox = Math.floor(Math.random() * (10 - 5 + 1) + 5) * account.multiplier; // Nhân với mức gấp thếp
    } else if (counts['🎁 Hộp quà'] === 2) {
      totalReward.giftBox = Math.floor(Math.random() * (5 - 3 + 1) + 3) * account.multiplier; // Nhân với mức gấp thếp
    } else if (counts['🎁 Hộp quà'] === 1) {
      totalReward.giftBox = Math.floor(Math.random() * (3 - 1 + 1) + 1) * account.multiplier; // Nhân với mức gấp thếp
    }

    // Cập nhật tài khoản
    account.gold += totalReward.gold;
    account.spinCount += totalReward.spinCount;
    account.robberyCount += totalReward.robberyCount;
    account.giftBoxCount += totalReward.giftBox;

    // Tính thưởng hộp quà
    const milestoneReward = calculateGiftBoxReward(account);
    if (milestoneReward) {
      const rewardAmount = (milestoneReward.type === 'gold')
        ? Math.floor(Math.random() * (milestoneReward.max - milestoneReward.min + 1) + milestoneReward.min) * account.multiplier
        : milestoneReward.amount * account.multiplier;

      if (milestoneReward.type === 'gold') {
        totalReward.gold += rewardAmount;
      } else if (milestoneReward.type === 'spin') {
        totalReward.spinCount += rewardAmount;
      }
    }

    // Cập nhật tài khoản
    account.gold += totalReward.gold;
    account.spinCount += totalReward.spinCount;
    account.robberyCount += totalReward.robberyCount;
    await account.save();

    // Cập nhật caption
    const finalCaption = `${caption}\n\n${rewardMessage}\n🎁 Thưởng nhận được:\n💰 Vàng: ${totalReward.gold}\n🎫 Lượt quay: ${totalReward.spinCount}\n🏴‍☠️ Lượt cướp đảo: ${totalReward.robberyCount}\n📦 Hộp quà: ${totalReward.giftBox}`;

    await bot.editMessageCaption(finalCaption, {
      chat_id: msg.chat.id,
      message_id: account.spinMessageId,
    });

    // Đặt lại trạng thái quay
    account.isSpinning = false;
    await account.save();

  }, 3000); // Thời gian quay thưởng

});

// Xử lý chọn mức nhân gấp thếp
bot.onText(/X[1-9][0]?/, async (msg) => {
  const multiplier = parseInt(msg.text.substring(1), 10);
  const userId = msg.from.id;
  let account = await Account.findOne({ userId });

  if (!account) {
    bot.sendMessage(msg.chat.id, '🚫 Tài khoản không tồn tại.');
    return;
  }

  // Cập nhật mức gấp thếp
  account.multiplier = multiplier;
  await account.save();

  bot.sendMessage(msg.chat.id, `✅ Bạn đã chọn mức gấp thếp x${multiplier}.`);
});

// Hàm quay lại menu chính
bot.onText(/Quay Lại/, (msg) => {
  bot.sendMessage(msg.chat.id, '🔙 Đã quay lại menu chính.');
});

// Khởi tạo tài khoản khi người dùng bắt đầu
bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const account = await Account.findOne({ userId });

  if (!account) {
    const newAccount = new Account({ userId, username: msg.from.username });
    await newAccount.save();
    bot.sendMessage(msg.chat.id, '🎉 Tạo tài khoản thành công! Bạn có thể bắt đầu quay thưởng.');
  } else {
    bot.sendMessage(msg.chat.id, '👋 Chào mừng bạn trở lại!');
  }
});

// Hàm tự động tặng lượt quay
setInterval(async () => {
  const accounts = await Account.find({});

  accounts.forEach(async (account) => {
    account.spinCount += 5; // Tặng 5 lượt quay mỗi 30 phút
    await account.save();
  });
}, 30 * 60 * 1000); // Tự động tặng mỗi 30 phút

// Cập nhật thời gian đếm ngược cho từng tài khoản
setInterval(async () => {
  const accounts = await Account.find({});

  accounts.forEach(async (account) => {
    const timeRemaining = getRemainingTime();
    // Cập nhật caption cho các tài khoản đang quay thưởng
    if (account.spinMessageId) { // Kiểm tra nếu có ID tin nhắn
      const caption = `Đang quay thưởng... 🎉\n⏰ Thời gian hồi phục lượt quay: ${Math.floor(timeRemaining / 60)} phút\nMốc hộp quà hiện tại: ${account.giftBoxCount}/${giftBoxMilestones[account.currentGiftBoxMilestone].max}\nMức gấp thếp: x${account.multiplier}\n🎫 Lượt quay còn lại: ${account.spinCount}`;
      await bot.editMessageCaption(caption, { chat_id: account.userId, message_id: account.spinMessageId });
    }
  });
}, 60 * 1000); // Cập nhật mỗi phút


// Kiểm tra lệnh nhập vào
bot.onText(/\/(\d+)/, async (msg, match) => {
  const userId = msg.from.id;
  const account = await Account.findOne({ userId });

  if (!account) {
    bot.sendMessage(msg.chat.id, 'Tài khoản không tồn tại.');
    return;
  }

  const commandNumber = parseInt(match[1], 10);

  // Nếu lệnh là 123 thì cộng thêm 100 lượt quay thưởng
  if (commandNumber === 123) {
    account.spinCount += 100; // Cộng thêm 100 lượt quay thưởng
    await account.save();
    bot.sendMessage(msg.chat.id, '✅ Bạn đã nhận được thêm 100 lượt quay thưởng!');
  } else {
    bot.sendMessage(msg.chat.id, '🚫 Lệnh không hợp lệ.');
  }
});





// Xử lý khi nhấn vào các nút reply_markup Đảo Của Bạn, Nâng Cấp Hòn Đảo, Đi Cướp Biển
bot.onText(/Đảo Của Bạn|Nâng Cấp Hòn Đảo|Đi Cướp Biển/, (msg) => {
  // Kiểm tra nếu đang quay thưởng, xóa tin nhắn và không phản hồi
  if (spinInProgress) {
    bot.deleteMessage(msg.chat.id, msg.message_id);
  } else {
    // Xử lý các nút reply_markup khác nếu cần
    // ...
  }
});
// ...


// Xử lý khi nhấn vào nút reply keyboard Quay Thưởng
bot.onText(/Vòng Quay Đặc Biệt/, async (msg) => {
  const userId = msg.from.id;
  let account = await Account.findOne({ userId });
  const spinImage = 'https://img.upanh.tv/2023/11/25/Goldspin.gif';

  // Kiểm tra nếu quay thưởng đang diễn ra, không phản hồi và xóa tin nhắn mới
  if (spinInProgress) {
    bot.deleteMessage(msg.chat.id, msg.message_id);
    return;
  }

  if (account && account.spinCount > 0) {
    // Kiểm tra nếu đã quay vòng quay đặc biệt trong ngày
    const currentTime = new Date();
    const timeDiffInHours = account.lastSpecialSpinTime
      ? (currentTime - account.lastSpecialSpinTime) / (1000 * 60 * 60)
      : 24; // Set a default value of 24 hours if no previous record is found

    if (timeDiffInHours >= 24) {
      // Gửi ảnh GIF bằng hàm sendDocument và lấy message ID
      const spinMessage = await bot.sendDocument(msg.chat.id, spinImage, { caption: 'Đang quay thưởng...' });
      const spinMessageId = spinMessage.message_id;

      // Đặt cờ báo hiệu đang quay thưởng
      spinInProgress = true;

      // Giảm số lượt quay và lưu vào database
      account.spinCount--;
      account.lastSpecialSpinTime = currentTime;
      await account.save();

      // Đặt độ trễ 5 giây để hiển thị kết quả quay thưởng
      setTimeout(async () => {
        const isSpecialSpin = Math.random() <= 0.05; // 5% probability for a special spin
        let reward;

        if (isSpecialSpin) {
          // 5% có thể nhận được 200-400 số lượt quay thưởng
          const specialSpinAmount = Math.floor(Math.random() * (400 - 200 + 1)) + 200;
          account.spinCount += specialSpinAmount;
          reward = `Chúc mừng 🥳! Bạn nhận được ${specialSpinAmount} số lượt quay thưởng.`;
        } else {
          // 95% nhận được 50-150 số lượt quay thưởng
          const normalSpinAmount = Math.floor(Math.random() * (150 - 50 + 1)) + 50;
          account.spinCount += normalSpinAmount;
          reward = `Chúc mừng 🥳! Bạn nhận được ${normalSpinAmount} số lượt quay thưởng.`;
        }

        // Lưu lại thông tin tài khoản
        await account.save();

        // Hiển thị thông điệp thưởng
        bot.sendMessage(msg.chat.id, reward);

        // Xóa tin nhắn ảnh GIF sau khi hiển thị kết quả
        bot.deleteMessage(msg.chat.id, spinMessageId);

        // Reset cờ báo hiệu đã kết thúc quay thưởng
        spinInProgress = false;
      }, 5000); // 5 seconds delay
    } else {
      // Thông báo nếu chưa hết thời gian chờ để quay vòng quay đặc biệt
      const remainingTime = Math.ceil(24 - timeDiffInHours);
      const formattedTime = remainingTime > 1 ? `${remainingTime} giờ` : '1 giờ';

      // Tạo nút Reply_markup cho việc xác nhận sử dụng Viên Ngọc Biển Thần Bí
      const replyMarkup = {
        reply_markup: {
          keyboard: [
            [{ text: 'Đồng ý' }],
            [{ text: 'Quay về' }],
          ],
          resize_keyboard: true,
        },
      };

      // Gửi tin nhắn xác nhận
      bot.sendMessage(
        msg.chat.id,
        `Bạn đã hết lượt thưởng đặc biệt hôm nay, hãy chờ ${formattedTime} nữa để có thêm lượt quay miễn phí. Bạn có muốn sử dụng 46 Viên Ngọc Biển Huyền Bí 🔮 để quay ngay không? (Sử dụng 46 Viên Ngọc Biển 🔮 sẽ tăng x5 phần thưởng nhận được)`,
        replyMarkup
      );
    }
  } else if (account && account.spinCount === 0) {
    bot.sendMessage(msg.chat.id, 'Bạn đã hết lượt quay thưởng.');
  } else {
    bot.sendMessage(msg.chat.id, 'Tài khoản không tồn tại.');
  }
});

// Xử lý khi người dùng chọn "Đồng ý" hoặc "Quay về"
bot.onText(/Đồng ý|Quay về/, async (msg, match) => {
  const userId = msg.from.id;
  const choice = match[0];

  if (choice === 'Đồng ý') {
    let account = await Account.findOne({ userId });

    if (account && account.specialGemCount >= 46) {
      // Trừ 46 viên ngọc biển thần bí
      account.specialGemCount -= 46;

      // Reset số giờ chờ quay thưởng đặc biệt
      account.lastSpecialSpinTime = new Date(0);

      // Lưu lại thông tin tài khoản
      await account.save();

      // Thực hiện quay thưởng đặc biệt
      const spinImage = 'https://img.upanh.tv/2023/11/25/Goldspin.gif';

      // Gửi ảnh GIF bằng hàm sendDocument và lấy message ID
      const spinMessage = await bot.sendDocument(msg.chat.id, spinImage, { caption: 'Đang quay thưởng đặc biệt...' });
      const spinMessageId = spinMessage.message_id;

      // Đặt cờ báo hiệu đang quay thưởng
      spinInProgress = true;

      // Đặt độ trễ 5 giây để hiển thị kết quả quay thưởng
      setTimeout(async () => {
        const isSpecialSpin = Math.random() <= 0.1; // 5% probability for a special spin
        let reward;

        if (isSpecialSpin) {
          // 5% có thể nhận được 200-400 số lượt quay thưởng
          const specialSpinAmount = Math.floor(Math.random() * (675 - 540 + 1)) + 540;
          account.spinCount += specialSpinAmount;
          reward = `Chúc mừng 🥳! Bạn nhận được ${specialSpinAmount} số lượt quay thưởng!`;
        } else {
          // 95% nhận được 50-150 số lượt quay thưởng
          const normalSpinAmount = Math.floor(Math.random() * (405 - 270 + 1)) + 270;
          account.spinCount += normalSpinAmount;
          reward = `Chúc mừng 🥳! bạn nhận được ${normalSpinAmount} số lượt quay thưởng.`;
        }

        // Lưu lại thông tin tài khoản
        await account.save();

        // Hiển thị thông điệp thưởng
        bot.sendMessage(msg.chat.id, reward);

        // Xóa tin nhắn ảnh GIF sau khi hiển thị kết quả
        bot.deleteMessage(msg.chat.id, spinMessageId);

        // Reset cờ báo hiệu đã kết thúc quay thưởng
        spinInProgress = false;
      }, 5000); // 5 seconds delay
    } else {
      bot.sendMessage(msg.chat.id, 'Bạn không đủ Ngọc Biển Huyền Bí 🔮 để thực hiện điều này. Hãy nạp thêm.');
    }
  } else if (choice === 'Quay về') {
    // Thực hiện xử lý khi người dùng chọn "Quay về"
    // ...
  }
});




const robbingStatus = {};
let selectedRobberUsername;

bot.onText(/Cướp Đảo Ngay của @(.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const account = await Account.findOne({ userId });

  if (selectedRobberUsername && selectedRobberUsername === match[1]) {
    if (!robbingStatus[userId] && account && account.robberyCount > 0) {
      const currentTime = new Date();
      const lastRobberyTime = account.lastRobberyTime || new Date(0);
      const timeDiffInSeconds = (currentTime - lastRobberyTime) / 1000;

      if (timeDiffInSeconds >= 86400) {
        robbingStatus[userId] = true;

        const targetAccount = await Account.findOne({
          username: selectedRobberUsername,
          userId: { $ne: userId },
          gold: { $gt: 0 },
        });

        if (targetAccount) {
          const isHighAmount = Math.random() <= 0.1;
          const stolenAmount = isHighAmount
            ? Math.floor(Math.random() * (350000 - 200000 + 1)) + 200000
            : Math.floor(Math.random() * (140000 - 85000 + 1)) + 85000;

          targetAccount.gold -= stolenAmount;
          account.gold += stolenAmount;
          account.lastRobberyTime = currentTime;

          account.robberyCount--;

          await targetAccount.save();
          await account.save();

          bot.sendPhoto(msg.chat.id, targetAccount.islandImage, {
            caption: ` ☠️ Bạn đã cướp thành công ${stolenAmount} vàng từ hòn đảo của @${selectedRobberUsername}!
                  Thông tin hòn đảo đã cướp:
                  Tặc Danh: ${selectedRobberUsername}
                  Số Vàng còn lại: ${targetAccount.gold} 🌕
                        
                       
                  Level: ${targetAccount.level} 
                  Exp: ${targetAccount.exp} 🌟
                    `,
          });

          const messageToVictim = `
Bạn vừa bị cướp ${stolenAmount} vàng bởi tặc danh ${account.username}!
                        Số Vàng hiện tại của bạn: ${targetAccount.gold}
`;

          bot.sendMessage(targetAccount.userId, messageToVictim);
        } else {
          bot.sendMessage(msg.chat.id, 'Hòn đảo ảo ảnh hoặc không thể cướp hòn đảo này.');
        }

        robbingStatus[userId] = false;
      } else {
        const remainingTime = 86400 - timeDiffInSeconds;
        bot.sendMessage(
          msg.chat.id,
          `🚫 Bạn đã cướp hòn đảo hôm nay, bạn chỉ có thể cướp một đảo một lần trong 24 tiếng. Vui lòng đợi ${remainingTime.toFixed(0)} giây.`
        );
      }
    } else if (account && account.robberyCount === 0) {
      bot.sendMessage(msg.chat.id, 'Bạn đã hết lượt cướp đảo.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Bạn chỉ có thể cướp đảo đã tìm được.');
  }
});

// ...

// Function to generate the main menu keyboard
function generateMainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: 'Đảo Của Bạn 🏝️' }], [{ text: 'Quay Thưởng 🎉' }, { text: 'Vòng Quay Đặc Biệt 🃏' }],
      [{ text: 'Nâng Cấp Hòn Đảo 🚀' }], [{ text: 'Đi Cướp Biển ☠️' }]
    ],
    resize_keyboard: true,
  };
}

bot.onText(/Đi Cướp Biển/, async (msg) => {
  selectedRobberUsername = '';
  const randomAccount = await Account.aggregate([
    { $match: { gold: { $gt: 0 } } },
    { $sample: { size: 1 } }
  ]);

  if (randomAccount.length > 0) {
    selectedRobberUsername = randomAccount[0].username;

    const keyboard = {
      reply_markup: {
        keyboard: [
          [{ text: `Cướp Đảo Ngay của @${selectedRobberUsername}` }],
          [{ text: 'Quay về' }],
        ],

        resize_keyboard: true,
      },
    };

    bot.sendMessage(msg.chat.id, `Đã tìm thấy một hòn đảo @${selectedRobberUsername} để cướp.`, keyboard)
  } else {
    bot.sendMessage(msg.chat.id, 'Không tìm thấy tài khoản phù hợp để cướp vàng.');
  }
});

bot.onText(/Nâng Cấp Hòn Đảo/, async (msg) => {
  const userId = msg.from.id;
  const account = await Account.findOne({ userId });

  if (account) {
    const upgradeCost = calculateIslandUpgradeCost(account.islandUpgradeCount);

    const confirmMessage = `Bạn có muốn nâng cấp hòn đảo lên cấp ${account.islandUpgradeCount + 1} với số tiền là ${upgradeCost} vàng. Bạn có chắc chắn muốn nâng cấp không?`;
    const confirmOptions = {
      reply_markup: {
        keyboard: [
          [{ text: 'Xác nhận nâng cấp' }],
          [{ text: 'Quay về' }],
        ],
        resize_keyboard: true,
      },
    };

    bot.sendMessage(msg.chat.id, confirmMessage, confirmOptions);

    bot.onText(/Xác nhận nâng cấp/, async (msg) => {
      if (account.gold >= upgradeCost) {
        account.gold -= upgradeCost;
        account.islandUpgradeCount++;

        if (account.islandUpgradeCount === 1) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap1.jpg';
        }
        if (account.islandUpgradeCount === 2) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap2.jpg';
        }
        if (account.islandUpgradeCount === 3) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap3.jpg';
        }
        if (account.islandUpgradeCount === 4) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap4.jpg';
        }
        if (account.islandUpgradeCount === 5) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap5.jpg';
        }
        if (account.islandUpgradeCount === 6) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap6.jpg';
        }
        if (account.islandUpgradeCount === 7) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap7.jpg';
        }
        if (account.islandUpgradeCount === 8) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap8.jpg';
        }
        if (account.islandUpgradeCount === 9) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap9.jpg';
        }
        if (account.islandUpgradeCount === 10) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap10.jpg';
        }
        if (account.islandUpgradeCount === 11) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap11.jpg';
        }
        if (account.islandUpgradeCount === 12) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap12.jpg';
        }
        if (account.islandUpgradeCount === 13) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap13 .jpg';
        }
        if (account.islandUpgradeCount === 14) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap14.jpg';
        }
        if (account.islandUpgradeCount === 15) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap15.jpg';
        }
        if (account.islandUpgradeCount === 16) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap19.jpg';
        }
        if (account.islandUpgradeCount === 19) {
          account.islandImage = 'https://img.upanh.tv/2023/11/23/Cap19.jpg';
        }
        else if
          (account.islandUpgradeCount === 20) {
          account.islandImage = 'https://example.com/your-island-image-url-2.jpg';
        }

        await account.save();

        const successMessage = `Bạn đã nâng cấp hòn đảo thành công lần thứ ${account.islandUpgradeCount}!`;
        bot.sendMessage(msg.chat.id, successMessage);

        bot.removeTextListener(/Xác nhận nâng cấp/);
      } else {
        const errorMessage = 'Bạn không đủ vàng để nâng cấp hòn đảo.';
        bot.sendMessage(msg.chat.id, errorMessage);

        bot.removeTextListener(/Xác nhận nâng cấp/);
      }
    });
  } else {
    bot.sendMessage(msg.chat.id, 'Tài khoản không tồn tại.');
  }
});
// Xử lý khi nhấn vào nút Quay Lại
bot.onText(/Quay về/, async (msg) => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours() + 7;
  let greetingMessage;

  let imageUrl;

  if (currentHour >= 6 && currentHour < 18) {
    const morningGreetings = [
      'Ban ngày là lúc tốt nhất để khai thác tài nguyên trên hòn đảo. Hãy kiểm tra mỏ và bạn sẽ tìm thấy nhiều điều bất ngờ!',
      'Mỗi buổi sáng, tôi tìm kiếm cảm hứng từ bức tranh tuyệt vời của biển cả và bắt đầu một ngày mới tràn đầy năng lượng',
      'Ban ngày là thời điểm chúng ta cần tăng cường an ninh. Ai cũng phải bảo vệ hòn đảo của mình!',
      'Cửa hàng của tôi đang mở cửa, hãy ghé nếu bạn muốn nâng cấp hòn đảo của mình.',
      'Nhìn xa ra biển cả buổi sáng làm bạn cảm thấy như đang đối diện với những cuộc phiêu lưu mới.',
      // Thêm các lời chào buổi sáng khác vào đây
    ];
    greetingMessage = morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
    // Nếu là giờ từ 6h đến 18h, sử dụng hàm sendPhoto để hiển thị hình ảnh url 1
    imageUrl = 'https://img.upanh.tv/2023/11/25/Ngay1.gif'; // Thay thế bằng URL thực tế của hình ảnh
    bot.sendDocument(msg.chat.id, imageUrl, { caption: 'Chào buổi sáng, thủy thủ! Bạn đã kiểm tra kho báu của mình chưa?' });
  } else {

    const eveningGreetings = [
      'Dưới ánh đèn trăng, hãy ngồi lại và kể cho tôi nghe những câu chuyện về những thời kỳ huyền bí của biển cả.',
      'Buổi tối là lúc cá biển trở nên tĩnh lặng và nguy hiểm hơn', 'Khi bóng đêm bao trùm, tôi tiếp tục công việc mỏ của mình. Càng tối, càng ít người để quấy rối.', 'Buổi tối là thời gian tuyệt vời để mua sắm. Cửa hàng của ta đang có những ưu đãi đặc biệt đó', 'Dưới bóng tối, hãy cẩn thận, những câu chuyện về hồn ma trên biển cả có thể là có thật',
      // Thêm các lời chào buổi tối khác vào đây
    ];
    greetingMessage = eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)];
    // Nếu không phải giờ từ 6h đến 18h, sử dụng hàm sendDocument để hiển thị hình ảnh gif từ URL khác
    imageUrl = 'https://img.upanh.tv/2023/11/24/dem.gif'; // Thay thế bằng URL thực tế của hình ảnh gif
    bot.sendDocument(msg.chat.id, imageUrl, { caption: 'Dưới ánh trăng, biển cả trở nên yên bình, nhưng có những bí mật đen tối...' });
  }
  // Gửi lời chào tương ứng

  bot.sendMessage(msg.chat.id, greetingMessage, { reply_markup: generateMainMenuKeyboard() });
});

function calculateIslandUpgradeCost(upgradeCount) {
  const initialCost = 120000;
  const additionalCostPercentage = 0.18;
  return Math.floor(initialCost * Math.pow(1 + additionalCostPercentage, upgradeCount));
}
