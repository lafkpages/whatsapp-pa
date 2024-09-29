import type { Message } from "whatsapp-web.js";

import { CommandError } from "../../error";
import { PermissionLevel } from "../../perms";
import { Plugin } from "../../plugins";

export default class extends Plugin<"viewonce"> {
  readonly id = "viewonce";
  readonly name = "View Once";
  readonly description = "Allows saving view-once media";
  readonly version = "0.0.1";

  constructor() {
    super();

    this.registerCommands([
      {
        name: "keep",
        description: "Save a view-once media",
        minLevel: PermissionLevel.TRUSTED,

        async handler({ message, data, sender }) {
          let quotedMsg: Message | undefined;

          if (data) {
            quotedMsg = await this.client.getMessageById(data);

            if (!quotedMsg) {
              return false;
            }
          } else if (!message.hasQuotedMsg) {
            throw new CommandError(
              "you need to reply to a view-once message to save it",
            );
          }

          if (!quotedMsg) {
            quotedMsg = await message.getQuotedMessage();
          }

          if (!quotedMsg.hasMedia) {
            throw new CommandError("the replied message doesn't have media");
          }

          await this.handleKeep(quotedMsg, sender);

          return true;
        },
      },
    ]);

    this.on(
      "reaction",

      async ({ reaction, message, sender, permissionLevel }) => {
        if (reaction.reaction !== "\u267E\uFE0F") {
          return;
        }

        // Only allow trusted users to save view-once media
        if (permissionLevel < PermissionLevel.TRUSTED) {
          return;
        }

        if (!message.hasMedia) {
          return;
        }

        await this.handleKeep(message, sender);
      },
    );
  }

  async handleKeep(message: Message, sender: string) {
    const media = await message.downloadMedia();

    await this.client.sendMessage(sender, "View-once media saved!", {
      media,
      quotedMessageId: message.id._serialized,
    });
  }
}
