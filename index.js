require('dotenv').config();
const Brainly = require("./Brainly");
const Roboguru = require("./Roboguru");
const {
  execSync
} = require("child_process");
const {
  Telegraf
} = require("telegraf");
const {
  message
} = require("telegraf/filters");

const TOKEN = process.env.TOKEN;

const brainly = new Brainly();
const roboguru = new Roboguru();
const bot = new Telegraf(TOKEN);

(async () => {
  await roboguru.initialize();
})();

bot.on(message("text"), async (ctx) => {
  let text = ctx.update.message.text ?? ctx.update.message.caption;

  if (!text.startsWith("/")) return;
  text = text.slice(1);
  let args = text.split(" ");
  let cmd = args.shift();

  switch (cmd) {
    case "ping":
      ctx.reply("pong");
      break;
    case "roboguru_grades":
      const grades_list = roboguru.grade.map(
        (e) => `${e.id}. ${e.name.toUpperCase()}`
      ).join`\n`;
      return await ctx.reply(grades_list);
      break;
    case "roboguru_subjects":
      const subjects_list = roboguru.subject.map(
        (e) => `${e.id}. ${e.name.toUpperCase()}`
      ).join`\n`;
      return await ctx.reply(subjects_list);
      break;
    case "roboguru":
      if (args.length < 3) {
        return ctx.reply(
          `Perintah tidak sesuai/lengkap!\nContoh:\n/roboguru <id_tingkat> <id_mapel> <pertanyaan>`
        );
      }

      if (args.length >= 3) {
        let grade_id = Number(args.shift());
        let subject_id = Number(args.shift());
        let question = args.join` `;

        if (isNaN(grade_id) || grade_id < 1 || grade_id > 4) {
          return ctx.reply("ID Tingkat tidak terdaftar!");
        }
        if (isNaN(subject_id) || subject_id < 1 || subject_id > 19) {
          return ctx.reply("ID Mapel tidak terdaftar!");
        }

        try {
          await ctx.reply("Mencari...");
          let search_result = await roboguru.search(
            grade_id,
            subject_id,
            question
          );
          for (let i = 0; i < search_result.length; i++) {
            const {
              question,
              answers
            } = search_result[i];
            let q_msg = `*QUESTION*\n${question.text}`;
            if (question.image.length == 0) {
              await ctx.sendMessage(q_msg, {
                parse_mode: "Markdown",
              });
            } else {
              await ctx.sendMediaGroup(
                question.image.map((img, idx) => {
                  let image_data = {
                    type: "photo",
                    media: {},
                    caption: idx > 0 || q_msg.length >= 500 ? "": q_msg,
                    parse_mode: "Markdown",
                  };
                  if (img.startsWith("http")) image_data.media["url"] = img;
                  else {
                    let id = Date.now();
                    let _img = img.slice(img.indexOf(";base64,") + 8);
                    image_data.media["source"] = Buffer.from(_img, "base64");
                  }
                  return image_data;
                })
              );
              if (q_msg.length >= 500) {
                await ctx.sendMessage(an_msg, {
                  parse_mode: "Markdown",
                });
              }
            }

            for (let j = 0; j < answers.length; j++) {
              let an = answers[j];
              let an_msg = `*ANSWER*\n${an.text}`;
              if (an.image.length == 0) {
                await ctx.sendMessage(an_msg, {
                  parse_mode: "Markdown",
                });
              } else {
                await ctx.sendMediaGroup(
                  an.image.map((img, idx) => {
                    let image_data = {
                      type: "photo",
                      media: {},
                      caption: idx > 0 || an_msg.length >= 500 ? "": an_msg,
                      parse_mode: "Markdown",
                    };
                    if (img.startsWith("http")) image_data.media["url"] = img;
                    else {
                      let id = Date.now();
                      let _img = img.slice(img.indexOf(";base64,") + 8);
                      image_data.media["source"] = Buffer.from(_img, "base64");
                    }
                    return image_data;
                  })
                );
                if (an_msg.length >= 500) {
                  await ctx.sendMessage(an_msg, {
                    parse_mode: "Markdown",
                  });
                }
              }
            }
          }
        } catch (err) {
          console.log("Error:", err);
          await ctx.reply("Terjadi kesalahan saat mencari.");
        } finally {
          await ctx.reply("Pencarian selesai.");
        }
      }
      break;
    case "brainly":
      let m = await ctx.reply("Mencari..");
      try {
        let result = await brainly.search(args.join` `);
        //await ctx.deleteMessage(m.message_id);
        for (let i = 0; i < result.length; i++) {
          let d = result[i];
          let message = "*QUESTION*\n" + d.content;

          if (d.attachments.length == 0) {
            await ctx.sendMessage(message, {
              parse_mode: "Markdown",
            });
          } else {
            await ctx.sendMediaGroup(
              d.attachments.map((img, idx) => {
                return {
                  type: "photo",
                  media: {
                    url: img.url,
                  },
                  caption: idx > 0 ? "": message,
                  parse_mode: "Markdown",
                };
              })
            );
          }

          for (let j = 0; j < d.answers.length; j++) {
            let an = d.answers[j];
            let an_message = "*ANSWER*\n" + an.content;
            if (an.attachments.length == 0) {
              await ctx.sendMessage(an_message, {
                parse_mode: "Markdown",
              });
            }
            if (an.attachments.length == 1) {
              await ctx.sendPhoto(
                {
                  url: an.attachments[0].url,
                },
                {
                  caption: an_message,
                  parse_mode: "Markdown",
                }
              );
            }
            if (an.attachments.length > 1) {
              await ctx.sendMediaGroup(
                an.attachments.map((img, idx) => {
                  return {
                    type: "photo",
                    media: {
                      url: img.url,
                    },
                    caption: idx > 0 ? "": an_message,
                    parse_mode: "Markdown",
                  };
                })
              );
            }
          }
        }
      } catch (e) {
        console.log("[ERROR] " + e);
        //await ctx.deleteMessage(m.message_id);
        await ctx.reply("Terjadi kesalahan saat mencari.");
      } finally {
        await ctx.reply("Pencarian selesai.");
      }
      break;
    default:
      return;
    }
  });

  bot.launch();