const express = require("express")
    , app = express()
    , bodyParser = require("body-parser")
    , nodemailer = require("nodemailer")
    , axios = require("axios")
    , mongodb = require('mongodb').MongoClient
    , cron = require('node-cron')
    , nodemon = require("nodemon")
    , fs = require('fs')
    , dateFormat = require("dateformat")
    , path = require("path")
    , static_path = path.join(__dirname, "public")
    , cowin = require("./cowin");

app.use(express.static(static_path));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Setting up SMTP transport connection
let transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: '745778adf30aa6',
        pass: '14695989ce87e5'
    }
});

let emailNotifier = async (toEmail,centerFilteredData,callback) => {
    const text = "<html><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"></head>" +
        "<body>" +
        "<h1>Vaccination available near you!</h1><p>Get your vaccine today!</p>" +
        "</body></html>";
    console.log(centerFilteredData);
    let rows = ``;
    for (i=0;i<centerFilteredData.length;i++){
        let row = `<tr>
                      <td>`+centerFilteredData[i].name+`</td>
                      <td>`+centerFilteredData[i].district_name+`</td>
                      <td>`+centerFilteredData[i].pincode+`</td>
                      <td>`+centerFilteredData[i].sessions+`</td>
                      <td>`+centerFilteredData[i].fee_type+`</td>
                    </tr>
                     `;
        rows = rows + row;
    }
    let html = `
          <html>
            <head><title>Test-email</title></head><body>
            <h3> Available Slots </h3>
            <table id="tests">
                <tr>
                    <th>Center-Name</th>
                    <th>District</th>
                    <th>Pincode</th>
                    <th>Vaccine</th>
                    <th>Fee</th>
                </tr>
                 `+rows+`
            </table></body></html>`;
    const message = {
        from: "no-reply@vaccination.notifier.com",
        to: toEmail,
        subject: "Vaccination availability near you",
        text: text,
        html: html,
    };
    const notifiedTimestamp = Date.now();
    await transport.sendMail(message, (error, result) => { // transport.sendMail() uses callback that's why await won't work here
        if (error) callback(error);
        console.log("Notification sent to " + toEmail + " on " + new Date(notifiedTimestamp));
        database.collection("users").updateOne({email: toEmail}, {$set: {last_notified_ts: notifiedTimestamp}}, (error, result) => {
            if (error) callback(error);
            if(result.modifiedCount == 1)
                console.log("Updated 'last_notified_ts' for " + toEmail + " with " + notifiedTimestamp);
        });
    });
    return "sending mail...";
}



module.exports = { emailNotifier };