// eslint-disable-next-line no-undef
require('dotenv').config();

const { exec } = require('child_process');

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const jsforce = require('jsforce');
const twitter = require('node-tweet-stream');
const axios = require('axios');

const PORT = 3003;
const CDC_DATA_CHANNEL = '/data/ChangeEvents';
const CHATTER_CHANNEL = '/event/Chatter_To_TV_Dashboard__e';

const {
    SF_USERNAME,
    SF_PASSWORD,
    SF_TOKEN,
    SF_LOGIN_URL,
    TW_API_KEY,
    TW_API_SECRET,
    TW_ACCESS_TOKEN,
    TW_ACCESS_TOKEN_SECRET,
    OWEATHER_API_KEY,
    CALENDARIFIC_HOLIDAY_API_KEY,
    npm_lifecycle_event
} = process.env;

// Check for required Salesforce Credentials
if (!(SF_USERNAME && SF_PASSWORD && SF_TOKEN && SF_LOGIN_URL)) {
    console.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

// Connect to Salesforce
const conn = new jsforce.Connection({
    loginUrl: SF_LOGIN_URL
});

conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN, err => {
    if (err) {
        console.error(err);
        process.exit(-1);
    }

    console.log('SF Logged In!');

    // Subscribe to Change Data Capture Events
    console.log('subscribing to CDC channel: ' + CDC_DATA_CHANNEL);
    conn.streaming.topic(CDC_DATA_CHANNEL).subscribe(data => {
        const { event, payload } = data;
        const { entityName, changeType } = payload.ChangeEventHeader;
        console.log(
            `cdc event received [${event.replayId}]: ${entityName}:${changeType}`
        );
        //Publish Socket Event with the CDC events data to be received by the client(LWC Front-end)
        io.emit(`cdc`, payload);
    });

    // Subscribe to custom Platform Event for Chatter Announcements
    console.log('subscribing to chatter channel: ' + CHATTER_CHANNEL);
    conn.streaming.topic(CHATTER_CHANNEL).subscribe(data => {
        console.log('chatter announcement Event >>> ', data);
        //Publish Socket Event with the Custom Platform Events data to be received by the client(LWC Front-end)
        io.emit(`chatterAnnouncement`, data);
    });
});

//Connect to tweet stream
if (TW_API_KEY && TW_API_SECRET && TW_ACCESS_TOKEN && TW_ACCESS_TOKEN_SECRET) {
    const tweetStream = new twitter({
        consumer_key: TW_API_KEY,
        consumer_secret: TW_API_SECRET,
        token: TW_ACCESS_TOKEN,
        token_secret: TW_ACCESS_TOKEN_SECRET
    });

    tweetStream.track('javascript');

    tweetStream.on('tweet', tweet => {
        io.emit(`tweet`, tweet);
    });

    tweetStream.on('error', err => {
        console.log('Twitter Stream Error ', err);
    });
}

// Log when a client connects to socket server
io.on('connection', socket => {
    console.log(`client connected: ${socket.id}`);
});

// Start backend socket server
server.listen(PORT, openDashboard);

function openDashboard() {
    console.log(`Running socket server on port ${PORT}`);
    if (npm_lifecycle_event === 'serve') {
        console.log('Launching Dashboard!!');
        exec(
            'chromium-browser --noerrdialogs --kiosk  http://0.0.0.0:3002 --incognito --disable-translate'
        );
    }
}

const getShortDay = timestamp => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(timestamp * 1000).getDay()];
};

module.exports = app => {
    //express app logic to get weather
    app.get('/api/weather', (req, res) => {
        const location = `${req.query.city},${req.query.countryCode}`;
        const baseURL = 'https://api.openweathermap.org/data/2.5';
        const currentWeather = axios.get(
            `${baseURL}/weather?q=${location}&appid=${OWEATHER_API_KEY}&units=metric`
        );
        const weatherForecast = axios.get(
            `${baseURL}/forecast/daily?q=${location}&cnt=5&appid=${OWEATHER_API_KEY}&units=metric`
        );

        axios
            .all([currentWeather, weatherForecast])
            .then(
                axios.spread((currentWeatherRes, weatherForecastRes) => {
                    //Add current weather icon URL to the API Response
                    currentWeatherRes.data.iconURL = `http://openweathermap.org/img/wn/${currentWeatherRes.data.weather[0].icon}@2x.png`;
                    //Format & add current temperature to the API Response
                    currentWeatherRes.data.formattedTemp = Math.round(
                        currentWeatherRes.data.main.temp
                    );
                    currentWeatherRes.data.weatherConditionName =
                        currentWeatherRes.data.weather[0].main;

                    //Add icon URLs to the forecast API Response
                    weatherForecastRes.data.list.forEach(item => {
                        item.iconURL = `http://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                        item.formattedDay = getShortDay(item.dt);
                        item.formattedMinTemp = Math.round(item.temp.min);
                        item.formattedMaxTemp = Math.round(item.temp.max);
                        item.weatherConditionName = item.weather[0].main;
                    });

                    res.send({
                        response: {
                            current: currentWeatherRes.data,
                            forecast: weatherForecastRes.data
                        }
                    });
                })
            )
            .catch(errors => {
                res.sendStatus(500);
            });
    });

    app.get('/api/holidays', (req, res) => {
        const country = req.query.countryCode;
        const year = new Date().getFullYear();
        const requestURL = `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_HOLIDAY_API_KEY}&country=${country}&year=${year}`;
        axios
            .get(requestURL)
            .then(function(response) {
                res.send(response.data);
            })
            .catch(function(error) {
                res.sendStatus(500);
            });
    });
};
