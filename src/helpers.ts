import { MessageEmbed } from "discord.js";
import * as config from "../config.json";

export interface EmbedOptions {
  title: string;
  description: string;
  color?: string;
  author: {
    name: string;
    imageURL?: string;
    link?: string;
  };
  fields?: { name: string; value: string; inline?: boolean }[];
  imageURL?: string;
  footer?: string;
  thumbnail?: string;
}

export function makeEmbed(opts: EmbedOptions) {
  const embed = new MessageEmbed()
    .setColor(opts.color || config.embedColors.default)
    .setTitle(opts.title)
    .setAuthor(opts.author.name, opts.author.imageURL, opts.author.link)
    .addFields(...(opts.fields || []))
    .setDescription(opts.description)
    .setTimestamp();


  if (opts.footer) {
    embed.setFooter(opts.footer);
  }

  if (opts.imageURL) {
    embed.setImage(opts.imageURL);
  }

  if (opts.thumbnail) {
    embed.setThumbnail(opts.thumbnail);
  }

  return embed;
}
