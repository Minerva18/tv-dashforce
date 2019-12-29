import { LightningElement, api, track } from 'lwc';
import { CountUp } from 'countup.js';

export default class openOpportunities extends LightningElement {
    @api sobject = '';
    @api socket;

    @track socketInitialized = false;
    @track scoreBoardInitialized = false;

    //object to keep track of the aggregate data of open opportunities
    @track openOpportunityData = {
        Total_Value: 0,
        Total_Count: 0,
        Average_Value: 0
    };

    //countUp.js variables for each number place holders number counting animation
    totalValueElem;
    totalCountElem;
    averageValueElem;

    connectedCallback() {}

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
        console.log('initializing open opportunities score board');

        //countUp.js options
        const options = {
            duration: 0.75,
            useEasing: false,
            prefix: '$'
        };

        //get each HTML counting animation placeholder element
        const element_totalValue = this.template.querySelector(
            'div.TotalValue'
        );
        const element_totalCount = this.template.querySelector(
            'div.TotalCount'
        );
        const element_avgValue = this.template.querySelector('div.AvgValue');

        //initialize counting animations for each type of aggregate data
        this.totalValueElem = new CountUp(element_totalValue, 0, options);
        this.totalCountElem = new CountUp(element_totalCount, 0);
        this.averageValueElem = new CountUp(element_avgValue, 0, options);

        this.scoreBoardInitialized = true;
    }

    onSocketEvent(data) {
        const { changeType, entityName } = data.ChangeEventHeader;

        // check to make sure the change event is for the configured sobject and the record event is CREATE and the Opportunity is open
        if (
            this.sobject.toLowerCase() !== entityName.toLowerCase() ||
            changeType !== 'CREATE' ||
            data.IsClosed
        ) {
            return;
        }

        //aggregate data
        this.openOpportunityData.Total_Value += data.Amount;
        this.openOpportunityData.Total_Count += 1;
        this.openOpportunityData.Average_Value =
            this.openOpportunityData.Total_Value /
            this.openOpportunityData.Total_Count;

        //update countUp elements with latest data
        this.totalValueElem.update(this.openOpportunityData.Total_Value);
        this.totalCountElem.update(this.openOpportunityData.Total_Count);
        this.averageValueElem.update(this.openOpportunityData.Average_Value);
    }
}
