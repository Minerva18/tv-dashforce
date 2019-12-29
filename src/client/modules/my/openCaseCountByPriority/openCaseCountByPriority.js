import { LightningElement, api, track } from 'lwc';
import { CountUp } from 'countup.js';

export default class openCaseCountByPriority extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track scoreBoardInitialized = false;

    //object to keep track of the case count by priority
    @track caseCount = {
        High: 0,
        Medium: 0,
        Low: 0
    };

    //countUp.js variables for each number place holders for counting animation
    highCountElem;
    mediumCountElem;
    lowCountElem;

    renderedCallback() {
        if (!this.socketInitialized && this.socket) {
            this.initializeSocket();
        }
        if (!this.scoreBoardInitialized && this.socketInitialized) {
            this.initializeScoreBoard();
        }
    }

    initializeSocket() {
        //bind the onSocketEvent method to the 'cdc' socket event to update the chart with new incoming data
        this.socket.on('cdc', this.onSocketEvent.bind(this));
        this.socketInitialized = true;
    }

    initializeScoreBoard() {
        console.log('initializing case score board');

        //countUp.js options
        const options = {
            duration: 0.75,
            useEasing: false
        };

        //get each HTML counting animation placeholder element
        const element_highCount = this.template.querySelector('div.HighCount');
        const element_mediumCount = this.template.querySelector(
            'div.MediumCount'
        );
        const element_lowCount = this.template.querySelector('div.LowCount');

        //initialize counting animations for each type of aggregate data
        this.highCountElem = new CountUp(element_highCount, 0, options);
        this.mediumCountElem = new CountUp(element_mediumCount, 0);
        this.lowCountElem = new CountUp(element_lowCount, 0, options);

        this.scoreBoardInitialized = true;
    }

    onSocketEvent(data) {
        const { changeType, entityName } = data.ChangeEventHeader;

        // check to make sure the change event is for the configured sobject and the record event is CREATE and the Case is open
        if (
            this.sobject.toLowerCase() !== entityName.toLowerCase() ||
            changeType !== 'CREATE' ||
            data.IsClosed
        ) {
            return;
        }

        //increment corresponding case count in the caseCount object
        this.caseCount[data.Priority] += 1;

        //update corresponding countUp elements to show latest data
        if (data.Priority === 'High')
            this.highCountElem.update(this.caseCount.High);
        else if (data.Priority === 'Medium')
            this.mediumCountElem.update(this.caseCount.Medium);
        else if (data.Priority === 'Low')
            this.lowCountElem.update(this.caseCount.Low);
    }
}
