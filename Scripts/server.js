//dict.1.1.20241114T161900Z.08c82b4dccb6e866.a7d12d56bed49632d5d8086ebf3d3e30e0555da1

const session = require('express-session');
const express = require("express");
const fs = require("fs");
const path = require("path");

const axios = require('axios');

const database = require("./database");

const app = express();
const urlencodedParser = express.urlencoded({extended: false});
app.use(session({ secret: 'dictionary_key', resave: false, saveUninitialized: true }));

async function Translate(word, lang) {
    const url = `https://dictionary.yandex.net/api/v1/dicservice.json/lookup?key=${'dict.1.1.20241114T161900Z.08c82b4dccb6e866.a7d12d56bed49632d5d8086ebf3d3e30e0555da1'}&lang=${lang}&text=${encodeURIComponent(word)}`;

    try {
        // Выполняем запрос к API
        const response = await axios.get(url);
        const data = response.data;
    
        // Проверяем наличие переводов
        if (data.def && data.def.length > 0) {
            const translations = data.def[0].tr.map(translation => translation.text);
            console.log(`Перевод слова "${word}": ${translations}`);
            return translations;
        } else {
            console.log(`Перевод для слова "${word}" не найден.`);
        }
    } catch (error) {
        console.error('Произошла ошибка:', error.response ? error.response.data : error.message);
    }
}

async function randomWord() {
    try {
        const res = fetch('https://random-word-api.herokuapp.com/word?number=1')
        const data = res.json();
        return data[0]; // Возвращаем рандомное слово
    } catch (error) {
        console.error('Ошибка:', error);
        return null; // Возвращаем null в случае ошибки
    }
}

app.get("/", function(_, res){
    page = path.join(__dirname, '../Pages/index.html');
    res.sendFile(page);
});
app.get("/words", function(_, res){
    page = path.join(__dirname, '../Pages/words.html');
    res.sendFile(page);
});
app.get("/reg", function (_, res){
    page = path.join(__dirname, '../Pages/reg.html');
    res.sendFile(page);   
})
app.get("/auth", function (_, res){
    page = path.join(__dirname, '../Pages/auth.html');
    res.sendFile(page);   
})


app.post("/sendnew", urlencodedParser, function(req, res){
    if(!req.body) return res.sendStatus(400);
    console.log(req.body);
    res.send(`${req.body.word} - ${req.body.supertag} - ${req.body.tag}`);
    database.insertData(req.body.word, req.body.supertag, req.body.tag);
});


app.post("/reg", urlencodedParser, async function(req, res){
    register = await database.registrateUser(req.body.login, req.body.password)
    if (register){
        res.send('Succefull')
    }
    else res.send('This login is already registered')
})
app.post("/auth", urlencodedParser, async function(req,res){
    auth = await database.authUser(req.body.login, req.body.password)
    if (auth == -1){
        res.send('Incorrect login or password')
    }
    else{
        req.session.login = auth[0];
        req.session.liked = auth[2];
        req.session.firstlang = auth[3];
        req.session.secondland = auth[4];
        
        res.send('Success');
    }
})

app.post("/words", urlencodedParser, async function(req, res){
   
    fs.readFile(path.join(__dirname, '../Pages/words.html'), 'utf8', async (err, data) => {
        if (err) {
            console.error(err);
        }
        else{
            const markerEnd = '</table>';
            try{              
                const newWord = 'word'

                if (!req.session.words) {
                    req.session.words = [];
                }
                if (!req.session.translations) {
                    req.session.translations = [];
                }
                req.session.words.push(newWord);
                req.session.translations.push(await Translate(Translate(newWord, `${req.body.firstlang}-en`), `en-${req.body.secondlang}`));
                
                const newData = req.session.words.map((word, index) => 
                    `<tr> <td>${word}</td> <td>${req.session.translations[index]}</td> </tr>`).join('');

                const modifiedData = data.replace(markerEnd, `<div>${newData}</div>\n${markerEnd}`);
                res.send(modifiedData);
                
            } catch (err) {
                console.error(err);
            }
        }
    });
    
});

app.listen(1223);