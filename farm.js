// Farm.js

// Hàm tính giá ô đất tiếp theo
function calculateNextLandPrice(currentLandCount) {
  const basePrice = 100000;
  const increasePercentage = 0.42;
  return Math.floor(basePrice * Math.pow(1 + increasePercentage, currentLandCount - 1));
}

// Hàm xử lý mua ô đất
async function handleBuyLand(msg, bot, Account) {
  const userId = msg.from.id;
  let account = await Account.findOne({ userId });

  if (!account) {
    bot.sendMessage(msg.chat.id, 'Tài khoản không tồn tại.');
    return;
  }

  // Tính giá ô đất tiếp theo
  const nextLandPrice = calculateNextLandPrice(account.landCount);

  // Hiển thị thông báo mua ô đất
  const buyLandMessage = `Số ô đất hiện tại của bạn là ${account.landCount}.
    Bạn có muốn mua thêm ô đất thứ ${account.landCount + 1} với giá ${nextLandPrice} vàng không?`;

  const buyLandOptions = {
    reply_markup: {
      keyboard: [
        [{ text: `Mua thêm ô đất (${nextLandPrice} vàng)` }],
        ['Quay lại nông trại'],
      ],
      resize_keyboard: true,
    },
  };

  bot.sendMessage(msg.chat.id, buyLandMessage, buyLandOptions);

  // Lắng nghe sự kiện nhấn nút mua ô đất
  bot.onText(/Mua thêm ô đất \((\d+) vàng\)/, async (msg, match) => {
    const landPrice = parseInt(match[1]);

    // Kiểm tra xem người chơi có đủ vàng để mua ô đất không
    if (account.gold >= landPrice) {
      // Trừ vàng và tăng số ô đất
      account.gold -= landPrice;
      account.landCount++;

      // Cập nhật hình ảnh nông trại dựa trên số ô đất
      if (account.landCount <= 10) {
        account.farmImage = `https://example.com/odat${account.landCount}.png`;
      }

      // Lưu lại thông tin tài khoản
      await account.save();

      // Hiển thị thông báo mua thành công
      bot.sendMessage(msg.chat.id, `Bạn đã mua ô đất thành công với giá ${landPrice} vàng.`);
    } else {
      // Hiển thị thông báo không đủ vàng
      bot.sendMessage(msg.chat.id, 'Bạn không đủ vàng để mua ô đất này.');
    }

    // Hủy sự kiện lắng nghe mua ô đất
    bot.removeTextListener(/Mua thêm ô đất \((\d+) vàng\)/);
  });
}

// ...
