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
app.use(cors())

// SUPERAGENT... Let's go get some API action!
const superagent = require('superagent');

// get the port from the env
const PORT = process.env.PORT || 3001;

app.get('/location', (request, response) => {
  try{
    let city = request.query.city;
    // let geoData = require('./data/geo.json');
    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATION_API}&q=${city}&format=json`

    

    console.log(url);

    superagent.get(url) 
        .then(data => {
        // console.log('results', data.body);
        
        let locationResults = data.body[0];
        console.log('local results', locationResults);
        let location = new City(city, data.body[0])
        // console.log('this is a place', location)
        response.send(location);
        })
  }
  catch (err){
    console.log('No location for you! Try again.', err);
  }
})  

app.get('/weather', (request, response)=>{
    try{
    let {search_query, formatted_query, latitude, longitude} = request.query;

    let url = `https://api.darksky.net/forecast/${process.env.DARKSKY_KEY}/${latitude},${longitude}`;

    superagent.get(url)
        .then(darkSky => {

            let weatherArray = darkSky.body.daily.data;
            console.log('darksky', weatherArray[0]);
            let newWeatherArray = weatherArray.map(day => new Weather(day));
        
            response.send(newWeatherArray);
        })

    // let darksky = require('./data/darksky.json');
    } 
    catch(err){
        console.log('No weather for you! Try again.', err)
    }
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

// turn on the server
app.listen(PORT, () => {
  console.log(`listening to ${PORT}`);
})

//note so I can ACP again