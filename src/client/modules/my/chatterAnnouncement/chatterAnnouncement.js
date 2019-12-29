import { LightningElement, api, track } from 'lwc';

export default class chatterAnnouncement extends LightningElement {
    @api socket;

    @track socketInitialized = false;

    @track time;
    @track date;
    @track dateTime;

    @track announcementMessage;

    async renderedCallback() {
        if (!this.socketInitialized && this.socket) {
            this.initializeSocket();
        }
    }

    initializeSocket() {
        //binding onSocketEvent method to the socket event to update the component to show the latest anouncement
        this.socket.on('chatterAnnouncement', this.onSocketEvent.bind(this));
        this.socketInitialized = true;
    }

    onSocketEvent(data) {
        const { payload } = data;

        console.log(`chatter announcement message ${data.payload.Message__c}`);
        //update the announcementMessage property with the latest announcement message
        this.announcementMessage = payload.Message__c;
        //update the date and time on the UI
        this.setDateAndTime();
    }

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
        this.time = `${hour}:${min} ${ap}`;

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
        const curWeekDay = days[today.getDay()];
        const curDay = today.getDate();
        const curMonth = months[today.getMonth()];
        const curYear = today.getFullYear();

        this.date = `${curWeekDay}, ${curDay} ${curMonth}, ${curYear}`;
        this.dateTime = `${this.date} • ${this.time}`;
    }

    formatNumber(num) {
        return num < 10 ? '0' + num : num;
    }
}
