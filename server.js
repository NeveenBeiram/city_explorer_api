'use strict';

const express = require('express');
require('dotenv').config();

const cors = require('cors');

const server = express();

const PORT = process.env.PORT || 5000;

server.use(cors());

server.get('/',(req,res)=>{
  res.send('you server is working');
});

server.get('/location',(req,res)=>{
  // res.send('location route')
  // fetch the data from location.json file
  let geoData = require('./data/location.json');
  // console.log(geoData);
  let locationData = new Location (geoData);
  // console.log(locationData);
  res.send(locationData);
});

server.get('/weather',(req,res)=>{
  let newArr=[];
  let weatherData = require('./data/weather.json');
  weatherData.data.forEach(val=>{
    let wD =new Weather(val);
    newArr.push(wD);
  });
  res.send(newArr);

});

function Weather(weatherData){
  this.forecast=weatherData.weather.description;
  this.time=weatherData.datetime;
}


function Location(locData) {


  this.search_query = 'Lynwood';
  this.formatted_query = locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;

}

server.get('*',(req,res)=>{


  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status(500).send(errObj);
});

server.listen(PORT,()=>{
  console.log(`Listening on PORT ${PORT}`);
});

