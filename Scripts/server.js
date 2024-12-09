//dict.1.1.20241114T161900Z.08c82b4dccb6e866.a7d12d56bed49632d5d8086ebf3d3e30e0555da1

const session = require('express-session');
const express = require("express");
const fs = require("fs");
const path = require("path");

const axios = require('axios');

const database = require("./database");
const wordList = require('./wordlist')

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
        console.error('Произошла ошибка Yandex:', error.response ? error.response.data : error.message);
    }
}

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", function(_, res){
    page = path.join(__dirname, '../Pages/index.html');
    res.sendFile(page);
});
app.get("/words", function(req, res){
    if (!req.session.login){
        res.redirect('/auth');
    }
    else if (req.session.firstlang == 'none'){
        res.redirect('/setlang')
    }
    else{
        page = path.join(__dirname, '../Pages/words.html');
        res.sendFile(page);
    }
});
app.get("/reg", function (_, res){
    page = path.join(__dirname, '../Pages/reg.html');
    res.sendFile(page);   
})
app.get("/auth", function (_, res){
    page = path.join(__dirname, '../Pages/auth.html');
    res.sendFile(page);   
})
app.get('/setlang', function (_, res){
    page = path.join(__dirname, '../Pages/setlang.html');
    res.sendFile(page);
})


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
        req.session.login = auth.login;
        req.session.liked = auth.liked;
        req.session.firstlang = auth.firstlang;
        req.session.secondlang = auth.secondlang;
        
        res.send(`Success`);
    }
})

app.post('/setlang', urlencodedParser, function (req, res){
    database.setLang(req.body.firstlang, req.body.secondlang, req.session.login);
    req.session.firstlang = req.body.firstlang;
    req.session.secondlang = req.body.secondlang;
    res.send(`${req.session.firstlang} ${req.session.secondlang}`);
})

app.post("/words", urlencodedParser, async function(req, res){
    if (!req.session.login){
        res.redirect('/auth');
    }
    else if (req.session.firstlang == 'none'){
        res.redirect('/setlang')
    }
    else{
        fs.readFile(path.join(__dirname, '../Pages/words.html'), 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
            }
            else{
                const markerEnd = '</table>';
                try{              
                    const newWord = wordList.randomWord();

                    if (!req.session.words) {
                        req.session.words = [];
                    }
                    if (!req.session.translations) {
                        req.session.translations = [];
                    }
                    req.session.words.push(newWord);

                    firstTrans = newWord;
                    if (req.session.firstlang != 'en'){
                        firstTrans = await Translate(firstTrans, `en-${req.session.firstlang}`)
                    }
                    secondTrans = newWord;
                    if (req.session.secondlang != 'en'){
                        secondTrans = await Translate(firstTrans, `en-${req.session.secondlang}`)
                    }

                    req.session.translations.push([firstTrans, secondTrans]);

                    const newData = req.session.words.map((word, index) => 
                        `<tr> <td><p>${req.session.translations[index][0]}</p></td> <td><p>${req.session.translations[index][1]}</p></td> </tr>`).join('');

                    const modifiedData = data.replace(markerEnd, `<div>${newData}</div>\n${markerEnd}`);
                    res.send(modifiedData);

                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
    
});

app.listen(1223);