var NodeGeocoder = require('node-geocoder');


var options = {
  provider: 'google',
  httpAdapter: 'https', // Default
  apiKey:'AIzaSyDCA8TkShdYJDMaOjbIYyabFUMY3QzNWvQ', // for Mapquest, OpenCage, Google Premier
  formatter: 'json' // 'gpx', 'string', ...
};
var geocoder = NodeGeocoder(options);


module.exports.getAddress = async (latitude,longitude) => {
    const res = await geocoder.reverse({lat:latitude, lon:longitude})
    return res[0]

}