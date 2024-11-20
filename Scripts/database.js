const { Client } = require('pg')

const client = new Client({
    host: 'localhost',
    user: 'postgres',     
    password: 'postgres',
    database: 'dictionary',
    port: 5432
});

client.connect()
    .then(() => console.log('Connected to the database'))
    .catch(err => console.error('Connection error', err.stack));

exports.insertData = function(wordV, supertagV, tagV){
    const query = `INSERT INTO words (word, supertag, tag) VALUES ($1, $2, $3)`;
    const values = [wordV, supertagV, tagV]

    client
        .query(query, values)
        .catch(err => console.log(err))
};
exports.getWord = async function(){
    const query = 'SELECT word FROM words ORDER BY RANDOM() LIMIT 1';
    try {
        const result = await client.query(query)
        if (result.rows.length > 0) {
            console.log(result.rows[0].word);
            return result.rows[0].word;
        } else {
            throw new Error('No words found');
        }
    } catch (err) {
        console.error(err); 
    }
}

exports.registrateUser = async function(login, passwod){
    isEmployed = await pool.query('SELECT * FROM users WHERE login = $1', [login])
    if (isEmployed.rows.lenght == 0)
    {
        const query = `INSERT INTO users (login, password, categories) VALUES ($1, $2, "liked":[])`;
        const values = [login, passwod]
        client
            .query(query, values)
            .catch(err => console.log(err))
        return true
    } else return false;
}
exports.authuser = async function(login, password){
    try{
        const res = await pool.query('SELECT * FROM users WHERE login = $1, password = $2', [login, password]);
        if (res.rows.length > 0) {
            return -1;
        }
        else{
            return res.rows[0];
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
    }
}