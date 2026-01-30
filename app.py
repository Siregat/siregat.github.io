from aiogram import Bot, Dispatcher, executor, types

TOKEN = "ВСТАВЬ_СВОЙ_TOKEN"

bot = Bot(token=TOKEN)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start(msg: types.Message):
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.add(types.KeyboardButton(
        "🍷 Открыть дневник",
        web_app=types.WebAppInfo(url="https://your-site.com/index.html")
    ))
    await msg.answer(
        "Алко-дневник с аналитикой 📊\nЗаписывай и анализируй.",
        reply_markup=kb
    )

if __name__ == "__main__":
    executor.start_polling(dp)
