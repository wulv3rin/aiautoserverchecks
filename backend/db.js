/*jshint esversion: 8 */
//@ts-check
const debug = require('debug')('app:DB');
const mongoose = require('mongoose');
mongoose.connect(`mongodb://${process.env.MongoDbHost}/${process.env.MongoDbSid}`)
    .then(() => debug(`Connected to MongoDB "${process.env.MongoDbHost}/${process.env.MongoDbSid}"`))
    .catch(err => debug(`Could not connect to MongoDB "${process.env.MongoDbHost}/${process.env.MongoDbSid}"`, err));

const peerTaskSchema = new mongoose.Schema({
    customer: { type: String, required: true },
    serverURL: { type: String, required: true },
    color: { type: String, required: true },
    peerKeys: { type: String, required: true },
    task: { type: String, required: true },
    status: { type: String, required: true },
    creationDate: { type: String, required: true },
    counter: { type: Number, required: true },
    receiver: { type: String, required: true },
    peerOid: { type: String, required: true, unique: true },
    still_current: { type: Boolean, required: false },
    ticketNr: { type: Number, required: false },
    ticketClose: { type: Boolean, required: false }
});
const PeerTask = mongoose.model('PeerTask', peerTaskSchema);

exports.createNewDbPeerTask = async (customer, serverURL, color, peerKeys, task, status, creationDate, counter, receiver, peerOid, still_current, ticketNr, ticketClose) => {
    const peerTask = new PeerTask({
        customer: customer,
        serverURL: serverURL,
        color: color,
        peerKeys: peerKeys,
        task: task,
        status: status,
        creationDate: creationDate,
        counter: counter,
        receiver: receiver,
        peerOid: peerOid,
        still_current: still_current ? still_current : false,
        ticketNr: ticketNr ? ticketNr : null,
        ticketClose: ticketClose ? ticketClose : null
    });
    try {
        const result = await peerTask.save();
        debug(result);
    } catch (error) {
        debug(error.message);
    }
};

exports.updateDbPeerTask = async (customer, serverURL, color, peerKeys, task, status, creationDate, counter, receiver, peerOid, still_current, ticketNr, ticketClose) => {
    try {
        const result = await PeerTask.findOneAndUpdate({ "peerOid": peerOid }, {
            customer: customer,
            serverURL: serverURL,
            color: color,
            peerKeys: peerKeys,
            task: task,
            status: status,
            creationDate: creationDate,
            counter: counter,
            receiver: receiver,
            peerOid: peerOid,
            still_current: still_current ? still_current : false,
            //ticketNr: ticketNr,
            //ticketClose: ticketClose ? ticketClose : false
        }, { upsert: true, new: true });
        debug(`${peerOid} updated`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};

exports.deleteDbPeerTask = async (peerOid) => {
    try {
        return await PeerTask.deleteOne({ "peerOid": peerOid });
    } catch (error) {
        debug(error.message);
    }
};

exports.updateDbPeerTaskOnlyOneValue = async (peerOid, key, value) => {
    try {
        const query = { peerOid: peerOid };
        const update = { [key]: value };
        debug(`peerOid: ${peerOid}, key: ${key}, value: ${value}`);
        const result = await PeerTask.findOneAndUpdate(query, update, { new: true });
        debug(`${peerOid} updated`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};

exports.resetPeertask = async () => {
    try {
        const query = { still_current: true };
        const update = { still_current: false };
        const option = { multi: true };
        const result = await PeerTask.updateMany(query, update);
        debug(`still_current updated`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};


exports.getPeerTask = async () => {
    // eq (=)   ne (!=)
    // gt (>)   gte (>=)
    // lt (<)   lte (<=)
    // in       nin (not in)

    try {
        const peerTask = await PeerTask
            //.find()
            .find({
                $and: [
                    { still_current: true },
                    { color: { $eq: 'Red' } },
                    //    {status: {$ne: 'Gespoolte ausgehende Nachricht'}},
                    //    {status: {$ne: 'Empfangene Nachricht'}}
                ]
            })
            //.find({color: {$eq: 'Red'}})
            //.limit(10)
            .sort({ creationDate: -1 });
        //.select({customer: 1, task: 1})
        //.count()
        debug(peerTask);
        const jPeerTask = await JSON.stringify(peerTask);
        return jPeerTask;
    } catch (error) {
        debug(error);
    }
};



// Schema und Logig fürs Erfassen von Verbindungsfehlern
//
const adminInterfaceErrorSchema = new mongoose.Schema({
    customer: { type: String, required: true },
    serverURL: { type: String, required: true },
    errorMessage: { type: String, required: true },
});
const AdminInterfaceError = mongoose.model('AdminInterfaceError', adminInterfaceErrorSchema);



// Hinzufügen von Verbindungsfehlern
exports.createNewDbAIError = async (customer, serverURL, errorMessage) => {
    const aIE = new AdminInterfaceError({
        customer: customer,
        serverURL: serverURL,
        errorMessage: errorMessage
    });
    try {
        const result = await aIE.save();
        debug(result);
    } catch (error) {
        debug(error.message);
    }
};

exports.updateAIError = async (customer, serverURL, errorMessage) => {
    try {
        const result = await AdminInterfaceError.findOneAndUpdate({ customer: customer, serverURL: serverURL, errorMessage: errorMessage }, {
            customer: customer,
            serverURL: serverURL,
            errorMessage: errorMessage
        }, { upsert: true, new: true });
        debug(`Error Message for url "${serverURL}" updated`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};


//Entfernen von Verbindungsfehlern
exports.deleteDbAIError = async (serverURL) => {
    try {
        const result = await AdminInterfaceError.findOneAndDelete({ "serverURL": serverURL });
        debug("ok");
        return result;
    } catch (error) {
        debug(error.message);
    }
};

exports.deleteDbAIErrorALL = async () => {
    try {
        const result = await AdminInterfaceError.deleteMany({});
        debug("ok");
        return result;
    } catch (error) {
        debug(error.message);
    }
};

exports.getAdminInterfaceErrors = async () => {
    // eq (=)   ne (!=)
    // gt (>)   gte (>=)
    // lt (<)   lte (<=)
    // in       nin (not in)

    try {
        const aIE = await AdminInterfaceError
            .find()
            //.find({customer: '0001_Example'})
            //.find({color: {$eq: 'Red'}})
            //.limit(10)
            .sort({ creationDate: 1 });
        //.select({customer: 1, task: 1})
        //.count()
        debug(aIE);
        return aIE;
    } catch (error) {
        debug(error);
    }
};

// Collection servers:
//
//
const serverUrlsSchema = new mongoose.Schema({
    url: { type: String, required: true },
    user: { type: String, required: true },
    password: { type: String, required: true },
    customer: { type: String, required: true },
});
const ServerUrls = mongoose.model('servers', serverUrlsSchema);


exports.getServerUrls = async () => {
    try {
        return await ServerUrls
            .find()
            .sort({ customer: 1 });
    } catch (error) {
        debug(error);
    }
};

exports.updateDbServerUrl = async (url, user, password, customer) => {
    try {
        const result = await ServerUrls.findOneAndUpdate({ "url": url }, {
            url: url,
            user: user,
            password: password,
            customer: customer
        }, { upsert: true, new: true });
        debug(`${url} updated`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};

exports.deleteDbServerUrl = async (url) => {
    try {
        return await ServerUrls.findOneAndDelete({ "url": url });
    } catch (error) {
        debug(error.message);
    }
};

exports.closeConnection = async () => {
    await mongoose.connection.close();
};

module.exports.PeerTask = PeerTask;

// Einstellungen der Anwendung
const settingsSchema = new mongoose.Schema({
    settingsType: { type: String, default: 'default' },
    updatePTUsed: { type: Boolean, default: true },
    updatePTCron: { type: String, default: '0 58 * * * *' },
    smtpUsed: { type: Boolean, default: true },
    smtpCron: { type: String, default: '0 0 7 * * *' },
    smtpHost: { type: String, default: 'exchange.local' },
    smtpPort: { type: Number, default: 25 },
    smtpAuthUsed: { type: Boolean, default: false },
    smtpUser: { type: String, default: 'username' },
    smtpPass: { type: String, default: 'userpass' },
    smtpFrom: { type: String, default: 'support@ai-ag.de' },
    smtpFromName: { type: String, default: 'AutoServerCheck' },
    smtpTo: { type: String, default: 'ahenkel@ai-ag.de' },
    smtpSubject: { type: String, default: 'AutoServerChecks' }
});
const Settings = mongoose.model('Settings', settingsSchema);

//Einstellungen auslesen
exports.settingsGet = async (sType) => {
    try {
        debug(`sType: ${sType}`);
        const query = { settingsType: sType ? sType : "default" };
        debug(`query: ${JSON.stringify(query)}`);
        const result = await Settings.findOne(query);
        debug(result);
        return result;
    } catch (error) {
        debug(error.message);
    }
};

//Einstellungen updaten
exports.settingsUpdate = async (settingJSON, sType) => {
    try {
        const query = { settingsType: sType ? sType : 'default' };
        const update = settingJSON;
        const options = { upsert: true, new: 1 };
        debug(`query: ${JSON.stringify(query)}, update: ${JSON.stringify(update)}, options: ${JSON.stringify(options)}`);
        const result = await Settings.findOneAndUpdate(query, update, options);
        debug(`result: ${result}`);
        return result;
    } catch (error) {
        debug(error.message);
    }
};

