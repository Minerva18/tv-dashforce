import { LightningElement, api, track } from 'lwc';

export default class liveTwitterFeed extends LightningElement {
    @api socket;

    @track socketInitialized = false;

    @track tweets = [];

    async renderedCallback() {
        if (!this.socketInitialized && this.socket) {
            this.initializeSocket();
        }
    }

    async initializeSocket() {
        //bind the onSocketEvent method to the 'tweet' socket event to update the chart with new incoming data
        this.socket.on('tweet', this.onSocketEvent.bind(this));
        this.socketInitialized = true;
    }

    onSocketEvent(data) {
        this.tweets.unshift(data);
        this.tweets = this.tweets.slice(0, 4);
    }
}
