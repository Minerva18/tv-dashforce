import { LightningElement, track } from 'lwc';

export default class App extends LightningElement {
    @track socket;
    @track socketReady = false;

    @track time;
    @track date;

    connectedCallback() {
        this.openSocket();
    }

    disconnectedCallback() {
        this.closeSocket();
    }

    async openSocket() {
        //subscribe to socket events that are broadcasted by our dashboard server app
        const io = await require('socket.io-client');
        this.socket = io('http://0.0.0.0:3003');
        this.socket.on('connect', () => {
            console.log('socket connected!');
            this.socketReady = true;
        });
    }

    async closeSocket() {
        this.socket.close();
        this.socket = null;
    }
}
