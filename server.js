'use strict';

//Setup for sumbitting...

// brings in the expresss library which is our server
const express = require('express');

// instantiates the express library in app
const app = express();

// lets us go into the .env and get the variables
require('dotenv').config();

// the policeman - lets the server know that it is OK to give information to the front end
const cors = require('cors');
app.use(cors());

// SUPERAGENT... Let's go get some API action!
const superagent = require('superagent');

// get the port from the env
const PORT = process.env.PORT || 3001;

//All the  database goodies
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => console.error(error));


// Location Route - Provides city data upon user typing in city and hitting button -- testing
app.get('/location', (request, response) => {

    // Look in DB to see if location already exists
    let city = request.query.city;
    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATION_API}&q=${city}&format=json`
    let sql = 'SELECT * FROM locations WHERE search_query = $1;';
    let  safeValues = [city];

    client.query(sql, safeValues)
        .then(results => {
            if (results.rows.length > 0) {
                // If does, send that file to the front end
                    //it will make life easier if the structure of the DB data is in the same format as what the front end is expecting.
                response.send(results.rows[0]);
            } 
            // If it does not, then I need to go to the API and get the data
                //save it to the DB
                //send it to front end
            else {                        
                  superagent.get(url) 
                      .then(data => {                  
                      let locationResults = data.body[0];                  
                      let location = new City(city, locationResults);
                    
                      response.status(200).send(location);
    
                    let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4);';
                    let safeValues = [city, location.formatted_query, location.latitude, location.longitude]; 
                    
                    client.query(sql, safeValues);

                    }) 
                    .catch((err) => {
                    console.log('No location for you! Try again.', err);
                    }) 
                }   
        })
})

app.get('/weather', (request, response)=>{
    try{
    let {search_query, formatted_query, latitude, longitude} = request.query;

    let url = `https://api.darksky.net/forecast/${process.env.DARKSKY_KEY}/${latitude},${longitude}`;

    superagent.get(url)
        .then(darkSky => {

            let weatherArray = darkSky.body.daily.data;
            // console.log('darksky', weatherArray[0]);
            let newWeatherArray = weatherArray.map(day => new Weather(day));
        
            response.send(newWeatherArray);
        })

    // let darksky = require('./data/darksky.json');
    } 
    catch(err){
        console.log('No weather for you! Try again.', err)
    }
})


app.get('/trails', (request, response) => {
    let {latitude, longitude} = request.query;

    let url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxResults=3&key=${process.env.TRAILS_API_KEY}`;

    // console.log('Things are happening');

    superagent.get(url)
        .then(results => {
            // console.log('hi', results);
            let dataObj = results.body.trails.map(trail => new Trail(trail));
            // console.log(dataObj);
            response.status(200).send(dataObj);
        }) 
        .catch((err) => {
            console.log('Something went horribly wong!', err);
        })
})

app.get('/movies', (request, response) =>{

})



function City(city, obj){
  this.search_query = city;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

function Weather(day) {
    this.time = new Date(day.time * 1000).toDateString();
    this.forecast = day.summary;
}


function Trail(obj) {
    this.name = obj.name;
    this.location = obj.location;
    this.length = obj.length;
    this.stars = obj.stars;
    this.star_votes = obj.starVotes;
    this.summary = obj.summary;
    this.trail_url = obj.url;
    this.conditions = obj.conditionStatus;
    this.condition_date = obj.conditionDate.slice(0,10);
    this.condition_time = obj.conditionDate.slice(11,19);
  }

 
  client.connect()
    .then(() => {
        app.listen(PORT, () => {
          console.log(`listening to ${PORT}`);
        })
    })
        .catch((err) => {
            console.log('No database for you!', err);
        });
  

// turn on the server

//note so I can ACP again