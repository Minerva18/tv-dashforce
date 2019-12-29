# Salesforce TV Dashboards

This project showcases the art of the possible to turn any monitor/TV into a standalone, real-time dashboard of your Salesforce Data using a Raspberry Pi.
Blog Post - <a href="http://www.minerva18.com/blog/tv-dashforce/" target="_blank">http://www.minerva18.com/blog/tv-dashforce/</a>

Built with ❤️ using Salesforce Platform Events, Lightning Web Components Open Source, Lightning Design System, JSforce, Socket.io, Chart.js, Gauge.js, CountUp.js, Node Tweet Stream.

## Here is a quick demo video

![TV Dashforce Demo](http://img.youtube.com/vi/quYMZ_8zOmo/0.jpg)

http://www.youtube.com/watch?v=quYMZ_8zOmo

## Before you start

Make sure you have Node.js installed on your Raspberry Pi or where would be running this.

1. Setup your Salesforce Environment as described in this blog post: <a href="http://www.minerva18.com/blog/tv-dashforce-part-2-salesforce-setup/" target="_blank">http://www.minerva18.com/blog/tv-dashforce-part-2-salesforce-setup/</a>
2. Clone this repo onto your Raspberry Pi
3. In the terminal, navigate to the cloned repo directory and run `npm install`
4. Create a file with `.env` (with a leading period) as file name in the root of the cloned directory and add the following block as the .env file's content. These are environment variables. Make sure to replace the placeholders on the right hand side of each equals to sign with your actual credentials(except for the SF_LOGIN_URL).

```
#Salesforce Credentials
SF_LOGIN_URL=https://login.salesforce.com
SF_USERNAME=YOUR_SALESFORCE_USERNAME
SF_PASSWORD=YOUR_SALESFORCE_PASSWORD
SF_TOKEN=YOUR_SALESFORCE_SECURITY_TOKEN

#Twitter API Credentials
TW_API_KEY=YOUR_TWITTER_API_KEY
TW_API_SECRET=YOUR_TWITTER_API_SECRET
TW_ACCESS_TOKEN=YOUR_TWITTER_ACCESS_TOKEN
TW_ACCESS_TOKEN_SECRET=YOUR_TWITTER_ACCESS_TOKEN_SECRET

#Open Weather Map API Key. You can get one for free from here - https://openweathermap.org/appid
OWEATHER_API_KEY=YOUR_OPEN_WEATHER_MAP_API_KEY

#Calendarific Global Holiday API Key. You can get one for free by signing up here - https://calendarific.com/signup?plan=free
#CALENDARIFIC_HOLIDAY_API_KEY=YOUR_CALENDARIFIC_HOLIDAY_API_KEY
```

## How to start?

It is pretty simple!

Launch the dashboard by running `npm run dashboard`

**else**

If you are developing or making code changes, run `npm run watch`

**Note**: Only the `npm run serve` command launches the Dashboard automatically. When using the `npm run watch` command, you would need manually view the app in the browser.
