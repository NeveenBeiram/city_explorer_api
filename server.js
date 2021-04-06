'use strict';

const express = require('express');
require('dotenv').config();

const cors = require('cors');
const pg=require('pg');
const server = express();

const superagent = require('superagent');

server.use(cors());

const PORT = process.env.PORT || 5000;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }
});

// let app = express();
// app.use(cors());

server.get('/',homeHandler);
server.get('/location',locationHandler);
server.get('/weather',weatherHandler);
server.get('/parks',parksHandler);

server.get('*',notFoundHandler);



function homeHandler(req,res){
  res.send('you server is working');
}

//localhost:3030/location?city=amman
// function locationHandler(req,res){
//   let cityName=req.query.city;
//   let SQL = `SELECT * FROM locations WHERE search_query = '${cityName}' ;`;
//   client.query(SQL)
//     .then (result=>{
//       if(result.rows.length > 0){
//         res.send(result.rows[0]);
//       }else{

//         let GEOCODE_API_KEY=process.env.GEOCODE_API_KEY;
//         let LocURL=`https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
//         superagent.get(LocURL)
//           .then(geoData=>{
//             let gData=geoData.body;
//             const locationData=new Location(cityName,gData);
//             res.send(locationData);
//           })
//           .catch(error =>{
//             console.error(error);
//             res.send(error);
//           });
//       }
//     });
// }




function locationHandler(req, res) {
  let cityName = req.query.city;
  let SQL = `SELECT * FROM locations WHERE search_query='${cityName}';`;
  client.query(SQL)
    .then(results => {
      if (results.rows.length > 0) {
        res.send(results.rows[0]);
      } else {
        let GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
        let locUrl = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${cityName}&format=json`;
        superagent.get(locUrl)
          .then(locationData => {
            let locData = locationData.body;
            const dataLoc = new Location(cityName, locData);
            res.send(dataLoc);
          })
          .catch(error => {
            res.send(error);
          });
      }
    });
}


function weatherHandler(req,res){
  // let newArr=[];
  let cityName=req.query.search_query;
  let WEATHER_API_KEY=process.env.WEATHER_API_KEY;
  let WeaURL=`https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${WEATHER_API_KEY}`;
  // let weatherData = require('./data/weather.json');
  superagent.get(WeaURL)
    .then(wData=>{
      // console.log(wData);
      let wtData=wData.body.data;
      console.log(wtData);
      // wtData.forEach(val=>{
      //   const weatherData=new Weather(val);
      //   newArr.push(weatherData);

      // });
      let arr=wtData.map((val)=>{
        return new Weather(val);

      });
      res.send(arr);
    })
    .catch(error=>{
      res.send(error);
    });

  // weatherData.data.forEach(val=>{
  //   let wD =new Weather(val);
  //   newArr.push(wD);
  // });
  // res.send(newArr);

}


/*park*/
function parksHandler(req,res){
  let city= req.query.search_query;
  // let parkCode=req.query.id;
  let PARKS_API_KEY=process.env.PARKS_API_KEY;
  let parkURL= `https://developer.nps.gov/api/v1/parks?q=${city}&api_key=${PARKS_API_KEY}`; //`https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${PARKS_API_KEY}`;

  superagent.get(parkURL)
    .then(pData=>{
      // console.log(pData);
      let parData=pData.body.data;

      let arr=parData.map((val)=>{
        return new Park(val);

      });
      res.send(arr);
    })
    .catch(error=>{
      res.send(error);
    });

}

/*/park*/
function Park (data){
  this.name=data.fullName;
  this.address=`${data.addresses[0].postalCode}, ${data.addresses[0].city}, ${data.addresses[0].stateCode}, ${data.addresses[0].line1}`;
  // this.address=Object.values(data.addresses[0]);
  this.fee=data.entranceFees[0].cost;
  this.description=data.description;
  this.url=data.url;
}

function Weather(weatherData){

  this.forecast=weatherData.weather.description;
  this.time=weatherData.datetime;
}


// function Location(cityName,locData) {


//   this.search_query = cityName;
//   this.formatted_query = locData[0].display_name;
//   this.latitude = locData[0].lat;
//   this.longitude = locData[0].lon;
//   {
//     let SQL2 = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
//     let safeValues = [this.search_query,this.formatted_query,this.latitude,this.longitude];
//     client.query(SQL2,safeValues)
//       .then(result=>{
//         return result.rows ;
//       });

//   }
// }
function Location(cityName, locationData) {
  this.search_query = cityName;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
  {
    let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;`;
    let safeValues = [this.search_query, this.formatted_query, this.latitude, this.longitude];
    client.query(SQL, safeValues)
      .then(results => {
        return results.rows;
      });
  }
}



function notFoundHandler(req,res){


  let errObj = {
    status: 500,
    responseText: 'Sorry, something went wrong'
  };
  res.status(500).send(errObj);
}

// server.listen(PORT,()=>{
//   console.log(`Listening on PORT ${PORT}`);
// });

client.connect()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });
