import { LightningElement, api, track } from 'lwc';

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

export default class clockWeatherHolidays extends LightningElement {
    @api city = 'Hyderabad';
    @api countryCode = 'IN';

    @track time;
    @track date;

    @track currentWeather;
    @track weatherForecast;

    @track holidayList;
    @track upcomingHolidays;

    connectedCallback() {
        this.getWeather();
        this.getHolidays();
        this.setDateAndTime();
    }
    renderedCallback() {}

    setDateAndTime() {
        const today = new Date();
        let hour = today.getHours();
        let min = today.getMinutes();
        let sec = today.getSeconds();
        const ap = hour < 12 ? 'AM' : 'PM';
        hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        hour = this.formatNumber(hour);
        min = this.formatNumber(min);
        sec = this.formatNumber(sec);
        this.time = `${hour}:${min}:${sec} ${ap}`;

        const curWeekDay = days[today.getDay()].substring(0, 3);
        const curDay = today.getDate();
        const curMonth = months[today.getMonth()].substring(0, 3);
        const curYear = today.getFullYear();
        //const date = curWeekDay + ', ' + curDay + ' ' + curMonth + ' ' + curYear;
        this.date = `${curWeekDay}, ${curDay} ${curMonth}, ${curYear}`;

        this.setDT = setTimeout(() => {
            this.setDateAndTime();
        }, 500);
    }
    formatNumber(num) {
        return num < 10 ? '0' + num : num;
    }

    getWeather() {
        console.log('getting weather api');
        fetch(`/api/weather?city=${this.city}&countryCode=${this.countryCode}`)
            .then(response => {
                response.json().then(data => {
                    this.currentWeather = data.response.current;
                    this.weatherForecast = data.response.forecast;
                });
            })
            .catch(error => {
                console.error(error);
            });
        //refresh weather after 30 mins
        this.setWeather = setTimeout(() => {
            this.getWeather();
        }, 30 * 60 * 1000);
    }

    getHolidays() {
        console.log('getting Holidays');
        fetch(`/api/holidays?countryCode=${this.countryCode}`)
            .then(response => {
                response.json().then(data => {
                    let holidays = data.response.holidays;
                    if (holidays) {
                        holidays.forEach(item => {
                            let tempDate = new Date(item.date.iso);
                            item.date.cFormattedDate = `
                            ${days[tempDate.getDay()].substring(0, 3)}, 
                            ${tempDate.getDate()} 
                            ${months[tempDate.getMonth()]}`;
                        });
                        this.holidayList = holidays;
                        this.setUpcomingHolidays();
                    }
                });
            })
            .catch(error => {
                console.error(error);
            });
    }

    //filter and set 3 upcoming holidays for the year
    setUpcomingHolidays() {
        console.log('getting filtering');
        const currentDate = new Date();

        if (
            currentDate.getTime() >
            new Date(
                this.holidayList[this.holidayList.length - 1].date.iso
            ).getTime()
        ) {
            this.getHolidays();
        }

        if (
            (this.holidayList && !this.upcomingHolidays) ||
            currentDate.getTime() >
                new Date(this.upcomingHolidays[0].date.iso).getTime()
        ) {
            console.log('setting filtered');
            let filteredHolidays = this.holidayList.filter(item => {
                return (
                    new Date(item.date.iso).getTime() >= currentDate.getTime()
                );
            });
            this.upcomingHolidays = filteredHolidays.slice(0, 3);
        }
        //refresh holidays after 1 hour
        this.setHolidays = setTimeout(() => {
            this.setUpcomingHolidays();
        }, 60 * 60 * 1000);
    }
}
