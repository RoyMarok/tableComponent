'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const list = require('./api/list');
const mbl = require('./api/mbl');
const tbl = require('./api/tbl');
const ntb = require('./api/ntb');
const structure = require('./api/structure');
const categories = require('./api/categories');

const app = express();

let nextId = 5;

app.set('port', (process.env.PORT || 3000));

app.use(express.static(path.join(__dirname, '')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
});
app.get('/api/list/', (req, res) => {
    let outputList = [];
    // let outDataList = (Object.keys(req.query).length>0)?[]:mbl.concat(tbl, ntb);
    let outDataList = [];
    Object.keys(req.query).forEach((item)=>{
        switch (item) {
            case 'mbl':
                outDataList = outDataList.concat(mbl);
                break;
            case 'tbl':
                outDataList = outDataList.concat(tbl);
                break;
            case 'ntb':
                outDataList = outDataList.concat(ntb);
                break;
            default:
                outDataList = outDataList.concat(mbl, tbl, ntb);
        }
    });
    outDataList = outDataList.map((item, i)=>{
        let oneArr = [i+1];
        return oneArr.concat(item);
    });
    outputList = outputList.concat(structure, outDataList);
    res.send(outputList);
    //res.send(req.query);
});

app.get('/api/categories', (req, res) => {
    res.send(categories);
});

app.get('*', (req, res) => {
    fs.readFile(`${__dirname}/index.html`, (error, html) => {
        if (error) throw error;

        res.setHeader('Content-Type', 'text/html');
        res.end(html);
    });
});

app.listen(app.get('port'), () => console.log(`Server is listening: http://localhost:${app.get('port')}`));
