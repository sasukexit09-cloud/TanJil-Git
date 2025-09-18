const axios = require("axios");
const request = require("request");
const fs = require("fs");

module.exports = {
 config: {
 name: "adbox",
 aliases: ["adbox"],
 version: "1.0",
 author: "Chitron Bhattacharjee",
 countDown: 5,
 role: 1,
 shortDescription: {
 en: "✨ Group Admin Tool: Change Photo, Emoji, Name & Admins ✨",
 },
 description: {
 en: `
🌸 ──────────────
🌟 +adbox name <new group name> — Change group name
🌟 +adbox emoji <emoji> — Change group emoji
🌟 +adbox image — Reply to a photo to change group photo
🌟 +adbox add @tag — Add group admins
🌟 +adbox del @tag — Remove group admins
🌟 +adbox info — Show group info
 `,
 },
 category: "admin",
 guide: {
 en: "Use +adbox with subcommands name, emoji, image, add, del, info as needed.",
 },
 },

 langs: {
 en: {
 usage: `🌸✨ Usage of adbox command 🌸✨
➤ +adbox name <new group name>
➤ +adbox emoji <emoji>
➤ +adbox image (reply to photo)
➤ +adbox add @tag
➤ +adbox del @tag
➤ +adbox info`,
 replyToPhoto: `❌ Please reply to exactly one photo! 🌼`,
 noMention: `❌ Please tag someone to add/remove admin! 🌷`,
 doneName: (n) => `✨ Group name changed to: 💖 ${n}`,
 doneEmoji: (e) => `✨ Group emoji changed to: ${e} 🌟`,
 doneImage: `✨ Group photo changed successfully! 🖼️`,
 addingAdmin: `✨ Adding group admins... 🌱`,
 removingAdmin: `✨ Removing group admins... 🍃`,
 noPerm: `❌ You don't have permission to do that! 🚫`,
 infoTitle: `🌸🍃 Group Info for: 💖 `,
 infoMembers: (num) => `👥 Members: ${num}`,
 infoAdmins: (num) => `👑 Admins: ${num}`,
 infoEmoji: (e) => `😊 Emoji: ${e}`,
 infoApproval: (status) => `🔒 Approval mode: ${status}`,
 infoMessages: (num) => `✉️ Messages sent: ${num}`,
 },
 },

 // onChat support for commands starting with "adbox"
 onChat: async function ({ api, event, args, getLang }) {
 if (!event.body) return;
 if (!event.body.toLowerCase().startsWith("adbox")) return;

 args = event.body.trim().split(/\s+/).slice(1);
 return this.onStart({ api, event, args, getLang, message: { reply: (msg) => api.sendMessage(msg, event.threadID, event.messageID) } });
 },

 onStart: async function ({ api, event, args, getLang, message }) {
 if (!args || args.length === 0) {
 return apiSend(api, event.threadID, getLang("usage"));
 }

 const sub = args[0].toLowerCase();

 function apiSend(api, tid, msg, attach) {
 if (attach) {
 api.sendMessage({ body: msg, attachment: attach }, tid, event.messageID);
 } else {
 api.sendMessage(msg, tid, event.messageID);
 }
 }

 if (sub === "name") {
 let newName = args.slice(1).join(" ") || (event.messageReply && event.messageReply.body);
 if (!newName) return apiSend(api, event.threadID, `❌ Please provide a new group name! 🌸`);
 try {
 await api.setTitle(newName, event.threadID);
 return apiSend(api, event.threadID, getLang("doneName")(newName));
 } catch {
 return apiSend(api, event.threadID, `❌ Failed to change group name! 🚫`);
 }
 } else if (sub === "emoji") {
 let newEmoji = args[1] || (event.messageReply && event.messageReply.body);
 if (!newEmoji) return apiSend(api, event.threadID, `❌ Please provide a new emoji! 🌷`);
 try {
 await api.changeThreadEmoji(newEmoji, event.threadID);
 return apiSend(api, event.threadID, getLang("doneEmoji")(newEmoji));
 } catch {
 return apiSend(api, event.threadID, `❌ Failed to change emoji! 🚫`);
 }
 } else if (sub === "image") {
 if (!event.messageReply) return apiSend(api, event.threadID, getLang("replyToPhoto"));
 if (!event.messageReply.attachments || event.messageReply.attachments.length !== 1) return apiSend(api, event.threadID, getLang("replyToPhoto"));
 try {
 let pathFile = __dirname + "/assets/any.png";
 await new Promise((resolve, reject) => {
 request(encodeURI(event.messageReply.attachments[0].url))
 .pipe(fs.createWriteStream(pathFile))
 .on("close", resolve)
 .on("error", reject);
 });
 await api.changeGroupImage(fs.createReadStream(pathFile), event.threadID);
 fs.unlinkSync(pathFile);
 return apiSend(api, event.threadID, getLang("doneImage"));
 } catch {
 return apiSend(api, event.threadID, `❌ Failed to change group photo! 🚫`);
 }
 } else if (sub === "add") {
 if (!event.mentions || Object.keys(event.mentions).length === 0) return apiSend(api, event.threadID, getLang("noMention"));
 apiSend(api, event.threadID, getLang("addingAdmin"));
 for (const uid of Object.keys(event.mentions)) {
 try {
 await api.changeAdminStatus(event.threadID, uid, true);
 } catch {}
 }
 return apiSend(api, event.threadID, `✨ Added admins successfully! 🌟`);
 } else if (sub === "del") {
 if (!event.mentions || Object.keys(event.mentions).length === 0) return apiSend(api, event.threadID, getLang("noMention"));
 apiSend(api, event.threadID, getLang("removingAdmin"));
 for (const uid of Object.keys(event.mentions)) {
 try {
 await api.changeAdminStatus(event.threadID, uid, false);
 } catch {}
 }
 return apiSend(api, event.threadID, `✨ Removed admins successfully! 🌟`);
 } else if (sub === "info") {
 try {
 let threadInfo = await api.getThreadInfo(event.threadID);
 let memCount = threadInfo.participantIDs.length || 0;
 let adminCount = threadInfo.adminIDs.length || 0;
 let emoji = threadInfo.emoji || "🌸";
 let approval = threadInfo.approvalMode === false ? "❎ Off" : threadInfo.approvalMode === true ? "✅ On" : "⭕ Unknown";
 let msgs = threadInfo.messageCount || 0;
 let name = threadInfo.threadName || "N/A";
 let id = threadInfo.threadID;

 let adminList = "";
 for (let adm of threadInfo.adminIDs) {
 let user = await api.getUserInfo(adm.id);
 adminList += `• ${user[adm.id].name}\n`;
 }

 let msg = `
🌿 𝙶𝚛𝚘𝚞𝚙 𝙸𝚗𝚏𝚘 — Shipu AI 🤖
━━━━━━━━━━━━━━━━
🎀 𝙽𝚊𝚖𝚎: ${name}
🆔 𝙸𝙳: ${id}
🌸 𝙴𝚖𝚘𝚓𝚒: ${emoji}
🔒 𝙰𝚙𝚙𝚛𝚘𝚟𝚊𝚕: ${approval}
👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${memCount}
👑 𝙰𝚍𝚖𝚒𝚗𝚜: ${adminCount}

🌟 𝙰𝚍𝚖𝚒𝚗 𝙻𝚒𝚜𝚝:
${adminList || "No admins yet! 🌱"}

✉️ 𝙼𝚎𝚜𝚜𝚊𝚐𝚎𝚜 𝚂𝚎𝚗𝚝: ${msgs}

🤖 𝙱𝚘𝚝 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚑𝚒𝚙𝚞 𝙰𝙸
━━━━━━━━━━━━━━━━
 `;
 apiSend(api, event.threadID, msg);
 } catch (e) {
 apiSend(api, event.threadID, `❌ Failed to get group info! 🚫`);
 }
 } else {
 return apiSend(api, event.threadID, getLang("usage"));
 }
 },
};
<div style="text-align: center;"><div style="position:relative; top:0; margin-right:auto;margin-left:auto; z-index:99999">

</div></div>
