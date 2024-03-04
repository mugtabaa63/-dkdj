const { Client: Client2 } = require('discord.js-selfbot-v13');
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
const { parentId, probot_ids, recipientId, price } = require('./config.js');
const cooldowns1 = new Map();
const cooldowns2 = new Map();
const cooldowns = new Map();

const client = new Client({
  intents: 3276799
});

process.on('unhandledRejection', (err) => console.error(err));

client.on('ready', () => {
  app.listen(3000);
  console.log(`${client.user.username} Is Online !`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if(!interaction.member.roles.cache.has('1196775151212175380')) return interaction.reply('حدث خطأ الرجاء الذهاب لسيرفر السبورت https://discord.gg/4JHWVEyXzv');
    if (interaction.customId === 'confirm-' && cooldowns.get(interaction.message.id) && !cooldowns2.has(interaction.user.id)) {
        const {
        user,
        token,
        id,
        id2
      } = cooldowns.get(interaction.message.id);

      if (user !== interaction.user.id) return;

      await interaction.deferReply({
        ephemeral: true
      });
      const client2 = new Client2({
        checkUpdate: false
      });

      try {
        await client2.login(token);

      } catch {
        return interaction.editReply('هذا التوكن غير صحيح');
      }

      const guild = client2.guilds.cache.get(id);
      const guild2 = client2.guilds.cache.get(id2);

      if (!guild) return interaction.editReply('انت لست موجود في الخادم الأول');
      if (!guild2) return interaction.editReply('انت لست موجود في الخادم التاني');
      if (guild.id === guild2.id || !guild2.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.editReply('لا يمكن نسخ هذا السيرفر');

      await cooldowns2.set(interaction.user.id);
      await interaction.editReply(`\`\`\`#credit ${recipientId} ${price}\`\`\``);

      let done = false;
      const price1 = price === 1 ? 1 : Math.floor(price * 0.95);
      const filter = message => probot_ids.includes(message.author.id) && message.content.includes(`${price1}`) & message.content.includes(`${recipientId}`) && message.content.includes(`${interaction.user.username}`);
      const pay = await interaction.channel.createMessageCollector({
        filter,
        max: 1,
        time: 3e5
      });

      pay.once('collect', async () => {
        done = true;
        interaction.editReply('**جاري النسخ ..**');

        for (const [, channel] of guild2.channels.cache) {
          await channel.delete().catch(() => {});
        }

        for (const [, role] of guild2.roles.cache) {
          await role.delete().catch(() => {});
        }

        for (const [, emoji] of guild2.emojis.cache) {
          await emoji.delete().catch(() => {});
        }

        const roles = new Map();
        const categories = new Map();

        const guildRoles = [...guild.roles.cache.values()].sort((a, b) => a.rawPosition - b.rawPosition);

        const guildCategories = [...guild.channels.cache.filter((channel) => channel.type === 'GUILD_CATEGORY').values()].sort((a, b) => a.rawPosition - b.rawPosition);
        const guildChannels = [...guild.channels.cache.filter((channel) => channel.type !== 'GUILD_CATEGORY').values()].sort((a, b) => a.rawPosition - b.rawPosition);

        for (const role of guildRoles) {
          try {
            if (role.id === guild.roles.everyone.id) {
              await guild2.roles.everyone.setPermissions(role.permissions.toArray());

              interaction.channel.send('1 - جاري حذف كل شي');
              roles.set(role.id, guild2.roles.everyone);
              continue;
            }

            const createdRole = await guild2.roles.create({
              name: role.name,
              position: role.rawPosition,
              color: role.color,
              hoist: role.hoist,
              mentionable: role.mentionable,
              permissions: role.permissions.toArray(),
            });

            console.log(`Created Role: ${createdRole.name}`);
            roles.set(role.id, createdRole);

          } catch {
            console.error(`Failed to create role: ${role.name}`);
          }
        }

        interaction.channel.send('2 - تم الإنتهاء من الرولات');

        for (const category of guildCategories) {
          try {
            const permissionOverwrites = [];

            for (const [, overwrite] of category.permissionOverwrites.cache) {
              const role = roles.get(overwrite.id);

              if (role) {
                permissionOverwrites.push({
                  id: role.id,
                  allow: overwrite.allow.toArray(),
                  deny: overwrite.deny.toArray()
                });
              }
            }

            const createdCategory = await guild2.channels.create(category.name, {
              type: 'GUILD_CATEGORY',
              permissionOverwrites
            });

            console.log(`Created Category: ${createdCategory.name}`);
            categories.set(category.id, createdCategory);

          } catch {
            console.error(`Failed to create category: ${category.name}`);
          }
        }

        interaction.channel.send('3 - تم الإنتهاء من الكاتجوري');

        for (const channel of guildChannels) {
          try {
            const permissionOverwrites = [];
            const type = channel.type === 'GUILD_TEXT' ? 'GUILD_TEXT' : channel.type === 'GUILD_VOICE' ? 'GUILD_VOICE' : 'GUILD_TEXT';
            const parent = channel.parentId ? categories.get(channel.parentId) : null;

            for (const [, overwrite] of channel.permissionOverwrites.cache) {
              const role = roles.get(overwrite.id);

              if (role) {
                permissionOverwrites.push({
                  id: role.id,
                  allow: overwrite.allow.toArray(),
                  deny: overwrite.deny.toArray()
                });
              }
            }

            const createdChannel = await guild2.channels.create(channel.name, {
              type,
              permissionOverwrites,
              parent
            });

            console.log(`Created Channel: ${createdChannel.name}`);

          } catch {
            console.error(`Failed to create channel: ${channel.name}`);
          }
        }

        interaction.channel.send('4 - تم الإنتهاء من القنوات');

        for (const [, emoji] of guild.emojis.cache) {
          const createdEmoji = await guild2.emojis.create(emoji.url, emoji.name);

          console.log(`Created emoji: ${createdEmoji.name}`);
        }

        interaction.deleteReply();

        cooldowns1.delete(interaction.user.id);
        cooldowns2.delete(interaction.user.id);

        interaction.channel.send('5 - تم الإنتهاء من الايموجي');
        interaction.channel.send('تم الإنتهاء من الجميع!');
      });

      pay.once('end', () => {
        if (done) return;

        cooldowns1.delete(interaction.user.id);
        cooldowns2.delete(interaction.user.id);
        interaction.editReply('**انتهى وقت التحويل**');
      });
    }

    if (interaction.customId === 'confirm' && !cooldowns1.has(interaction.user.id)) {
      const modal = new ModalBuilder()
        .setCustomId('server-modal')
        .setTitle('Copy Server');

      const token = new TextInputBuilder()
        .setCustomId('token')
        .setMinLength(1)
        .setPlaceholder('مثال: MTE5NTQwMTE4ODM5NzU1MTY0Nw.GNJRnj.oOL-oVz3qmAN4VbIQHqH0d1jIu9WAhUuRx350o')
        .setStyle(TextInputStyle.Short)
        .setLabel('توكن الحساب');

      const id = new TextInputBuilder()
        .setCustomId('id')
        .setMinLength(1)
        .setPlaceholder('مثال: 936974185421475864')
        .setStyle(TextInputStyle.Short)
        .setLabel('ايدي السيرفر المراد نسخة');

      const id2 = new TextInputBuilder()
        .setCustomId('id2')
        .setMinLength(1)
        .setPlaceholder('مثال: 1115277371193438362')
        .setStyle(TextInputStyle.Short)
        .setLabel('ايدي السيرفر الذي سيتم وضع النسخ');

      const row = new ActionRowBuilder().addComponents(token);
      const row1 = new ActionRowBuilder().addComponents(id);
      const row2 = new ActionRowBuilder().addComponents(id2);

      modal.addComponents(row, row1, row2);
      interaction.showModal(modal);
    }

    if (interaction.customId === 'cancel') {
      cooldowns1.delete(interaction.user.id);
      cooldowns2.delete(interaction.user.id);
      interaction.channel.delete();
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'server-modal' && !cooldowns1.has(interaction.user.id)) {
      const token = interaction.fields.getTextInputValue('token');
      const id = interaction.fields.getTextInputValue('id');
      const id2 = interaction.fields.getTextInputValue('id2');

      await interaction.deferReply({
        ephemeral: true
      });
      const client2 = new Client2({
        checkUpdate: false
      });

      try {
        await client2.login(token);

      } catch {
        return interaction.editReply('هذا التوكن غير صحيح');
      }

      const guild = client2.guilds.cache.get(id);
      const guild2 = client2.guilds.cache.get(id2);

      if (!guild) return interaction.editReply('انت لست موجود في الخادم الأول');
      if (!guild2) return interaction.editReply('انت لست موجود في الخادم التاني');
      if (guild.id === guild2.id || !guild2.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.editReply('لا يمكن نسخ هذا السيرفر');

      await cooldowns1.set(interaction.user.id);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('confirm-')
        .setStyle(ButtonStyle.Success)
        .setLabel('Confirm'),
        new ButtonBuilder()
        .setCustomId('cancel')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Cancel'));

      const msg = await interaction.editReply({
        content: `هل أنت متأكد ان تريد نسخ ${guild.name}؟`,
        components: [row]
      });

      cooldowns.set(msg.id, {
        user: interaction.user.id,
        token,
        id,
        id2
      });
    }
  }
});

client.on('channelCreate', (channel) => {
  if (channel.parentId === parentId) {
    setTimeout(async () => {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('confirm')
          .setStyle(ButtonStyle.Success)
          .setLabel('Confirm'));

      channel.send({
        content: `**مرحبا بك في قسم النسخ**

        **عليك الضغط على الزر الاخضر بألاسفل**
        
        **سعر النسخه =** **10,000 كردت**`,
        components: [row]
      });
    }, 2500);
  }
});



client.login("");