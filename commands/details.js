const { MessageEmbed } = require("discord.js");
const config = require('../config.json');
const localization = require('../localization/' + config.localization_file);
const schedule = require('node-schedule');
const fs = require("fs");
let MS_Per_Day = 1000 * 60 * 60 * 24;

module.exports.info = {
  "title": localization.commands.details.title,
  "name": localization.commands.details.name,
  "desc": localization.commands.details.desc,
  "color": localization.commands.details.color,
  "field0": localization.commands.details.field0,
  "field1": localization.commands.details.field1,
  "field2": localization.commands.details.field2,
  "field3": localization.commands.details.field3,
  "time_field": config.time_field,
  "plant_name_title": localization.commands.details.plant_name_title,
  "plant_name": config.plant_name,
  "plant_type_title": localization.commands.details.plant_type_title,
  "plant_type": config.plant_type
}


function dateDiff(a, b) {
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / MS_Per_Day);
}

var d_humidity = []
var w_humidity = []
var a_humidity = []


function getAverage(array) {
  const avg = arr => arr.reduce((acc, v, i, a) => (acc + v / a.length), 0);
  const result = avg(array);
  return result
}




module.exports.execute = (client, message) => {
  let currentPhotoMTime;


  const a = new Date();
  const b = new Date(config.start_date);
  const difference = dateDiff(b, a);

  var d_avg = getAverage(d_humidity)
  var w_avg = getAverage(w_humidity)
  var a_avg = getAverage(a_humidity)
  const embed = new MessageEmbed()
    .setTitle(this.details.title)
    .setColor(this.details.color)
    .setFooter({
      text: message.member.displayName,
      iconURL: message.author.displayAvatarURL({ dynamic: true }),
    })
    .setTimestamp()
    .addFields(
      {
        "name": this.details.plant_name_title,
        "value": this.details.plant_name,
        "inline": true
      },
      {
        "name": this.details.plant_type_title,
        "value": this.details.plant_type,
        "inline": true
      },
      {
        "name": this.details.field0,
        "value": "%" + client.helpers.arduinoBridge.getMoisture(),
        "inline": false
      },
      {
        "name": this.details.field1,
        "value": "%" + config.moisture_min + " - %" + config.moisture_max,
        "inline": false
      },
      {
        "name": this.details.field2,
        "value": `${difference}` + `${this.details.time_field}`,
        "inline": false
      })
  fs.stat(config.photo_path, (err, stats) => {
    if (err) {
      //no photo found
      console.log(`DEBUG: No photo found. Is the webcam connected?`);
    } else {
      //photo found
      currentPhotoMTime = stats.mtime.toISOString();
      console.log(`DEBUG: File Data Last Modified: ${stats.mtime}`);
      //send embed message
      let cachedImg = []
      if (!client.lastPhoto || client.lastPhoto.mtime !== currentPhotoMTime) {
        // Last photo expired we need a new one.
        console.log(`DEBUG: Last photo expired, uploading new one.`);
        embed.setImage(`attachment://${config.photo_path.split('/').reverse()[0]}`);
        cachedImg = [config.photo_path]
      } else {
        console.log(`DEBUG: Using photo from cache.`);
        embed.setImage(client.lastPhoto.url)
      }
      embed.setThubnail(cachedImg)
    }
  })
  message.channel.send({ embeds: [embed] });

  const hourly_job = schedule.scheduleJob('*/1 * * * *', function () {
    d_humidity.push(client.helpers.arduinoBridge.getMoisture())
    w_humidity.push(client.helpers.arduinoBridge.getMoisture())
    a_humidity.push(client.helpers.arduinoBridge.getMoisture())
  });
}