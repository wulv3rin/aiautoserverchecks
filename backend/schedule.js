const schedule = require('node-schedule');
const checkAdminInterface = require('./checkAdminInterface');
const mail = require('./mail');

/**
 * Prüft automatisch im Hintergrund neue PeerTask
 * 
 * *    *    *    *    *    *
 * ┬    ┬    ┬    ┬    ┬    ┬
 * │    │    │    │    │    │
 * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 * │    │    │    │    └───── month (1 - 12)
 * │    │    │    └────────── day of month (1 - 31)
 * │    │    └─────────────── hour (0 - 23)
 * │    └──────────────────── minute (0 - 59)
 * └───────────────────────── second (0 - 59, OPTIONAL)
 * 
 */

exports.scheduleGetNewPeerTask = schedule.scheduleJob('0 58 * * * *', () =>{
    const d = new Date();
    console.log(`Time: ${d.toLocaleTimeString()}`);
    checkAdminInterface.getPeertaskForAPI().then((aPeerTasks)=>{
        console.log(aPeerTasks);
    });
});

exports.scheduleMail = schedule.scheduleJob('0 0 7 * * *', () =>{
    const d = new Date();
    console.log(`Time: ${d.toLocaleTimeString()}`);
    mail.sendmail().catch(console.error);
});
