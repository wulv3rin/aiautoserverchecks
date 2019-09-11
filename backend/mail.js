const nodemailer = require("nodemailer");
const db = require('./db');
const debug = require('debug')('app:mail');

let peerTaskAnzahl = 0;
let host = "exchange.local";
let port = 25;
let secure = false;
let user = "";
let pass = "";
let from = "support@ai-ag.de";
let fromName = '"AutoServerCheck"';
let to =    "ahenkel@ai-ag.de";
let subject = "AutoServerChecks";

// async..await is not allowed in global scope, must use a wrapper
exports.sendmail = async function main() {
    const settings = await db.settingsGet();
        if (settings.settingsType !== undefined) {
            host = settings.smtpHost;
            port = settings.smtpPort;
            user = settings.smtpUser;
            pass = settings.smtpPass;
            from = settings.smtpFrom;
            fromName = settings.smtpFromName;
            to = settings.smtpTo;
            subject = settings.smtpSubject;
        }else{
            debug("Konnte Einstellungen nicht aus der DB laden!");
        }
    let mailtext = await db.getPeerTask();
    debug(mailtext);
    let mailTextHTML = generateTable('Test', mailtext);
    debug(mailTextHTML);
    let transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure // upgrade later with STARTTLS
        //todo
        //auth: {
        //  user: user,
        //  pass: pass
        //}
    });

    // send mail with defined transport object
    debug('Start sending mail');
    let info = await transporter.sendMail({
        from: `${fromName} ${from}`, // sender address
        to: to, // comma list of receivers
        subject: `${subject} Analyse ergab ${peerTaskAnzahl} Treffer!`, // Subject line
        text: mailtext, // plain text body
        html: mailTextHTML // html body
    }, (err, info, response) => {
        if (err) {
            console.error(err);
        } else {
            debug("Message sent: %s", info.messageId);
            debug(response);
        }
    });
    return mailTextHTML;
    //db.closeConnection(); //only when use direct.
};

//main().catch(console.error);

function generateTable(tablename, string) {
    data = JSON.parse(string);
    if (typeof (data[0]) === 'undefined') {
        return null;
    }

    peerTaskAnzahl = data.length;
    const url = 'https://asc.local/asc';

    let html = '<html><head>\n<style>\n';
    html += 'table {border-collapse: collapse;}\n'; 
    html += 'th, td {padding: 5px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12; font-family: sans-serif;}\n';
    html += 'tr:nth-child(even){background-color: #f2f2f2;}\n';
    html += 'th {background-color: #3399ff;color: white;}\n';
    html += '</style>\n</head>\n';
    html += `<header>\n<h2><a href="${url}">AutoServerChecks</a> ${peerTaskAnzahl} hängende Nachrichten</h2></header>\n`;
    html += '<body>\n<div style="overflow-x:auto;">\n<table id=' + tablename + '>\n';
    html += '<thead><tr><th>Erstellungsdatum</th><th>Kunde</th><th>Task</th><th>ServerURL</th><th>Status</th><th>Ticket-Nr</th></tr></thead><tbody>';

    if (data[0].constructor === Object) {
        for (var rowO in data) {
            html += '<tr>';
            for (var itemO in data[rowO]) {
                //html += '<td>' + itemO + ':' + data[rowO][itemO] + '</td>';
                if (itemO === "customer" | itemO === "serverURL" | itemO === "task" | itemO === "status" | itemO === "creationDate" | itemO === "ticketNr") {
                    html += '<td>' + data[rowO][itemO] + '</td>';
                }
            }
            html += '</tr>\n';
        }
    }

    html += '</tbody></table>\n</div>\n</body>\n</html>';
    return html;
}