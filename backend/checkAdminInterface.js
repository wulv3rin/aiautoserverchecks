/*jshint esversion: 8 */

//deaktiviert TLS Zertifkatsprüfung. 
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const debug = require('debug')('app:checkAIP');
const debugVerbose = require('debug')('app:checkAIP_Verbose');
const async = require('async');
const rp = require('request-promise');
const iconv = require('iconv-lite');
const fs = require('fs');
var nodemailer = require('nodemailer');
//require('request-promise').debug = true;
//var rp = rp.defaults({jar: true,simple: false});
const db = require('./db');

const $ = require('cheerio');

const moment = require('moment');

//wird von extern aufgerufen, sucht nach neuen Peers und speicht diese in die DB. Anschließend werden die DB Daten abgerufen und übergeben
exports.getPeertaskForAPI = async () =>{
    let urlsprogress = 0;
    const urls = await getURLs();
    await db.resetPeertask();
    await db.deleteDbAIErrorALL();
    return new Promise((resolve, reject) => {
        async.each(urls, async (url) => {
            await getServercheckPage(url);
            urlsprogress = urlsprogress + 1;
            debug("progress: " + urlsprogress + "/" + urls.length);
        }, (err, results) => {
            if (err) throw err;
            urlsprogress = 0;
            db.getPeerTask()
                .then( (result) =>{ resolve(result);})
                .catch( (err) => {debug('Error on get DB Data');});
        });
    });
};

//Importiert Server aus der localen CSV Datei in die DB
exports.ImportServerFromCSV = async () => {
    const file = fs.readFileSync(__dirname + '/conf/URL-Liste.conf', 'utf8');
    const fileArray = file.split('\n');
    let aURL = [];
    fileArray.forEach(element => {
        let a = element.trim().split(',');
        if (a.length === 4 && a[0].indexOf("http") > -1 && a[0].indexOf("#") === -1) {
            db.updateDbServerUrl(a[0],a[1],a[2],a[3]);
        }
    });
    return (await db.getServerUrls());
};

// Lädt alle Server aus der DB
async function getURLs() {
    let aURL = [];
    let servers = await db.getServerUrls();
    servers.forEach(server => {
        const url = server.url;
        const user = server.user;
        const pw = server.password;
        const customer = server.customer;
        aURL.push([url, user, pw, customer]);
    });
    debug(aURL);
    return (aURL);
}

async function getServercheckPage(aURL) {
    let sURL        = aURL[0];
    let sLoginUser  = aURL[1];
    let sLoginPW    = aURL[2];
    let sKunde      = aURL[3];
    let sPos        = sURL.indexOf("/admin");
    let sURL_GET    = sURL.substr(0, sPos) + "/admin/AdminIndex.jsp";
    let sURL_POST   = sURL.substr(0, sPos) + "/admin/j_security_check";
    let sURL_CHECK  = sURL.substr(0, sPos) + "/AdminServlet?function=CheckServerStatus";
    if (sURL.indexOf("NetServer") > -1) {
        sURL_CHECK = sURL.substr(0, sPos) + "/admin/AdminServlet?function=CheckServerStatus";
    }

    let config_get = {
        method: 'GET',
        url: sURL_GET,
        headers: {
            'cache-control': 'no-cache'
        },
        //simple: false,
        jar: 'true',
    };
    let config_post = {
        method: 'POST',
        url: sURL_POST,
        headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        simple: false,
        jar: 'true',
        form: {
            j_username: sLoginUser,
            j_password: sLoginPW
        },
        transform: function (body) {
            //debugVerbose(body);
            return $.load(body);
        }
    };
    let config_check = {
        method: 'GET',
        url: sURL_CHECK,
        encoding: null,
        timeout: 300000,
        headers: {
            'cache-control': 'no-cache'
        },
        simple: false,
        jar: 'true',
        transform: function (body) {
            const body_encoded = iconv.decode(body, 'iso-8859-1');
            debugVerbose(body_encoded);
            return $.load(body_encoded, {decodeEntities: false});
        }
    };
    return rp(config_get)
        .then(function (body) {
            //debug($.html());    
            return rp(config_post)
                .then(function (body) {
                    //Prüfen ob Benutzernamen und Passwort stimmen. Wenn nicht wird dies in der HTML Seite zurück gegeben. 
                    if (body.html().indexOf('Passwort war falsch')>0) throw 'Password is wrong on ' + sURL;
                    return rp(config_check)
                        .then(function (body) {
                            //debug(body.html());
                            let spalte = 0;
                            let newPeerTask = [];
                                //0 = customer
                                //1 = serverURL
                                //2 = color
                                //3 = peerKeys
                                //4 = task
                                //5 = status
                                //6 = creationDate
                                //7 = counter
                                //8 = receiver
                                //9 = peerOid
                                //10 = still_current
                                //11 = ticketNr (wird nicht befüllt)
                                //12 = ticketClose (wird nicht befüllt)

                            //Im Admininterface stehen die Werte im ersten ChildElement. Bei der VP im zweiten. Daher VM=0 und VP =1 
                            let childID=0;
                            childID= sURL.indexOf("NetServer") > -1 ? childID=1 : childID=0;

                            //nur in der Tabelle mit class=tabelleLine2 stehen die haengenden Peertask
                            body('form > table > tbody > tr > td[class=tabelleLine2]').each(function (i, element) {
                                //debug(`i: ${i}, element: ${element}, class: ${element.attribs.class}`);
                                if (spalte==0){
                                    newPeerTask.push(sKunde); //0 = customer
                                    newPeerTask.push(sURL);   //1 = serverURL
                                    if (element.children[childID].attribs){
                                        newPeerTask.push(element.children[childID].attribs.color); //2 = color
                                    }
                                    spalte = 3;
                                }
                                //console.log (element);
                                if (element.children[childID].name == 'font') {
                                    //debug($(this).text());
                                    newPeerTask.push($(this).text().trim());    //3, 4, 5, 6, 7, 8, 
                                    spalte++;
                                }else if (element.children[childID].name == 'input') {
                                    //debug($(this).html());
                                    //debug(element);
                                    //debug(element.children[childID].attribs.value);
                                    newPeerTask.push(element.children[childID].attribs.value); // 9 = peerOid
                                    
                                    //Ab hier wurden alle Einträge von der Checkpage ausgelesen. Aktuelliesiere oder erzeuge neuen Peertask in der DB
                                    
                                    // Prüfe ob PeerOid ermittelt wurde
                                    if (newPeerTask[9]) {
                                        const peerTaskDate = moment(newPeerTask[6],'DD.MM.YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
                                        //Prüfe ob gespoolte Peertask älter als 15 Minuten sind
                                        if (moment().diff(peerTaskDate,'minutes') >= 15) {
                                            debug(newPeerTask);
                                            db.updateDbPeerTask(newPeerTask[0],newPeerTask[1],newPeerTask[2],newPeerTask[3],newPeerTask[4],newPeerTask[5],peerTaskDate,newPeerTask[7],newPeerTask[8],newPeerTask[9],true); //10 = still_current
                                        }
                                    }
                                    spalte = 0;
                                    newPeerTask = [];
                                } else if (element.children[childID].name == 'a'){
                                    debugVerbose(`Ende der Peertask von ${sURL} erreicht.`);
                                } else {
                                    debug(`Peertask von ${sURL} Spalte ${spalte} konnte nicht richtig ausgelesen werden:`);
                                    debug(`Children[0].name=${element.children[0].name}`);
                                    debug(`Children[1].name=${element.children[1].name}`);
                                }
                            });
                        })
                        .catch(async function (err) {
                            debug("Error on reading checkpage: " + err + " StatusCode: " + err.statusCode);
                            const dbresult = await db.updateAIError(sKunde, sURL, "Fehler beim Auslesen der Servercheckpage, StatusCode: " + err.statusCode);
                            debugVerbose(dbresult);
                        });
                })
                .catch(async function (err) {
                    debug("Error on Postrequest: " + err);
                    const dbresult = await db.updateAIError(sKunde, sURL, "Benutzername oder Passwort ist falsch");
                    debugVerbose(dbresult);
                });
        })
        .catch(async function (err) {
            debug("Admininterface " + sURL+ " not up: " + err + " StatusCode: " + err.statusCode);
            const dbresult = await db.updateAIError(sKunde, sURL, "Admininterface nicht erreichbar, StatusCode: " + err.statusCode);
            debugVerbose(dbresult);
        });
}
