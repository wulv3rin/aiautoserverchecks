/*jshint esversion: 8 */

const checkAdminInterface = require('./checkAdminInterface');
const db = require('./db');
const debug = require('debug')('app:express');
const morgan = require('morgan');
//const config = require('config');
const express = require('express');
const helmet = require('helmet');
const mail = require('./mail');

const schedule = require('./schedule');
const scheduleGetNewPeerTask = schedule.scheduleGetNewPeerTask;
const scheduleMail = schedule.scheduleMail;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

//enable Morgan Logging only in development mode
if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    debug(`Morgan is enabled...`);
}

//load DB Config:
//const dbConfig = config.get('Customer.dbConfig');
//debug(`DB_Pass: ${dbConfig.userPass}`);

// Prüft alle Systme nach neuen hängenden Peertask und gibt diese anchließend zurück. 
app.get('/api/searchForNewPeerTask', function (req, res) {
    checkAdminInterface.getPeertaskForAPI().then((aPeerTasks) => {
        debug(aPeerTasks);
        res.send(aPeerTasks);
    });
});

//Gibt alle in der DB gespeicherten PeerTask zurück
app.get('/api/getPeerTask', async function (req, res) {
    let result = await db.getPeerTask();
    debug(result);
    res.send(result);
});

//Aktuallisiert bei einen Peertask bei einen Key den Value
app.put('/api/updatePeerTask', async (req, res) => {
    const peerOid = req.body.peerOid;
    const key = req.body.key;
    const value = req.body.value;
    try {
        if (peerOid === undefined || key === undefined || value === undefined) throw error;
        const result = await db.updateDbPeerTaskOnlyOneValue(peerOid, key, value);
        res.send(result);
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry one of peerOId, key or value is missing`);
    }

});

app.put('/api/resetPeerTask', async (req, res) => {
    try {
        const result = await db.resetPeertask();
        res.status(200).send('All PeerTask where reseted');
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry one of peerOId, key or value is missing`);
    }

});

app.delete('/api/peerTask', async (req, res) => {
    try {
        result = await db.deleteDbPeerTask(req.body.peertaskoid);
        res.send(result);
    } catch (error) {
        debug(`Sorry. No peerTask was found white ID ${req.body.peertaskoid}`);
        res.sendStatus(404).send(`Sorry. No peerTask was found white ID ${req.body.peertaskoid}`);
    }
});

//Gibt alle in der DB gespeicherten Systeme zurück die nicht ausgewertet werden konnten
app.get('/api/getAIE', async (req, res) => {
    const result = await db.getAdminInterfaceErrors();
    res.send(result);
});



// Löscht einen DB eintrag der Systeme, die nicht ausgewertet werden konnten
app.delete('/api/aIE', async (req, res) => {
    try {
        result = await db.deleteDbAIError(req.body.url);
        result ? res.send(result) : res.status(404).send(`Sorry. No Error white URL "${req.body.url}" can be found`);
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry. No dbentry white URL "${req.body.url}" can be found`);
    }

});

app.delete('/api/aIEALL', async (req, res) => {
    try {
        result = await db.deleteDbAIErrorALL(req.body.url);
        result ? res.send(result) : res.status(404).send(`Sorry. No Error white URL "${req.body.url}" can be found`);
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry. No dbentry white URL "${req.body.url}" can be found`);
    }

});

//Gibt alle in der DB gespeicherten Server zurück
app.get('/api/getServerUrls', async function (req, res) {
    let result = await db.getServerUrls();
    debug(result);
    res.send(result);
});

//Importiert die Server aus einer lokalen CSV Datei in die DB
app.get('/api/importServerFromCSV', async function (req, res) {
    let result = await checkAdminInterface.ImportServerFromCSV();
    debug(result);
    res.send(result);
});

app.put('/api/ServerUrl', async (req, res) => {
    const url = req.body.url;
    const user = req.body.user;
    const password = req.body.password;
    const customer = req.body.customer;
    try {
        if (url === undefined || user === undefined || password === undefined || customer === undefined) throw error;
        const result = await db.updateDbServerUrl(url, user, password, customer);
        debug(`result: ${result}`);
        res.send(result);
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry one of url, user, password or customer is missing`);
    }
});

app.delete('/api/ServerUrl', async (req, res) => {
    try {
        result = await db.deleteDbServerUrl(req.body.url);
        debug(`result: ${result}`);
        result ? res.send(result) : res.status(404).send(`Sorry. No Error white URL "${req.body.url}" can be found`);
    } catch (error) {
        debug(`Sorry. No dbentry white url "${req.body.url}" can be found`);
        res.status(404).send(`Sorry. No dbentry white URL "${req.body.url}" can be found`);
    }
});

// Mailversand anstoßen (Sendet eine Mail)
app.get('/api/sendMail', async function (req, res) {
    mailbody = await mail.sendmail()
        .catch(console.error);
    res.send(mailbody);
});


// Scheduler für Stündliche Prüfung neuer PeerTask
// Prüfung deaktivieren
app.get('/api/schedulerGetPeerTaskDeactivate', function (req, res) {
    scheduleGetNewPeerTask.cancel();
    db.settingsUpdate({ updatePTUsed: false });
    res.send("Automatische PeerTask Überprüfung deaktiviert");
});
// Prüfung aktivieren
app.get('/api/schedulerGetPeerTaskActivate', async function (req, res) {
    const settings = await db.settingsGet();
    const cronValue = settings.updatePTCron;
    debug(`updatePTCron: "${cronValue}"`);
    if (scheduleMail.reschedule(cronValue)) {
        db.settingsUpdate({ updatePTUsed: true });
        res.send(`Automatische PeerTask Überprüfung aktiviert für "${cronValue}"`);
    }
    else {
        res.send(`Bei der reaktivierung des PeerTask Cronjob ist ein Fehler aufgetreten. Cron Sting prüfen: "${cronValue}"`);
    }
});

// Scheduler für automatischen Mailversand:
// Mailversand deaktivieren
app.get('/api/scheduleMailDeactivate', function (req, res) {
    scheduleMail.cancel();
    db.settingsUpdate({ smtpUsed: false });
    res.send("Automatische PeerTask Überprüfung deaktiviert");
});
// Mailverand aktivieren
app.get('/api/scheduleMailActivate', async function (req, res) {
    const settings = await db.settingsGet();
    const cronValue = settings.smtpCron;
    debug(`smtpCron: "${cronValue}"`);
    if (scheduleMail.reschedule(cronValue)) {
        db.settingsUpdate({ smtpUsed: true });
        res.send(`Mailversand aktiviert für "${cronValue}"`);
    }
    else {
        res.send(`Bei der reaktivierung des MailJobs ist ein Fehler aufgetreten. Cron Sting prüfen: "${cronValue}"`);
    }
});


//Einstellungen Auslesen
app.get('/api/settings', async (req, res) => {
    try {
        const result = await db.settingsGet();
        if (result.settingsType == undefined) throw error;
        debug(`result: ${typeof (result)}`);
        res.send(result);
    } catch (error) {
        debug(`No Settings found!`);
        res.status(404).send(`No Settings found!`);
    }
});

//Einstellungen updaten
app.put('/api/settings', async (req, res) => {
    const data = req.body;
    try {
        if (typeof data !== "object") throw error;
        const result = await db.settingsUpdate(data, 'default');
        res.send(result);
    } catch (error) {
        debug(`Sorry. You must send an JSON white one or more key:value`);
        res.status(404).send(`Sorry. You must send an JSON white one or more key:value`);
    }
});

const port = process.env.aiautoserverchecks_port || 3000;
app.listen(port, () => debug(`Server started on port ${port}`));